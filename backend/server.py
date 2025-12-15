from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from enum import Enum
from kubernetes import client as k8s_client, config as k8s_config


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Kubernetes connection
try:
    k8s_config.load_incluster_config()
except k8s_config.ConfigException:
    try:
        k8s_config.load_kube_config()
    except k8s_config.ConfigException:
        logging.warning("Could not load Kubernetes config. K8s integration will be disabled.")

custom_api = k8s_client.CustomObjectsApi()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Enums
class TriggerType(str, Enum):
    CRON = "cron"
    MESSAGE_QUEUE = "message_queue"
    KAFKA = "kafka"
    HTTP = "http"
    PROMETHEUS = "prometheus"
    CUSTOM = "custom"

class ScaledObjectType(str, Enum):
    DEPLOYMENT = "deployment"
    STATEFULSET = "statefulset"
    JOB = "job"

class EventStatus(str, Enum):
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"


# Models
class TriggerConfig(BaseModel):
    trigger_type: TriggerType
    cron_expression: Optional[str] = None
    desired_replicas: int = 1
    metadata: Dict[str, Any] = {}


class ScaledObjectBase(BaseModel):
    name: str
    namespace: str = "default"
    target_deployment: str
    target_type: ScaledObjectType = ScaledObjectType.DEPLOYMENT
    min_replicas: int = 0
    max_replicas: int = 10
    triggers: List[TriggerConfig]
    labels: Dict[str, str] = {}


class ScaledObject(ScaledObjectBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CalendarEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    start: datetime
    end: Optional[datetime] = None
    all_day: bool = False
    trigger_type: TriggerType
    scaled_object_id: str
    target_deployment: str
    desired_replicas: int
    cron_expression: Optional[str] = None
    status: EventStatus = EventStatus.SCHEDULED
    color: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CalendarEventCreate(BaseModel):
    title: str
    start: str  # ISO format
    end: Optional[str] = None
    all_day: bool = False
    trigger_type: TriggerType
    target_deployment: str
    desired_replicas: int = 1
    cron_expression: Optional[str] = None
    metadata: Dict[str, Any] = {}


class Deployment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    namespace: str = "default"
    current_replicas: int = 0
    labels: Dict[str, str] = {}


class NamespaceInfo(BaseModel):
    name: str
    total_events: int
    total_deployments: int
    total_scaled_objects: int
    active_events: int


# Helper functions
def get_event_color(trigger_type: TriggerType) -> str:
    """Return color code based on trigger type"""
    color_map = {
        TriggerType.CRON: "#3b82f6",  # Blue
        TriggerType.MESSAGE_QUEUE: "#10b981",  # Green
        TriggerType.KAFKA: "#f59e0b",  # Amber
        TriggerType.HTTP: "#8b5cf6",  # Purple
        TriggerType.PROMETHEUS: "#ef4444",  # Red
        TriggerType.CUSTOM: "#6b7280"  # Gray
    }
    return color_map.get(trigger_type, "#3b82f6")


# Routes
@api_router.get("/")
async def root():
    return {"message": "KEDA Calendar Control Center API", "version": "1.0.0"}


@api_router.get("/namespace-info", response_model=NamespaceInfo)
async def get_namespace_info():
    """Get namespace information and statistics"""
    total_events = await db.calendar_events.count_documents({})
    total_deployments = await db.deployments.count_documents({})
    total_scaled_objects = await db.scaled_objects.count_documents({})
    active_events = await db.calendar_events.count_documents({"status": "active"})
    
    return NamespaceInfo(
        name="keda-system",
        total_events=total_events,
        total_deployments=total_deployments,
        total_scaled_objects=total_scaled_objects,
        active_events=active_events
    )


@api_router.get("/deployments", response_model=List[Deployment])
async def get_deployments():
    """List all deployments"""
    deployments = await db.deployments.find({}, {"_id": 0}).to_list(1000)
    return deployments


@api_router.post("/deployments", response_model=Deployment)
async def create_deployment(deployment: Deployment):
    """Create a new deployment"""
    doc = deployment.model_dump()
    await db.deployments.insert_one(doc)
    return deployment


@api_router.get("/events", response_model=List[CalendarEvent])
async def get_events():
    """Get all calendar events"""
    events = await db.calendar_events.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO strings back to datetime
    for event in events:
        if isinstance(event['start'], str):
            event['start'] = datetime.fromisoformat(event['start'])
        if event.get('end') and isinstance(event['end'], str):
            event['end'] = datetime.fromisoformat(event['end'])
        if isinstance(event['created_at'], str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    
    return events


@api_router.post("/events", response_model=CalendarEvent)
async def create_event(event_data: CalendarEventCreate):
    """Create a new calendar event"""
    # Parse datetime strings
    start_dt = datetime.fromisoformat(event_data.start.replace('Z', '+00:00'))
    end_dt = None
    if event_data.end:
        end_dt = datetime.fromisoformat(event_data.end.replace('Z', '+00:00'))
    
    # Create scaled object
    scaled_obj = ScaledObject(
        name=f"scaled-{event_data.target_deployment}-{uuid.uuid4().hex[:8]}",
        namespace="keda-system",
        target_deployment=event_data.target_deployment,
        triggers=[TriggerConfig(
            trigger_type=event_data.trigger_type,
            cron_expression=event_data.cron_expression,
            desired_replicas=event_data.desired_replicas,
            metadata=event_data.metadata
        )]
    )
    
    scaled_obj_doc = scaled_obj.model_dump()
    scaled_obj_doc['created_at'] = scaled_obj_doc['created_at'].isoformat()
    scaled_obj_doc['updated_at'] = scaled_obj_doc['updated_at'].isoformat()
    await db.scaled_objects.insert_one(scaled_obj_doc)
    
    # Create calendar event
    event = CalendarEvent(
        title=event_data.title,
        start=start_dt,
        end=end_dt,
        all_day=event_data.all_day,
        trigger_type=event_data.trigger_type,
        scaled_object_id=scaled_obj.id,
        target_deployment=event_data.target_deployment,
        desired_replicas=event_data.desired_replicas,
        cron_expression=event_data.cron_expression,
        color=get_event_color(event_data.trigger_type),
        metadata=event_data.metadata
    )
    
    event_doc = event.model_dump()
    event_doc['start'] = event_doc['start'].isoformat()
    if event_doc['end']:
        event_doc['end'] = event_doc['end'].isoformat()
    event_doc['created_at'] = event_doc['created_at'].isoformat()
    
    await db.calendar_events.insert_one(event_doc)
    return event


@api_router.get("/events/{event_id}", response_model=CalendarEvent)
async def get_event(event_id: str):
    """Get a specific event"""
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Convert ISO strings to datetime
    if isinstance(event['start'], str):
        event['start'] = datetime.fromisoformat(event['start'])
    if event.get('end') and isinstance(event['end'], str):
        event['end'] = datetime.fromisoformat(event['end'])
    if isinstance(event['created_at'], str):
        event['created_at'] = datetime.fromisoformat(event['created_at'])
    
    return event


@api_router.put("/events/{event_id}", response_model=CalendarEvent)
async def update_event(event_id: str, event_data: CalendarEventCreate):
    """Update an existing event"""
    existing = await db.calendar_events.find_one({"id": event_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Parse datetime strings
    start_dt = datetime.fromisoformat(event_data.start.replace('Z', '+00:00'))
    end_dt = None
    if event_data.end:
        end_dt = datetime.fromisoformat(event_data.end.replace('Z', '+00:00'))
    
    # Update event
    update_doc = {
        "title": event_data.title,
        "start": start_dt.isoformat(),
        "end": end_dt.isoformat() if end_dt else None,
        "all_day": event_data.all_day,
        "trigger_type": event_data.trigger_type,
        "target_deployment": event_data.target_deployment,
        "desired_replicas": event_data.desired_replicas,
        "cron_expression": event_data.cron_expression,
        "color": get_event_color(event_data.trigger_type),
        "metadata": event_data.metadata
    }
    
    await db.calendar_events.update_one({"id": event_id}, {"$set": update_doc})
    
    # Get updated event
    updated = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    updated['start'] = datetime.fromisoformat(updated['start'])
    if updated.get('end'):
        updated['end'] = datetime.fromisoformat(updated['end'])
    updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    return updated


@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str):
    """Delete an event"""
    event = await db.calendar_events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Delete associated scaled object
    await db.scaled_objects.delete_one({"id": event['scaled_object_id']})
    
    # Delete event
    result = await db.calendar_events.delete_one({"id": event_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {"message": "Event deleted successfully"}


@api_router.get("/scaled-objects", response_model=List[ScaledObject])
async def get_scaled_objects():
    """Get all scaled objects from Kubernetes cluster"""
    try:
        # Fetch from Kubernetes
        k8s_objects = custom_api.list_cluster_custom_object(
            group="keda.sh",
            version="v1alpha1",
            plural="scaledobjects"
        )
        
        scaled_objects = []
        for item in k8s_objects.get('items', []):
            metadata = item.get('metadata', {})
            spec = item.get('spec', {})
            
            # Parse triggers
            triggers = []
            for trigger in spec.get('triggers', []):
                triggers.append(TriggerConfig(
                    trigger_type=trigger.get('type', 'custom'),
                    metadata=trigger.get('metadata', {}),
                    desired_replicas=1 # Default as it might not be in trigger spec
                ))
            
            # Create ScaledObject model
            obj = ScaledObject(
                name=metadata.get('name'),
                namespace=metadata.get('namespace', 'default'),
                target_deployment=spec.get('scaleTargetRef', {}).get('name', ''),
                min_replicas=spec.get('minReplicaCount', 0),
                max_replicas=spec.get('maxReplicaCount', 10),
                triggers=triggers,
                labels=metadata.get('labels', {}),
                id=metadata.get('uid', str(uuid.uuid4())),
                created_at=datetime.fromisoformat(metadata.get('creationTimestamp').replace('Z', '+00:00')) if metadata.get('creationTimestamp') else datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            scaled_objects.append(obj)
            
        return scaled_objects
        
    except Exception as e:
        logger.error(f"Error fetching ScaledObjects from K8s: {e}")
        # Fallback to DB if K8s fails or not configured
        logger.info("Falling back to local database")
        scaled_objects = await db.scaled_objects.find({}, {"_id": 0}).to_list(1000)
        
        for obj in scaled_objects:
            if isinstance(obj['created_at'], str):
                obj['created_at'] = datetime.fromisoformat(obj['created_at'])
            if isinstance(obj['updated_at'], str):
                obj['updated_at'] = datetime.fromisoformat(obj['updated_at'])
        
        return scaled_objects


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

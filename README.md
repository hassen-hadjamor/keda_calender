# KEDA Calendar Control Center

A Kubernetes-native web application that provides a GUI interface for KEDA (Kubernetes Event-Driven Autoscaler).

## Features

- 📅 **Interactive Calendar**: Month/Week/Day/List views for visualizing scaling events
- 🎨 **Color-Coded Events**: Visual distinction between trigger types (Cron, Message Queue, Kafka, HTTP, Prometheus, Custom)
- ⚙️ **Event Management**: Create, edit, and delete scaling events directly from the calendar
- 📊 **Dashboard**: Real-time statistics for namespace, deployments, and scaled objects
- 🚀 **Simulated KEDA**: Mock environment for development and testing

## Tech Stack

- **Backend**: FastAPI + MongoDB
- **Frontend**: React + FullCalendar + Tailwind CSS
- **Containerization**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Ports 3000, 8001, and 27017 available

### Running with Docker Compose

1. Clone the repository:
```bash
git clone <repository-url>
cd keda-calendar-control-center
```

2. Start all services:
```bash
docker-compose up -d
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api
- API Docs: http://localhost:8001/docs

4. Stop all services:
```bash
docker-compose down
```

5. Stop and remove volumes:
```bash
docker-compose down -v
```

### Building Individual Images

#### Backend
```bash
cd backend
docker build -t keda-backend:latest .
docker run -p 8001:8001 \
  -e MONGO_URL=mongodb://localhost:27017 \
  -e DB_NAME=keda_db \
  keda-backend:latest
```

#### Frontend
```bash
cd frontend
docker build -t keda-frontend:latest \
  --build-arg REACT_APP_BACKEND_URL=http://localhost:8001 .
docker run -p 3000:80 keda-frontend:latest
```

## Development

### Local Development (without Docker)

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

#### Frontend
```bash
cd frontend
yarn install
yarn start
```

## API Endpoints

- `GET /api/` - API information
- `GET /api/namespace-info` - Namespace statistics
- `GET /api/deployments` - List all deployments
- `GET /api/events` - List all calendar events
- `POST /api/events` - Create a new event
- `GET /api/events/{id}` - Get event details
- `PUT /api/events/{id}` - Update an event
- `DELETE /api/events/{id}` - Delete an event
- `GET /api/scaled-objects` - List all scaled objects

## Trigger Types

1. **Cron** (Blue) - Time-based scaling with cron expressions
2. **Message Queue** (Green) - Queue-based scaling (RabbitMQ, Azure Queue, etc.)
3. **Kafka** (Amber) - Kafka topic-based scaling
4. **HTTP** (Purple) - HTTP endpoint-based scaling
5. **Prometheus** (Red) - Prometheus metrics-based scaling
6. **Custom** (Gray) - Custom scaler implementation

## Environment Variables

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=keda_db
CORS_ORIGINS=*
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   MongoDB   │
│   (React)   │     │  (FastAPI)  │     │             │
│  Port 3000  │     │  Port 8001  │     │  Port 27017 │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Production Deployment

For production deployment:

1. Update environment variables in `.env` files
2. Build production images:
```bash
docker-compose -f docker-compose.yml build
```

3. Push to container registry:
```bash
docker tag keda-backend:latest your-registry/keda-backend:v1.0.0
docker tag keda-frontend:latest your-registry/keda-frontend:v1.0.0
docker push your-registry/keda-backend:v1.0.0
docker push your-registry/keda-frontend:v1.0.0
```

4. Deploy to Kubernetes cluster with appropriate manifests

## License

MIT License

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

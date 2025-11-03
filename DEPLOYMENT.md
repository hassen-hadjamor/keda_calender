# Deployment Guide

## Table of Contents
1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment](#production-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Environment Variables](#environment-variables)
6. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB 7.0+
- Yarn package manager

### Setup

1. **Install Backend Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

2. **Install Frontend Dependencies**
```bash
cd frontend
yarn install
```

3. **Configure Environment**
```bash
# Backend .env
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB connection

# Frontend .env
cp frontend/.env.example frontend/.env
# Edit frontend/.env with backend URL
```

4. **Start Services**
```bash
# Terminal 1: Start MongoDB
mongod --dbpath /path/to/data

# Terminal 2: Start Backend
cd backend
uvicorn server:app --reload --port 8001

# Terminal 3: Start Frontend
cd frontend
yarn start
```

5. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs

---

## Docker Deployment

### Quick Start with Docker Compose

1. **Start All Services**
```bash
# Using Makefile (recommended)
make up

# Or using docker-compose directly
docker-compose up -d
```

2. **View Logs**
```bash
make logs
# Or for specific service
make logs-backend
make logs-frontend
```

3. **Stop Services**
```bash
make down
```

### Available Make Commands

```bash
make help          # Show all available commands
make build         # Build Docker images
make up            # Start services
make down          # Stop services
make logs          # View logs
make restart       # Restart services
make rebuild       # Rebuild and restart
make clean         # Remove all containers and images
make shell-backend # Open backend shell
make backup-db     # Backup database
```

### Manual Docker Build

```bash
# Build Backend
docker build -t keda-backend:latest ./backend

# Build Frontend
docker build -t keda-frontend:latest \
  --build-arg REACT_APP_BACKEND_URL=http://localhost:8001 \
  ./frontend

# Run Backend
docker run -d -p 8001:8001 \
  -e MONGO_URL=mongodb://host.docker.internal:27017 \
  -e DB_NAME=keda_db \
  keda-backend:latest

# Run Frontend
docker run -d -p 3000:80 keda-frontend:latest
```

---

## Production Deployment

### Using Production Docker Compose

1. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with production values
```

2. **Start Production Services**
```bash
make build-prod
make up-prod
```

### Environment Configuration

Create a `.env` file:

```env
# MongoDB
MONGO_USERNAME=admin
MONGO_PASSWORD=your-secure-password

# Backend
CORS_ORIGINS=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Frontend
FRONTEND_PORT=80
```

### With Nginx Reverse Proxy

1. **Create Nginx Configuration**
```bash
mkdir -p nginx
```

2. **Start with Proxy**
```bash
docker-compose -f docker-compose.prod.yml --profile with-proxy up -d
```

---

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.24+)
- kubectl configured
- Helm 3+ (optional)

### Deploy with Kubectl

1. **Create Namespace**
```bash
kubectl create namespace keda-calendar
```

2. **Create ConfigMap**
```bash
kubectl create configmap keda-config \
  --from-literal=MONGO_URL=mongodb://mongodb-service:27017 \
  --from-literal=DB_NAME=keda_db \
  -n keda-calendar
```

3. **Create Secrets**
```bash
kubectl create secret generic keda-secrets \
  --from-literal=MONGO_USERNAME=admin \
  --from-literal=MONGO_PASSWORD=your-password \
  -n keda-calendar
```

4. **Deploy MongoDB**
```yaml
# mongodb-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
  namespace: keda-calendar
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:7.0
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          valueFrom:
            secretKeyRef:
              name: keda-secrets
              key: MONGO_USERNAME
        - name: MONGO_INITDB_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: keda-secrets
              key: MONGO_PASSWORD
        volumeMounts:
        - name: mongo-storage
          mountPath: /data/db
      volumes:
      - name: mongo-storage
        persistentVolumeClaim:
          claimName: mongodb-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb-service
  namespace: keda-calendar
spec:
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
```

5. **Deploy Backend**
```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keda-backend
  namespace: keda-calendar
spec:
  replicas: 2
  selector:
    matchLabels:
      app: keda-backend
  template:
    metadata:
      labels:
        app: keda-backend
    spec:
      containers:
      - name: backend
        image: your-registry/keda-backend:latest
        ports:
        - containerPort: 8001
        envFrom:
        - configMapRef:
            name: keda-config
        env:
        - name: MONGO_PASSWORD
          valueFrom:
            secretKeyRef:
              name: keda-secrets
              key: MONGO_PASSWORD
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: keda-calendar
spec:
  selector:
    app: keda-backend
  ports:
  - port: 8001
    targetPort: 8001
```

6. **Deploy Frontend**
```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keda-frontend
  namespace: keda-calendar
spec:
  replicas: 2
  selector:
    matchLabels:
      app: keda-frontend
  template:
    metadata:
      labels:
        app: keda-frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/keda-frontend:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: keda-calendar
spec:
  type: LoadBalancer
  selector:
    app: keda-frontend
  ports:
  - port: 80
    targetPort: 80
```

7. **Apply Manifests**
```bash
kubectl apply -f mongodb-deployment.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
```

8. **Create Ingress (Optional)**
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: keda-ingress
  namespace: keda-calendar
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - keda.yourdomain.com
    - api.keda.yourdomain.com
    secretName: keda-tls
  rules:
  - host: keda.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
  - host: api.keda.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 8001
```

---

## Environment Variables

### Backend Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` | Yes |
| `DB_NAME` | Database name | `keda_db` | Yes |
| `CORS_ORIGINS` | Allowed CORS origins | `*` | No |

### Frontend Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_BACKEND_URL` | Backend API URL | `http://localhost:8001` | Yes |

---

## Troubleshooting

### Common Issues

#### 1. Frontend Can't Connect to Backend

```bash
# Check backend is running
curl http://localhost:8001/api/

# Check CORS settings
# Ensure REACT_APP_BACKEND_URL is correct in frontend/.env
```

#### 2. MongoDB Connection Error

```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check logs
docker-compose logs mongodb

# Test connection
mongosh mongodb://localhost:27017
```

#### 3. Port Already in Use

```bash
# Find process using port
lsof -i :8001
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### 4. Docker Build Fails

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
make rebuild
```

### Health Checks

```bash
# Check all services
make health

# Check specific endpoints
curl http://localhost:8001/api/
curl http://localhost:3000
```

### Logs

```bash
# All services
make logs

# Specific service
make logs-backend
make logs-frontend
make logs-db

# Follow specific container
docker logs -f keda-backend
```

### Database Operations

```bash
# Backup
make backup-db

# Restore
make restore-db

# Access MongoDB shell
make shell-db

# List databases
docker-compose exec mongodb mongosh --eval "show dbs"
```

---

## Monitoring

### Docker Stats

```bash
docker stats keda-backend keda-frontend keda-mongodb
```

### Container Health

```bash
docker inspect --format='{{.State.Health.Status}}' keda-backend
docker inspect --format='{{.State.Health.Status}}' keda-frontend
```

### Resource Usage

```bash
# Check resource usage
docker-compose top

# Check specific container
docker top keda-backend
```

---

## Security Best Practices

1. **Use Strong Passwords**
   - Change default MongoDB credentials
   - Use environment variables, never hardcode

2. **Enable Authentication**
   - Enable MongoDB authentication in production
   - Use secrets management (Vault, AWS Secrets Manager)

3. **Network Security**
   - Use internal Docker networks
   - Limit exposed ports
   - Use HTTPS in production

4. **Keep Images Updated**
   ```bash
   docker pull mongo:7.0
   docker pull python:3.11-slim
   docker pull node:18-alpine
   ```

5. **Scan for Vulnerabilities**
   ```bash
   docker scan keda-backend:latest
   docker scan keda-frontend:latest
   ```

---

## Performance Optimization

1. **Enable Caching**
   - Use Redis for session storage
   - Enable browser caching for static assets

2. **Database Indexing**
   ```javascript
   // Create indexes in MongoDB
   db.calendar_events.createIndex({ start: 1 })
   db.calendar_events.createIndex({ target_deployment: 1 })
   ```

3. **Resource Limits**
   ```yaml
   # In docker-compose.yml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '1'
             memory: 512M
   ```

---

## Support

For issues and questions:
- GitHub Issues: [your-repo/issues]
- Documentation: [your-docs-url]
- Email: [your-email]

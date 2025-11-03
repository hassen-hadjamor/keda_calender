# KEDA Calendar Control Center - Quick Reference

## Docker Commands Cheat Sheet

### Starting the Application

```bash
# Using Make (Recommended)
make up                  # Start all services in detached mode
make dev                 # Start with logs attached

# Using Docker Compose
docker-compose up -d     # Start all services
docker-compose up        # Start with logs
```

### Stopping the Application

```bash
make down                # Stop all services
make down-clean          # Stop and remove volumes
```

### Viewing Logs

```bash
make logs                # All services
make logs-backend        # Backend only
make logs-frontend       # Frontend only
make logs-db             # MongoDB only
```

### Building Images

```bash
make build               # Build all images
make rebuild             # Rebuild without cache
```

### Accessing Services

```bash
# Frontend
http://localhost:3000

# Backend API
http://localhost:8001

# API Documentation
http://localhost:8001/docs

# MongoDB
mongodb://localhost:27017
```

### Container Shell Access

```bash
make shell-backend       # Backend container
make shell-frontend      # Frontend container
make shell-db           # MongoDB shell
```

### Database Operations

```bash
make backup-db          # Backup database
make restore-db         # Restore from backup
```

### Health Checks

```bash
make health             # Check all services
make ps                 # List running containers
```

### Cleanup

```bash
make clean              # Remove everything
docker system prune -a  # Clean Docker system
```

## Project Structure

```
.
├── backend/
│   ├── Dockerfile              # Backend container config
│   ├── .dockerignore          # Backend ignore file
│   ├── server.py              # FastAPI application
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── Dockerfile             # Frontend container config
│   ├── .dockerignore          # Frontend ignore file
│   ├── nginx.conf             # Nginx configuration
│   ├── package.json           # Node dependencies
│   └── src/                   # React source code
├── docker-compose.yml         # Development compose file
├── docker-compose.prod.yml    # Production compose file
├── Makefile                   # Build automation
├── README.md                  # Project documentation
└── DEPLOYMENT.md              # Deployment guide
```

## Environment Variables

### Backend (.env)
```env
MONGO_URL=mongodb://mongodb:27017
DB_NAME=keda_db
CORS_ORIGINS=*
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Common Issues & Solutions

### Port Already in Use
```bash
# Find and kill process
lsof -i :3000
lsof -i :8001
kill -9 <PID>
```

### Container Won't Start
```bash
# Check logs
docker-compose logs <service-name>

# Restart service
docker-compose restart <service-name>
```

### Cannot Connect to Backend
```bash
# Verify backend is running
curl http://localhost:8001/api/

# Check network
docker network inspect keda-calendar_keda-network
```

### Database Connection Error
```bash
# Check MongoDB status
docker-compose ps mongodb

# Test connection
docker-compose exec mongodb mongosh
```

## Production Deployment

### Build for Production
```bash
make build-prod
make up-prod
```

### Push to Registry
```bash
export REGISTRY=your-registry.com
make push
```

### Pull from Registry
```bash
export REGISTRY=your-registry.com
make pull
```

## Monitoring

### Resource Usage
```bash
docker stats keda-backend keda-frontend keda-mongodb
```

### Container Health
```bash
docker inspect --format='{{.State.Health.Status}}' keda-backend
docker inspect --format='{{.State.Health.Status}}' keda-frontend
```

## Development Workflow

1. **Make Changes**
   ```bash
   # Edit code in backend/ or frontend/
   ```

2. **Rebuild & Restart**
   ```bash
   make rebuild
   ```

3. **Test Changes**
   ```bash
   # Access http://localhost:3000
   make logs
   ```

4. **Commit & Push**
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

## CI/CD Pipeline

GitHub Actions automatically:
- Builds Docker images on push
- Runs tests
- Pushes to container registry
- Tags with version numbers

See `.github/workflows/docker-build.yml`

## Support

- Documentation: See README.md and DEPLOYMENT.md
- Issues: Open a GitHub issue
- Help: `make help` for all available commands

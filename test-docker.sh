#!/bin/bash

echo "=================================="
echo "KEDA Calendar Docker Setup Test"
echo "=================================="
echo ""

# Check if Docker is installed
echo "1. Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi
echo "✅ Docker is installed: $(docker --version)"
echo ""

# Check if Docker Compose is installed
echo "2. Checking Docker Compose installation..."
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi
echo "✅ Docker Compose is installed: $(docker-compose --version)"
echo ""

# Check Dockerfile existence
echo "3. Checking Dockerfiles..."
if [ ! -f backend/Dockerfile ]; then
    echo "❌ Backend Dockerfile not found"
    exit 1
fi
echo "✅ Backend Dockerfile exists"

if [ ! -f frontend/Dockerfile ]; then
    echo "❌ Frontend Dockerfile not found"
    exit 1
fi
echo "✅ Frontend Dockerfile exists"
echo ""

# Check docker-compose.yml
echo "4. Checking docker-compose files..."
if [ ! -f docker-compose.yml ]; then
    echo "❌ docker-compose.yml not found"
    exit 1
fi
echo "✅ docker-compose.yml exists"

if [ ! -f docker-compose.prod.yml ]; then
    echo "❌ docker-compose.prod.yml not found"
    exit 1
fi
echo "✅ docker-compose.prod.yml exists"
echo ""

# Validate docker-compose syntax
echo "5. Validating docker-compose configuration..."
if docker-compose -f docker-compose.yml config > /dev/null 2>&1; then
    echo "✅ docker-compose.yml is valid"
else
    echo "❌ docker-compose.yml has syntax errors"
    exit 1
fi
echo ""

# Check .dockerignore files
echo "6. Checking .dockerignore files..."
if [ ! -f backend/.dockerignore ]; then
    echo "⚠️  Backend .dockerignore not found (optional)"
else
    echo "✅ Backend .dockerignore exists"
fi

if [ ! -f frontend/.dockerignore ]; then
    echo "⚠️  Frontend .dockerignore not found (optional)"
else
    echo "✅ Frontend .dockerignore exists"
fi
echo ""

# Check Makefile
echo "7. Checking Makefile..."
if [ ! -f Makefile ]; then
    echo "⚠️  Makefile not found (optional)"
else
    echo "✅ Makefile exists"
fi
echo ""

# Summary
echo "=================================="
echo "Docker Setup Verification Complete!"
echo "=================================="
echo ""
echo "📦 All Docker configuration files are in place"
echo ""
echo "Next steps:"
echo "  1. Build images:     make build    or    docker-compose build"
echo "  2. Start services:   make up       or    docker-compose up -d"
echo "  3. View logs:        make logs     or    docker-compose logs -f"
echo "  4. Stop services:    make down     or    docker-compose down"
echo ""
echo "For more commands, run: make help"
echo ""


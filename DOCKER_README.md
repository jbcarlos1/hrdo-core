# Docker Setup for HRDO Core

This document provides comprehensive instructions for containerizing and running the HRDO Core application using Docker.

## Prerequisites

-   Docker Desktop installed and running
-   Docker Compose installed
-   Your `.env` file properly configured

## Quick Start

### 1. Development Environment (Recommended for local testing)

```bash
# Build and run the development container
docker-compose -f docker-compose.dev.yml up --build

# Or run in detached mode
docker-compose -f docker-compose.dev.yml up --build -d
```

The app will be available at `http://localhost:3000`

### 2. Production Environment

```bash
# Build and run the production container
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

## Docker Commands

### Build Images

```bash
# Build development image
docker build -f Dockerfile.dev -t hrdo-core:dev .

# Build production image
docker build -t hrdo-core:prod .
```

### Run Containers

```bash
# Run development container
docker run -p 3000:3000 --env-file .env hrdo-core:dev

# Run production container
docker run -p 3000:3000 --env-file .env hrdo-core:prod
```

### Container Management

```bash
# View running containers
docker ps

# View logs
docker logs <container_id>

# Stop containers
docker-compose down

# Remove containers and images
docker-compose down --rmi all
```

## Environment Variables

Ensure your `.env` file contains all required variables:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
RESEND_API_KEY="your-resend-api-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

## Troubleshooting

### Authentication Issues

1. **Check AUTH_SECRET**: Ensure it's properly set and consistent
2. **Database Connection**: Verify DATABASE_URL is accessible from container
3. **Environment Variables**: Ensure all required vars are loaded

### Common Problems

#### Port Already in Use

```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process or use a different port
docker-compose -f docker-compose.dev.yml up -p 3001:3000
```

#### Database Connection Issues

```bash
# Test database connection from host
psql "your-database-url"

# Check container logs
docker logs <container_id>
```

#### Build Failures

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Health Check

The application includes a health check endpoint at `/api/health` that:

-   Tests database connectivity
-   Returns application status
-   Used by Docker for container health monitoring

## File Structure

```
├── Dockerfile              # Production Dockerfile
├── Dockerfile.dev          # Development Dockerfile
├── docker-compose.yml      # Production compose
├── docker-compose.dev.yml  # Development compose
├── .dockerignore           # Docker build exclusions
└── DOCKER_README.md        # This file
```

## Migration to VPS

When you're ready to migrate to a VPS:

1. **Update Environment Variables**:

    - Change `NEXT_PUBLIC_APP_URL` to your VPS domain
    - Update `DATABASE_URL` to your local PostgreSQL instance

2. **Database Migration**:

    - Export data from Neon: `pg_dump your-neon-db > backup.sql`
    - Import to VPS: `psql your-vps-db < backup.sql`

3. **Deploy**:
    - Copy Docker files to VPS
    - Run `docker-compose up -d`

## Performance Optimization

### Production Build

-   Uses multi-stage builds
-   Leverages Next.js standalone output
-   Optimized for production with minimal dependencies

### Development Build

-   Includes all dependencies for development
-   Volume mounting for hot reloading
-   Faster rebuilds during development

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Container Security**: Runs as non-root user
3. **Network Isolation**: Uses Docker's default bridge network
4. **Health Checks**: Monitors application and database health

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Docker and container logs
3. Verify environment variable configuration
4. Ensure database connectivity

## Next Steps

1. Test the Docker setup locally
2. Verify all functionality works in containers
3. Prepare VPS environment
4. Plan database migration strategy
5. Deploy to VPS when ready

#!/bin/bash

# Docker management scripts for HRDO Core

echo "HRDO Core Docker Management Script"
echo "=================================="

case "$1" in
    "dev")
        echo "Starting development environment..."
        docker-compose -f docker-compose.dev.yml up --build
        ;;
    "dev-detached")
        echo "Starting development environment in detached mode..."
        docker-compose -f docker-compose.dev.yml up --build -d
        ;;
    "prod")
        echo "Starting production environment..."
        docker-compose up --build
        ;;
    "prod-detached")
        echo "Starting production environment in detached mode..."
        docker-compose up --build -d
        ;;
    "stop")
        echo "Stopping all containers..."
        docker-compose down
        docker-compose -f docker-compose.dev.yml down
        ;;
    "logs")
        echo "Showing container logs..."
        docker-compose logs -f
        ;;
    "logs-dev")
        echo "Showing development container logs..."
        docker-compose -f docker-compose.dev.yml logs -f
        ;;
    "clean")
        echo "Cleaning up Docker resources..."
        docker system prune -a -f
        docker volume prune -f
        ;;
    "rebuild")
        echo "Rebuilding containers..."
        docker-compose down --rmi all
        docker-compose up --build
        ;;
    "rebuild-dev")
        echo "Rebuilding development containers..."
        docker-compose -f docker-compose.dev.yml down --rmi all
        docker-compose -f docker-compose.dev.yml up --build
        ;;
    "status")
        echo "Container status:"
        docker ps -a
        ;;
    *)
        echo "Usage: $0 {dev|dev-detached|prod|prod-detached|stop|logs|logs-dev|clean|rebuild|rebuild-dev|status}"
        echo ""
        echo "Commands:"
        echo "  dev           - Start development environment"
        echo "  dev-detached  - Start development environment in background"
        echo "  prod          - Start production environment"
        echo "  prod-detached - Start production environment in background"
        echo "  stop          - Stop all containers"
        echo "  logs          - Show production container logs"
        echo "  logs-dev      - Show development container logs"
        echo "  clean         - Clean up Docker resources"
        echo "  rebuild       - Rebuild production containers"
        echo "  rebuild-dev   - Rebuild development containers"
        echo "  status        - Show container status"
        exit 1
        ;;
esac

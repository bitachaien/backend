#!/bin/bash

# Path to the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Default environment is development
ENVIRONMENT="development"

# Check for --prod argument
if [ "$1" == "--prod" ]; then
  ENVIRONMENT="production"
fi

echo "🔄 Checking for Docker installation..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker could not be found. Please install Docker and try again."
    exit 1
fi

echo "✅ Docker is installed."

echo "🔄 Checking for Docker Compose installation..."

# Check if Docker Compose is installed and determine which command to use
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
    echo "✅ Docker Compose (standalone) is installed."
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
    echo "✅ Docker Compose (plugin) is installed."
else
    echo "❌ Docker Compose could not be found. Please install Docker Compose and try again."
    exit 1
fi

# Run the install script
echo "🔄 Running Deploy Script ..."
# chmod 777 "$PROJECT_ROOT/bin/build_push.sh"
# bash "$PROJECT_ROOT/bin/build_push.sh"

# Inject NODE_ENV into .env file
echo "NODE_ENV=$ENVIRONMENT" >> "$PROJECT_ROOT/.env"
echo ""
echo "🔄 NODE_ENV set to $ENVIRONMENT in .env file."

# Start the Build Docker Image
echo "🔄 Starting Build Docker Image..."

docker build -t 78968-server:latest .

echo "✅ Docker image builded."

# Start the Push To Registry
echo "🔄 Starting Push Image To Registry..."

docker push registry.comcho.net/78968-server:latest

echo "✅ Deploy Success."
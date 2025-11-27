#!/bin/bash

# ===========================================
# EZCR Staging Deployment Script
# ===========================================
# Usage: ./deploy.sh
#
# This script deploys the EZCR Next.js app to staging.ezcycleramp.com
# ===========================================

set -e  # Exit on any error

# Configuration
VPS_HOST="root@5.161.187.109"
CONTAINER_NAME="ezcr-nextjs"
IMAGE_NAME="ezcr-nextjs-prod"
REPO_URL="https://github.com/mocamGitHub/ezcr.git"
APP_DIR="/opt/ezcr-staging"
NETWORK="coolify"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo "  EZCR Staging Deployment"
echo -e "==========================================${NC}"
echo ""

# Check if we should push to git first
if [[ "$1" != "--skip-git" ]]; then
    echo -e "${YELLOW}Step 1: Checking for uncommitted changes...${NC}"

    if [[ -n $(git status --porcelain) ]]; then
        echo -e "${YELLOW}Uncommitted changes detected. Commit and push first?${NC}"
        read -p "Press Enter to continue or Ctrl+C to cancel..."

        git add -A
        git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" || true
        git push origin main
        echo -e "${GREEN}✓ Changes pushed to GitHub${NC}"
    else
        echo -e "${GREEN}✓ Working directory clean${NC}"
    fi
else
    echo -e "${YELLOW}Skipping git push (--skip-git flag)${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2: Connecting to VPS and pulling latest code...${NC}"

ssh $VPS_HOST << 'ENDSSH'
set -e

APP_DIR="/opt/ezcr-staging"
CONTAINER_NAME="ezcr-nextjs"
IMAGE_NAME="ezcr-nextjs-prod"
NETWORK="coolify"

echo "Pulling latest code from GitHub..."
if [ -d "$APP_DIR" ]; then
    cd $APP_DIR
    git fetch origin
    git reset --hard origin/main
else
    git clone https://github.com/mocamGitHub/ezcr.git $APP_DIR
    cd $APP_DIR
fi

echo "Building Docker image..."
docker build -t $IMAGE_NAME:latest --build-arg CACHEBUST=$(date +%s) .

echo "Stopping existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

echo "Starting new container..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    --network $NETWORK \
    -p 3001:3000 \
    -e NODE_ENV=production \
    -e PORT=3000 \
    -e HOSTNAME=0.0.0.0 \
    --env-file $APP_DIR/.env.production \
    $IMAGE_NAME:latest

echo "Waiting for container to start..."
sleep 5

echo "Checking container health..."
if docker exec $CONTAINER_NAME curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "Container is healthy!"
else
    echo "Warning: Health check failed, checking logs..."
    docker logs --tail 20 $CONTAINER_NAME
fi

echo ""
echo "Container status:"
docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

ENDSSH

echo ""
echo -e "${GREEN}=========================================="
echo "  Deployment Complete!"
echo -e "==========================================${NC}"
echo ""
echo "Your staging site is live at:"
echo -e "  ${BLUE}https://staging.ezcycleramp.com${NC}"
echo -e "  ${BLUE}http://5.161.187.109:3001${NC} (direct)"
echo ""
echo "Useful commands:"
echo "  ssh $VPS_HOST 'docker logs -f $CONTAINER_NAME'  # View logs"
echo "  ssh $VPS_HOST 'docker restart $CONTAINER_NAME'  # Restart"
echo ""

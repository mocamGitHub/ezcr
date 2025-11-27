#!/bin/bash

# Setup script to connect Next.js container to Traefik for domain routing
# This will make staging.ezcycleramp.com work!

echo "=========================================="
echo "Setting up domain routing for staging.ezcycleramp.com"
echo "=========================================="

# Configuration
DOMAIN="staging.ezcycleramp.com"
CONTAINER_NAME="ezcr-nextjs"
NETWORK="coolify"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Checking Docker networks...${NC}"
docker network ls | grep coolify
if [ $? -ne 0 ]; then
    echo -e "${RED}Coolify network not found. Creating bridge network...${NC}"
    docker network create coolify
fi

echo -e "${YELLOW}Step 2: Stopping current container...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null
docker rm $CONTAINER_NAME 2>/dev/null

echo -e "${YELLOW}Step 3: Starting container with Traefik labels...${NC}"
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  --network $NETWORK \
  -p 3001:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e HOSTNAME=0.0.0.0 \
  --label "traefik.enable=true" \
  --label "traefik.docker.network=coolify" \
  --label "traefik.http.routers.ezcr-staging.rule=Host(\`$DOMAIN\`)" \
  --label "traefik.http.routers.ezcr-staging.entrypoints=http" \
  --label "traefik.http.services.ezcr-staging.loadbalancer.server.port=3000" \
  --label "traefik.http.routers.ezcr-staging-secure.rule=Host(\`$DOMAIN\`)" \
  --label "traefik.http.routers.ezcr-staging-secure.entrypoints=https" \
  --label "traefik.http.routers.ezcr-staging-secure.tls=true" \
  --label "traefik.http.services.ezcr-staging-secure.loadbalancer.server.port=3000" \
  ezcr-nextjs:latest npm start

echo -e "${GREEN}✓ Container started with Traefik labels${NC}"

echo -e "${YELLOW}Step 4: Waiting for container to be ready...${NC}"
sleep 5

echo -e "${YELLOW}Step 5: Testing endpoints...${NC}"
echo ""

# Test direct port
echo -n "Testing port 3001... "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q "200"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Working${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
fi

# Test domain (might take a moment for Traefik to pick up)
echo -n "Testing $DOMAIN... "
curl -s -o /dev/null -w "%{http_code}" -H "Host: $DOMAIN" http://localhost/api/health | grep -q "200"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Working${NC}"
else
    echo -e "${YELLOW}⚠ Not ready yet (Traefik may need a moment)${NC}"
fi

echo ""
echo -e "${YELLOW}Step 6: Checking Traefik configuration...${NC}"
# Check if Traefik sees our container
curl -s http://localhost:8080/api/http/routers 2>/dev/null | grep -q "ezcr-staging"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Traefik has detected the container${NC}"
else
    echo -e "${YELLOW}⚠ Traefik hasn't detected the container yet${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Your app should now be accessible at:"
echo "  - http://$DOMAIN (via Traefik)"
echo "  - http://$(hostname -I | awk '{print $1}'):3001 (direct)"
echo ""
echo "Note: It may take up to 60 seconds for Traefik to start routing"
echo ""
echo "To add environment variables, stop the container and re-run with:"
echo "  docker stop $CONTAINER_NAME"
echo "  docker rm $CONTAINER_NAME"
echo "  Then run this script again with env vars added to the docker run command"
#!/bin/bash

# Direct VPS Deployment Script - Bypass Coolify
# Run this on your VPS after SSHing in

echo "======================================"
echo "Direct EZCR Staging Deployment Script"
echo "======================================"
echo ""

# Configuration
REPO_URL="https://github.com/mocamGitHub/ezcr.git"
APP_DIR="/opt/ezcr-staging"
PORT=3001

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker not found. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

echo -e "${YELLOW}Step 2: Checking for existing containers...${NC}"
# Stop any existing container on our port
docker ps -a | grep ":$PORT->" | awk '{print $1}' | xargs -r docker stop
docker ps -a | grep ":$PORT->" | awk '{print $1}' | xargs -r docker rm
echo -e "${GREEN}✓ Cleaned up existing containers${NC}"

echo -e "${YELLOW}Step 3: Cloning repository...${NC}"
# Clean and clone fresh
rm -rf $APP_DIR
git clone $REPO_URL $APP_DIR
cd $APP_DIR
echo -e "${GREEN}✓ Repository cloned${NC}"

echo -e "${YELLOW}Step 4: Building Docker image...${NC}"
# Build with diagnostic server first
docker build -f Dockerfile.diagnostic -t ezcr-staging:latest .
echo -e "${GREEN}✓ Docker image built${NC}"

echo -e "${YELLOW}Step 5: Running container...${NC}"
# Run with direct port mapping
docker run -d \
  --name ezcr-staging \
  --restart unless-stopped \
  -p $PORT:3000 \
  -p 80:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e HOSTNAME=0.0.0.0 \
  ezcr-staging:latest

echo -e "${GREEN}✓ Container started${NC}"

echo -e "${YELLOW}Step 6: Waiting for server to start...${NC}"
sleep 5

echo -e "${YELLOW}Step 7: Testing endpoints...${NC}"
echo ""

# Test local access
echo -n "Testing localhost:3000... "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo -e "${GREEN}✓ Working${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
fi

# Test port 3001
echo -n "Testing port $PORT... "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200"; then
    echo -e "${GREEN}✓ Working${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
fi

# Show container logs
echo ""
echo -e "${YELLOW}Container logs:${NC}"
docker logs --tail 20 ezcr-staging

echo ""
echo "======================================"
echo -e "${GREEN}Deployment Complete!${NC}"
echo "======================================"
echo ""
echo "Access your staging site at:"
echo "  - http://YOUR_SERVER_IP:$PORT"
echo "  - http://YOUR_SERVER_IP (if port 80 is free)"
echo ""
echo "Useful commands:"
echo "  docker logs -f ezcr-staging     # View logs"
echo "  docker restart ezcr-staging     # Restart container"
echo "  docker stop ezcr-staging        # Stop container"
echo "  docker ps                       # List containers"
echo ""

# Optional: Setup systemd service for auto-restart
echo -e "${YELLOW}Creating systemd service for auto-start...${NC}"
cat > /etc/systemd/system/ezcr-staging.service << EOF
[Unit]
Description=EZCR Staging Server
After=docker.service
Requires=docker.service

[Service]
Type=simple
Restart=always
RestartSec=10
ExecStart=/usr/bin/docker start -a ezcr-staging
ExecStop=/usr/bin/docker stop ezcr-staging

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ezcr-staging.service
echo -e "${GREEN}✓ Systemd service created${NC}"

# Create update script
cat > $APP_DIR/update.sh << 'EOF'
#!/bin/bash
cd /opt/ezcr-staging
git pull
docker build -f Dockerfile.diagnostic -t ezcr-staging:latest .
docker stop ezcr-staging
docker rm ezcr-staging
docker run -d \
  --name ezcr-staging \
  --restart unless-stopped \
  -p 3001:3000 \
  -e NODE_ENV=production \
  ezcr-staging:latest
echo "Update complete!"
EOF

chmod +x $APP_DIR/update.sh
echo -e "${GREEN}✓ Update script created at $APP_DIR/update.sh${NC}"
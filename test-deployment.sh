#!/bin/bash

# Deployment Testing Script for EZCR Staging
echo "==================================="
echo "EZCR Staging Deployment Test Script"
echo "==================================="
echo ""

# Configuration
SERVER_IP="5.161.187.109"
DOMAIN="staging.ezcycleramp.com"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test an endpoint
test_endpoint() {
    local url=$1
    local description=$2
    echo -n "Testing $description ($url)... "

    response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url")

    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ OK (200)${NC}"
        return 0
    elif [ "$response" = "404" ]; then
        echo -e "${YELLOW}⚠ 404 Not Found${NC}"
        return 1
    elif [ "$response" = "000" ]; then
        echo -e "${RED}✗ Connection Failed${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠ HTTP $response${NC}"
        return 1
    fi
}

# Function to check full response
check_full_response() {
    local url=$1
    local description=$2
    echo ""
    echo "Detailed check for $description:"
    echo "--------------------------------"
    curl -s -I --connect-timeout 5 "$url" | head -n 10
    echo ""
}

echo "1. Testing Direct IP Access"
echo "============================"
test_endpoint "http://$SERVER_IP:3000" "Direct IP on port 3000"
test_endpoint "http://$SERVER_IP" "Direct IP on port 80"

echo ""
echo "2. Testing Domain Access"
echo "========================"
test_endpoint "http://$DOMAIN" "HTTP Domain"
test_endpoint "https://$DOMAIN" "HTTPS Domain"
test_endpoint "http://$DOMAIN/health" "Health endpoint"
test_endpoint "http://$DOMAIN/api/health" "API Health endpoint"
test_endpoint "http://$DOMAIN/debug" "Debug endpoint"

echo ""
echo "3. Testing sslip.io Domain (if configured)"
echo "=========================================="
# Replace with actual sslip.io domain from Coolify
SSLIP_DOMAIN="pw8ogoggkkk88888osook4wc.$SERVER_IP.sslip.io"
test_endpoint "http://$SSLIP_DOMAIN" "sslip.io domain"
test_endpoint "http://$SSLIP_DOMAIN/health" "sslip.io health"

echo ""
echo "4. DNS Resolution Check"
echo "======================="
echo -n "Resolving $DOMAIN... "
resolved_ip=$(nslookup $DOMAIN 2>/dev/null | grep -A1 "Name:" | grep "Address:" | tail -1 | awk '{print $2}')
if [ "$resolved_ip" = "$SERVER_IP" ]; then
    echo -e "${GREEN}✓ Resolves to $SERVER_IP${NC}"
else
    echo -e "${RED}✗ Resolves to $resolved_ip (expected $SERVER_IP)${NC}"
fi

echo ""
echo "5. Getting Detailed Response Headers"
echo "===================================="
check_full_response "http://$DOMAIN" "Domain"

echo ""
echo "6. Testing with curl verbose (first 10 lines)"
echo "=============================================="
curl -v "http://$DOMAIN" 2>&1 | head -20

echo ""
echo "==================================="
echo "Test Complete!"
echo "==================================="
echo ""
echo "If all tests fail:"
echo "1. Check Coolify dashboard for container status"
echo "2. Review container logs for 'Server running' message"
echo "3. Verify Traefik labels in Container Labels section"
echo "4. Try using 'Generate Domain' for a fresh sslip.io domain"
echo ""
echo "Successful response should show:"
echo "- '✅ Enhanced Diagnostic Server is Working!'"
echo "- Or 'Staging Server Working!' for simple server"
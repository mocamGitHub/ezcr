#!/bin/bash
# Script to find Supabase configuration on your server
# Run this on the server: bash find-supabase-config.sh

echo "=========================================="
echo "SUPABASE CONFIGURATION FINDER"
echo "=========================================="
echo ""

# Find all Supabase-related containers
echo "1. Checking running Supabase containers..."
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" | grep -iE "supabase|gotrue|auth|kong|postgres|studio"
echo ""

# Find docker-compose files
echo "2. Searching for docker-compose files..."
find /opt /root /home /var -name "docker-compose.yml" -o -name "docker-compose.yaml" 2>/dev/null | head -20
echo ""

# Check common Supabase installation directories
echo "3. Checking common Supabase directories..."
for dir in /opt/supabase /root/supabase /home/supabase /var/lib/supabase ~/supabase; do
  if [ -d "$dir" ]; then
    echo "Found: $dir"
    ls -la "$dir" | head -20
    echo ""
  fi
done

# Inspect auth container to find config location
echo "4. Inspecting auth container for config location..."
AUTH_CONTAINER=$(docker ps --format "{{.Names}}" | grep -iE "auth|gotrue" | head -1)
if [ -n "$AUTH_CONTAINER" ]; then
  echo "Auth container: $AUTH_CONTAINER"
  echo ""
  echo "Current environment variables:"
  docker inspect $AUTH_CONTAINER | grep -A 5 "GOTRUE_SMTP"
  echo ""
  echo "Config source:"
  docker inspect $AUTH_CONTAINER | grep -i "com.docker.compose.project.config_files"
fi

echo ""
echo "=========================================="
echo "RECOMMENDATIONS:"
echo "=========================================="
echo ""
echo "If you found a docker-compose.yml file above:"
echo "  1. Edit it: nano /path/to/docker-compose.yml"
echo "  2. Add SMTP environment variables to the 'auth' service"
echo "  3. Restart: docker compose restart auth"
echo ""
echo "If you found an .env file:"
echo "  1. Edit it: nano /path/to/.env"
echo "  2. Add GOTRUE_SMTP_* variables"
echo "  3. Restart: docker compose restart auth"
echo ""
echo "If using Portainer or other management tool:"
echo "  1. Use the web UI to edit environment variables"
echo "  2. Add SMTP settings to auth container"
echo "  3. Recreate the container"
echo ""

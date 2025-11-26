# Emergency Fix: Bypass Traefik - Direct Port Access

## The Problem
- ✅ Container is running
- ✅ Health checks pass
- ✅ Server listening on port 3000
- ❌ Traefik returns 404 (routing misconfigured)

## Solution 1: Direct Port Exposure (Bypass Traefik)

### In Coolify Dashboard:

1. **Go to your Application Settings**
2. **Find "Advanced" or "Ports" section**
3. **Add Port Mapping:**
   ```
   Container Port: 3000
   Host Port: 3001  (or any available port like 8080, 8081, etc.)
   ```

4. **Alternative Port Mapping Formats** (try each if one doesn't work):
   - `3000:3001`
   - `3001:3000`
   - `0.0.0.0:3001:3000`

5. **Save and Redeploy**

6. **Test Direct Access:**
   ```
   http://5.161.187.109:3001
   http://5.161.187.109:3001/health
   http://5.161.187.109:3001/debug
   ```

## Solution 2: Custom Docker Network Command

### In Coolify "Custom Docker Run Command" or "Extra Hosts":
```
-p 3001:3000
```

Or in "Docker Compose Override":
```yaml
ports:
  - "3001:3000"
```

## Solution 3: Use Coolify's Terminal/SSH

### SSH into your server and run:

```bash
# Find your container
docker ps | grep pw8ogoggkkk88888osook4wc

# Get container ID (first column from above)
CONTAINER_ID=<your-container-id>

# Check if it's really listening
docker exec $CONTAINER_ID curl http://localhost:3000/health

# Create a direct port forward
docker run -d --name direct-access \
  --network container:$CONTAINER_ID \
  -p 3001:3000 \
  alpine/socat TCP-LISTEN:3000,fork TCP:localhost:3000

# Or simpler - restart container with port
docker stop $CONTAINER_ID
docker run -d -p 3001:3000 $(docker inspect $CONTAINER_ID --format='{{.Config.Image}}')
```

## Solution 4: Nginx Proxy Bypass

### Create a new application in Coolify with this Dockerfile:

```dockerfile
FROM nginx:alpine
RUN echo 'server { \
    listen 80; \
    location / { \
        proxy_pass http://pw8ogoggkkk88888osook4wc:3000; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## Solution 5: Check Coolify Network

### In Coolify Terminal:
```bash
# List all networks
docker network ls

# Inspect the network your app is on
docker network inspect <network-name>

# Check Traefik configuration
docker inspect traefik | grep -A 50 "Cmd"

# Check your app's labels
docker inspect <container-id> | grep -A 100 "Labels"
```

## Solution 6: Force Traefik Reconfiguration

### Try these label configurations in Coolify:

**Option A - Minimal Labels:**
```
traefik.enable=true
traefik.http.routers.myapp.rule=Host(`staging.ezcycleramp.com`)
traefik.http.services.myapp.loadbalancer.server.port=3000
```

**Option B - Complete Labels:**
```
traefik.enable=true
traefik.docker.network=coolify
traefik.http.routers.http-myapp.rule=Host(`staging.ezcycleramp.com`)
traefik.http.routers.http-myapp.entrypoints=http
traefik.http.routers.http-myapp.service=myapp
traefik.http.services.myapp.loadbalancer.server.port=3000
```

## Solution 7: Complete Reset

1. **Delete the application in Coolify**
2. **Create a NEW application**
3. **Use ONLY these settings:**
   - Repository: Your GitHub repo
   - Branch: main
   - Dockerfile: `Dockerfile.simple` or `Dockerfile.diagnostic`
   - Port: 3000
   - **DO NOT set any domain initially**
4. **Deploy**
5. **After successful deployment, use "Generate Domain"**

## Quick Test Commands

From your local machine:
```bash
# Test direct port (if exposed)
curl -v http://5.161.187.109:3001

# Test with Host header
curl -H "Host: staging.ezcycleramp.com" http://5.161.187.109

# Test Traefik directly
curl -v http://5.161.187.109 -H "Host: pw8ogoggkkk88888osook4wc.5.161.187.109.sslip.io"
```

## If All Else Fails

Consider:
1. **Different deployment platform** (Vercel, Railway, Render)
2. **Raw Docker on the VPS** (bypass Coolify entirely)
3. **Contact Coolify support** with evidence that container runs but Traefik doesn't route

## Evidence for Support:
- Container status: Running ✅
- Health checks: Passing ✅
- Internal curl: Works ✅
- External access: 404 ❌
- Traefik labels: Malformed with empty Host()
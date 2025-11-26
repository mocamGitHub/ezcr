# Coolify Traefik Routing Fix Guide

## Current Issue
The container is running successfully (confirmed by health checks), but Traefik returns "404 page not found" because the routing labels are malformed.

### Problem in Container Labels:
```
# INCORRECT (current):
traefik.http.routers.http-0-pw8ogoggkkk88888osook4wc.rule=Host(``) && PathPrefix(`staging.ezcycleramp.com`)

# CORRECT (should be):
traefik.http.routers.http-0-pw8ogoggkkk88888osook4wc.rule=Host(`staging.ezcycleramp.com`)
```

## Immediate Fixes to Try

### Option 1: Reset Domain Configuration
1. Go to Coolify dashboard > Your application > Configuration
2. In the "Domains" field, **completely remove all text** (make it blank)
3. Click **Save**
4. Wait 30 seconds for changes to propagate
5. Click **"Generate Domain"** button to get a fresh `.sslip.io` domain
6. **Deploy** the application again
7. The auto-generated domain should work immediately

### Option 2: Manual Domain Configuration
1. In the "Domains" field, enter ONLY: `staging.ezcycleramp.com`
2. Do NOT include http:// or https://
3. Do NOT add any paths or prefixes
4. Click **Save**
5. **Important**: Check these settings:
   - Direction: Set to "Both" or "Non-WWW"
   - Strip Prefix: **UNCHECKED** (very important!)
6. **Deploy** the application

### Option 3: Use Environment Variables
Add these environment variables in Coolify:
```
HOSTNAME=0.0.0.0
PORT=3000
```

### Option 4: Custom Labels (Advanced)
If Coolify allows custom labels, add these:
```
traefik.enable=true
traefik.http.routers.myapp.rule=Host(`staging.ezcycleramp.com`)
traefik.http.routers.myapp.entrypoints=http,https
traefik.http.services.myapp.loadbalancer.server.port=3000
```

## Verification Steps

1. **Check Container Logs**:
   - Look for "Server running on http://0.0.0.0:3000"
   - Confirm health checks showing "GET /" or "GET /api/health"

2. **Test with sslip.io domain first**:
   - This avoids DNS propagation issues
   - Should work immediately if Traefik is configured correctly

3. **Check Traefik Labels**:
   - In Container Labels, look for the `rule=` line
   - Ensure it has `Host(\`your-domain\`)` NOT `Host(\`\`) && PathPrefix(...)`

## If Nothing Works

### Nuclear Option: Direct Port Exposure
1. In Coolify, look for "Exposed Ports" or "Port Mapping"
2. Map container port 3000 to a host port (e.g., 3001)
3. Access directly via: `http://5.161.187.109:3001`
4. This bypasses Traefik completely

### Alternative: Use Coolify's Built-in Proxy
Some Coolify versions have a "Proxy" toggle:
1. Find "Proxy" or "Use Proxy" setting
2. Toggle it OFF then ON again
3. This forces Traefik to regenerate labels

## Current Working Files

### Dockerfile.simple (Currently Working)
- Ultra-simple server with no dependencies
- Confirms the container and networking work
- Returns HTML on `/` and JSON on `/api/health`

### simple-server.js (Diagnostic Server)
- Has `/debug` endpoint showing environment and file system
- Confirms Next.js build artifacts exist
- Shows incoming request headers

## Next Steps After Fix

Once any domain works with the simple server:
1. Switch back to main `Dockerfile`
2. Use `CMD ["node", "server.js"]` initially
3. Test Next.js with `CMD ["npm", "start"]`
4. Finally use standalone: `CMD ["node", ".next/standalone/server.js"]`

## DNS Note
If using staging.ezcycleramp.com:
- Ensure DNS A record points to: 5.161.187.109
- DNS propagation can take 5-30 minutes
- Use sslip.io for immediate testing
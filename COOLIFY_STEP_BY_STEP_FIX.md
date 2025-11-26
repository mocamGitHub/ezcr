# Coolify Configuration Fix - Step by Step Checklist

## ✅ Pre-Flight Checks
- [ ] Confirm container shows as "Running" in Coolify
- [ ] Confirm health checks are passing (green status)
- [ ] Check container logs show "Server running on http://0.0.0.0:3000"

## 🔧 Method 1: Reset and Use Auto-Generated Domain (RECOMMENDED)

### Step 1: Clear Current Configuration
1. [ ] Go to your application in Coolify dashboard
2. [ ] Navigate to "Configuration" tab
3. [ ] Find the "Domains" field
4. [ ] **DELETE ALL TEXT** in the domains field (make it completely empty)
5. [ ] Click **"Save"** button
6. [ ] Wait 10 seconds

### Step 2: Generate Fresh Domain
1. [ ] Click the **"Generate Domain"** button
2. [ ] Coolify will create something like: `pw8ogoggkkk88888osook4wc.5.161.187.109.sslip.io`
3. [ ] This domain will be automatically added to the field
4. [ ] Click **"Save"** again

### Step 3: Verify Settings
1. [ ] Check "Direction" setting - should be "Both" or "Non-WWW"
2. [ ] **CRITICAL**: Ensure "Strip Prefix" is **UNCHECKED** ❌
3. [ ] Port should be set to `3000`
4. [ ] Health check path should be `/health` or `/api/health`

### Step 4: Deploy
1. [ ] Click **"Deploy"** or **"Redeploy"** button
2. [ ] Wait for deployment to complete (usually 1-2 minutes)
3. [ ] Check logs for "Server running" message

### Step 5: Test
1. [ ] Copy the generated sslip.io URL
2. [ ] Open in browser
3. [ ] Should see "Enhanced Diagnostic Server is Working!" page

## 🔧 Method 2: Manual Domain Configuration

### If Method 1 Doesn't Work:
1. [ ] In "Domains" field, enter EXACTLY: `staging.ezcycleramp.com`
   - No http:// or https://
   - No trailing slash
   - No paths or prefixes
2. [ ] Set "Direction" to "Non-WWW only"
3. [ ] Ensure "Strip Prefix" is **UNCHECKED** ❌
4. [ ] Save and Deploy

## 🔍 Verify Traefik Labels

### Check Container Labels:
1. [ ] Go to "Container Labels" section in Coolify
2. [ ] Look for line starting with `traefik.http.routers`
3. [ ] The rule should look like ONE of these:
   - ✅ CORRECT: `rule=Host(\`staging.ezcycleramp.com\`)`
   - ✅ CORRECT: `rule=Host(\`pw8ogoggkkk88888osook4wc.5.161.187.109.sslip.io\`)`
   - ❌ WRONG: `rule=Host(\`\`) && PathPrefix(\`staging.ezcycleramp.com\`)`
   - ❌ WRONG: `rule=PathPrefix(\`/\`)`

## 🚨 Emergency Fixes

### If Still Not Working:

#### Option A: Force Regenerate
1. [ ] Stop the application
2. [ ] Change Dockerfile to `Dockerfile.diagnostic`
3. [ ] Clear browser cache
4. [ ] Start/Deploy again

#### Option B: Check Network Settings
1. [ ] Verify "Network" is set to default or bridge
2. [ ] Confirm "Expose Port" shows `3000`
3. [ ] Check firewall isn't blocking port 80/443

#### Option C: Direct Port Access
1. [ ] In Advanced Settings, look for "Published Ports"
2. [ ] Add mapping: `3000:3001` (container:host)
3. [ ] Save and deploy
4. [ ] Test via: `http://5.161.187.109:3001`

## 📝 What Success Looks Like

When properly configured, you should see:
```
✅ Enhanced Diagnostic Server is Working!
OPERATIONAL

Server Time: 2024-xx-xx...
Request Count: #1
Your IP: [your IP]
Your Host Header: staging.ezcycleramp.com
Environment: production
Server Port: 3000
```

## 🔄 After It Works

Once the diagnostic server works:
1. [ ] Note down the working configuration
2. [ ] Switch Dockerfile back to main `Dockerfile`
3. [ ] Deploy the real Next.js application
4. [ ] Test all endpoints

## 📞 Debug Commands

Run these in Coolify's "Terminal" or SSH:
```bash
# Check if container is listening
docker ps | grep your-app-name

# Check Traefik configuration
docker inspect [container-id] | grep -A 20 "Labels"

# Test from inside the server
curl http://localhost:3000/health

# Check Traefik logs
docker logs traefik 2>&1 | grep staging
```

## ⚠️ Common Mistakes to Avoid

1. ❌ Don't include http:// in domain field
2. ❌ Don't enable "Strip Prefix" for root domain
3. ❌ Don't use wildcards in domain (like *.staging.ezcycleramp.com)
4. ❌ Don't add multiple domains at once (test one first)
5. ❌ Don't forget to click Save after changes

## 💡 If Nothing Else Works

Contact Coolify support with:
- Screenshot of Container Labels showing Traefik rules
- Screenshot of Configuration page
- Container logs showing the server is running
- The fact that health checks pass but external access gives 404
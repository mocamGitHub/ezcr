# Step-by-Step: Configure SMTP in Coolify Dashboard

## Prerequisites

Before you start, get a Gmail App Password:

1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled
3. Go to: https://myaccount.google.com/apppasswords
4. Create password named "EZCR Supabase"
5. **Copy the 16-character password** (write it down temporarily)

---

## Step 1: Find Your Supabase Service in Coolify

### A. Navigate to Services/Projects
1. Login to your Coolify dashboard
2. Look for one of these menu items:
   - **Projects**
   - **Services**
   - **Resources**
   - **Applications**

### B. Find Supabase
Look for:
- A service named **"Supabase"**
- Or look for the Supabase logo/icon
- Or search for "supabase" in the search bar

### C. Click on the Supabase Service
This will open the Supabase service details page.

---

## Step 2: Find the Auth Component

Inside your Supabase service, you'll see multiple components/containers:

- **supabase-db** (PostgreSQL database)
- **supabase-auth** ← **THIS IS THE ONE YOU NEED**
- **supabase-rest** (PostgREST API)
- **supabase-storage** (Storage service)
- **supabase-studio** (Admin dashboard)
- And others...

**Click on `supabase-auth`** (might be labeled as "Auth" or "GoTrue")

---

## Step 3: Add Environment Variables

Once you're in the Auth component settings:

### A. Find Environment Variables Section
Look for:
- **Environment Variables** tab/section
- **Environment** or **Env Vars**
- **Configuration**
- Or a **+ Add Variable** button

### B. Add These Variables

Click "Add Variable" or similar button and add each of these **one by one**:

#### Variable 1
```
Key:   GOTRUE_SMTP_HOST
Value: smtp.gmail.com
```

#### Variable 2
```
Key:   GOTRUE_SMTP_PORT
Value: 587
```

#### Variable 3
```
Key:   GOTRUE_SMTP_USER
Value: YOUR_EMAIL@gmail.com
```
**Important:** Replace with your actual Gmail address!

#### Variable 4
```
Key:   GOTRUE_SMTP_PASS
Value: [paste your 16-character app password]
```
**Important:** Paste the password from the Prerequisites step!

#### Variable 5
```
Key:   GOTRUE_SMTP_ADMIN_EMAIL
Value: YOUR_EMAIL@gmail.com
```
**Important:** Use the same Gmail address as Variable 3!

#### Variable 6
```
Key:   GOTRUE_SMTP_SENDER_NAME
Value: EZ Cycle Ramp
```

#### Variable 7 (Optional but Recommended)
```
Key:   GOTRUE_SITE_URL
Value: http://localhost:3002
```

#### Variable 8 (Optional)
```
Key:   GOTRUE_MAILER_AUTOCONFIRM
Value: false
```

### C. Save Changes
- Look for a **Save** button
- Or **Apply** button
- Or changes might auto-save

---

## Step 4: Restart the Auth Service

After adding the environment variables:

### A. Find the Restart Button
Look for:
- **Restart** button
- **Redeploy** button
- **Recreate** button
- Or **⟳** (circular arrow icon)

### B. Click Restart/Redeploy
- Click the button
- Confirm if prompted
- Wait for the service to restart (usually 30-60 seconds)

### C. Check Status
Wait until the status shows:
- ✅ **Running**
- ✅ **Healthy**
- ✅ **Active**

---

## Step 5: Verify Configuration

### Option A: Via Coolify Dashboard

1. Go back to the Auth component
2. Check the Environment Variables section
3. Verify all 8 variables are listed
4. Make sure `GOTRUE_SMTP_PASS` shows as hidden/masked (for security)

### Option B: Via Command Line (Advanced)

```bash
ssh root@5.161.84.153
docker inspect supabase-auth-ok0kw088ss4swwo4wc84gg0w | grep "GOTRUE_SMTP_HOST"
```

You should see: `"GOTRUE_SMTP_HOST=smtp.gmail.com"`

---

## Step 6: Test the Configuration

### A. Test Password Reset

1. Open in browser: http://localhost:3002/forgot-password
2. Enter email: **morris@mocampbell.com**
3. Click **"Send Reset Link"**
4. Wait 10-30 seconds

### B. Check Your Email

1. Open your Gmail inbox
2. Look for email from "EZ Cycle Ramp"
3. **Check spam folder** if not in inbox
4. Email subject should be about password reset

### C. If Email Doesn't Arrive

Check the logs in Coolify:
1. Go to Auth component in Coolify
2. Find **Logs** tab or **View Logs** button
3. Look for errors related to SMTP

---

## Troubleshooting

### Can't Find Environment Variables Section

**Try these locations in Coolify:**
- Click on the Auth service
- Look for tabs: **Configuration**, **Settings**, **Environment**
- Or look for **Edit** button on the service
- Some versions have **Advanced** or **Show More** to expand options

### Variables Not Saving

- Make sure you clicked **Save** or **Apply**
- Try refreshing the page and check if they're still there
- Some Coolify versions need **Redeploy** instead of **Save**

### Email Not Sending

**Common issues:**

1. **Wrong App Password**
   - Make sure you used App Password, not regular Gmail password
   - App password should be 16 characters (4 groups of 4)

2. **Gmail Blocking Login**
   - Check your Gmail security alerts
   - Gmail might have blocked the login attempt
   - You may need to allow less secure apps (not recommended)

3. **Wrong Email Format**
   - Make sure `GOTRUE_SMTP_USER` has `@gmail.com`
   - Make sure `GOTRUE_SMTP_ADMIN_EMAIL` matches

4. **Service Not Restarted**
   - Make sure you clicked Restart/Redeploy
   - Wait until status shows "Running"
   - Try restarting again if unsure

### Check Logs for Errors

In Coolify:
1. Go to Auth component
2. Click **Logs** tab
3. Look for lines containing "SMTP" or "email" or "error"

Common errors:
- "Authentication failed" → Wrong password
- "Connection refused" → Wrong host or port
- "Sender rejected" → Wrong email format

---

## Quick Reference Card

**What you need:**
- ✅ Gmail address
- ✅ 16-character App Password
- ✅ Coolify dashboard access

**Where to go:**
1. Coolify → Services → Supabase → Auth component

**What to add:**
| Variable | Value |
|----------|-------|
| GOTRUE_SMTP_HOST | smtp.gmail.com |
| GOTRUE_SMTP_PORT | 587 |
| GOTRUE_SMTP_USER | your-email@gmail.com |
| GOTRUE_SMTP_PASS | [16-char password] |
| GOTRUE_SMTP_ADMIN_EMAIL | your-email@gmail.com |
| GOTRUE_SMTP_SENDER_NAME | EZ Cycle Ramp |

**Then:**
1. Save
2. Restart Auth service
3. Test at: http://localhost:3002/forgot-password

---

## Still Stuck?

### Screenshot Your Coolify Dashboard

Take screenshots showing:
1. The Coolify main page/services list
2. The Supabase service page
3. The Auth component page
4. Where you're trying to add environment variables

### Or Use Command Line Alternative

If Coolify UI is confusing, you can configure via SSH:

```bash
ssh root@5.161.84.153

# Find Coolify's Supabase config
find /data -name "docker-compose.yml" -path "*supabase*" 2>/dev/null

# Then we can edit the file directly
```

Let me know what you see in Coolify and I'll guide you through!

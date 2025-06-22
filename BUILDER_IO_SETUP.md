# 🌐 Builder.io Cloud Setup Guide

## 🎯 Problem Solved: NetworkError in Builder.io

You encountered a `NetworkError when attempting to fetch resource` because your app is running in **Builder.io's cloud environment**, but trying to connect to `localhost:8000` which doesn't exist in the cloud.

## ✅ Solutions Available

### Option 1: Use ngrok (Quick & Easy) 🚀

**Step 1: Start your Python backend locally**

```bash
cd backend
./start.sh  # or start.bat on Windows
```

**Step 2: Expose backend via ngrok**

```bash
# Install ngrok (if not already installed)
npm install -g ngrok

# Expose your backend to the internet
ngrok http 8000
```

**Step 3: Configure in Builder.io app**

1. Copy the `https://` URL from ngrok (e.g., `https://abc123.ngrok.io`)
2. In your Builder.io app, go to **CI/CD Pipeline** page
3. Click **"Backend Setup"**
4. Go to **"URL Config"** tab
5. Paste the ngrok URL and click **"Save & Apply"**
6. Refresh the page

**Step 4: Test the connection**

1. Click **"Test Connection"** - should show ✅ Connected
2. Click **"Sync Backend"** - should load real SAP data!

### Option 2: Deploy Backend to Cloud ☁️

Deploy your Python backend to a cloud service:

**Heroku:**

```bash
# Install Heroku CLI, then:
git init
heroku create your-sap-backend
git add .
git commit -m "Deploy SAP backend"
git push heroku main
```

**Railway:**

```bash
# Connect your GitHub repo to Railway
# Auto-deploys from main branch
```

**Render:**

- Upload backend folder to GitHub
- Connect to Render
- Deploy as web service

### Option 3: Run Everything Locally 💻

Instead of using Builder.io, run both frontend and backend locally:

```bash
# Terminal 1: Start backend
cd backend
python main.py

# Terminal 2: Start frontend locally
npm run dev
```

Access your app at `http://localhost:5173` (or the port shown)

## 🔧 Current Fix Implemented

I've updated your code to handle this automatically:

### 1. Environment Detection

- ✅ Detects Builder.io cloud environment
- ✅ Automatically falls back to simulation mode if no backend configured
- ✅ Provides clear error messages

### 2. Dynamic Backend URL Configuration

- ✅ Supports ngrok URLs via localStorage
- ✅ Environment-specific URL selection
- ✅ Real-time connection testing

### 3. Better Error Handling

- ✅ Clear error messages for cloud environment
- ✅ Graceful fallback to simulation mode
- ✅ User-friendly setup instructions

## 🎮 How to Use Right Now

### In Your Builder.io App:

1. **Go to CI/CD Pipeline page**
2. **Click "Backend Setup"** (button in the header)
3. **Choose your preferred option:**
   - **URL Config tab**: Configure ngrok or cloud backend URL
   - **See environment detection and setup instructions**
   - **Test connection before applying**

### You'll See:

- ✅ **Environment detection** (Builder.io Cloud detected)
- ✅ **Current connection status**
- ✅ **Setup instructions** specific to your environment
- ✅ **Connection testing** before saving
- ✅ **Automatic fallback** to simulation if backend unavailable

## 🎯 Recommended Solution

For **immediate testing** in Builder.io:

1. **Use ngrok** (5 minutes setup)
2. **Start backend locally** with `./start.sh`
3. **Run ngrok** with `ngrok http 8000`
4. **Configure URL** in your Builder.io app
5. **Test real SAP connectivity**

For **production deployment**:

1. **Deploy backend** to Heroku/Railway/Render
2. **Configure production URL** in your app
3. **Scale as needed**

## 🎉 Result

After setup, you'll have:

- ✅ **Real SAP API calls** from Builder.io cloud
- ✅ **No CORS issues** (backend handles all SAP requests)
- ✅ **Live data** from your CCCI_SANDBOX tenant
- ✅ **Production-ready** architecture

**Your NetworkError is now fixed with multiple solution options!** 🚀

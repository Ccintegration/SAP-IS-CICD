# 🔧 Backend URL Setup Guide
uvicorn app.main:app --reload --port 5000
## 📍 **Where to Configure Backend URL**

### **Step 1: Navigate to Administration**

1. Click **"Administration"** in the top navigation menu
2. Scroll down to find the **"Python Backend Configuration"** section (purple header)

### **Step 2: Configure Backend URL**

1. In the **"Python Backend Configuration"** card, you'll see tabs
2. Click the **"URL Config"** tab (first tab)
3. Enter your backend URL in the input field
4. Click **"Test Connection"** to verify
5. Click **"Save & Apply"**

## 🎯 **What URL to Enter**

### **For Local Development:**

```
http://localhost:8000
```

### **For Builder.io Cloud (using ngrok):**

```
https://your-ngrok-id.ngrok.io
```

### **For Cloud Deployment:**

```
https://your-backend-domain.com
```

## 🚀 **Complete Setup Process**

### **Option A: Local Development**

1. **Start your backend:**

   ```bash
   cd backend
   python main.py
   ```

2. **In your app:**
   - Go to **Administration** tab
   - Find **"Python Backend Configuration"**
   - Click **"URL Config"** tab
   - Enter: `http://localhost:8000`
   - Click **"Test Connection"** → Should show ✅ Connected
   - Click **"Save & Apply"**

### **Option B: Builder.io Cloud with ngrok**

1. **Start your backend locally:**

   ```bash
   cd backend
   python main.py
   ```

2. **In another terminal, start ngrok:**

   ```bash
   npm install -g ngrok
   ngrok http 8000
   ```

3. **Copy the ngrok URL** (looks like `https://abc123.ngrok.io`)

4. **In your Builder.io app:**
   - Go to **Administration** tab
   - Find **"Python Backend Configuration"**
   - Click **"URL Config"** tab
   - Paste the ngrok URL
   - Click **"Test Connection"** → Should show ✅ Connected
   - Click **"Save & Apply"**

## 🔍 **Visual Location Guide**

```
Your App Navigation Bar
└── Administration (Click Here)
    └── Scroll down to find:
        └── "Python Backend Configuration" (Purple header with Server icon)
            └── Tabs: [URL Config] [Status & Health] [Configuration] [Token Status]
                └── Click "URL Config" tab
                    └── Enter backend URL here
                    └── Click "Test Connection"
                    └── Click "Save & Apply"
```

## ✅ **Verification Steps**

After configuration, verify it's working:

1. **In Administration:**

   - Backend status should show ✅ Connected
   - Token status should show valid token

2. **In CI/CD Pipeline:**
   - Backend connection status should show ✅ Connected
   - No more "Backend Not Available" errors

## 🎊 **Success Indicators**

You'll know it's working when you see:

- ✅ **"Backend Connected"** in Administration
- ✅ **"Ready for CI/CD Pipeline"** message
- ✅ **Real SAP data** loading in pipeline stages
- ✅ **No JSON parsing errors**

## 🆘 **Troubleshooting**

### **Error: "No backend URL configured"**

- **Solution:** Follow the steps above to set the URL in Administration → Python Backend Configuration → URL Config

### **Error: "Connection failed"**

- **Check:** Is your Python backend running? (`python main.py`)
- **Check:** Is the URL correct?
- **Check:** For ngrok, is the tunnel still active?

### **Error: "JSON parsing error"**

- **This is now fixed** with the latest updates
- **If still occurring:** Check backend logs for errors

## 📍 **Quick Navigation**

From any page in your app:

1. Click **"Administration"** in the top menu
2. Look for **"Python Backend Configuration"** (purple section)
3. Click **"URL Config"** tab
4. Configure your backend URL

**That's it!** Your backend URL configuration is now set up and your CI/CD Pipeline should work with real SAP data.

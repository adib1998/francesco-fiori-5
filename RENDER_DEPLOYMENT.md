# 🚀 Francesco Fiori & Piante - Render Deployment Guide

## ✅ **RENDER-OPTIMIZED PACKAGE READY**

**Status:** ✅ **READY FOR RENDER DEPLOYMENT**  
**Package:** `francesco-fiori-complete/`  
**Build:** ✅ **SUCCESSFUL** (837KB)  
**Server:** ✅ **EXPRESS SERVER OPTIMIZED FOR RENDER**  
**Type:** Full-Stack Web Service  

---

## 🎯 **WHY RENDER IS PERFECT**

### ✅ **Render Advantages:**
- **Full-Stack Support** - Frontend + Backend in one service
- **Express Server** - Perfect for Stripe integration
- **Automatic HTTPS** - SSL certificates included
- **Environment Variables** - Secure configuration
- **Health Checks** - Built-in monitoring
- **Free Tier** - Great for testing and small projects

### ✅ **Optimizations for Render:**
- **Static File Serving** - Express serves React app
- **Single Service** - Frontend and backend combined
- **Health Check Endpoint** - `/health` for monitoring
- **Environment Detection** - Automatic production/development
- **CORS Configuration** - Render domain included

---

## 🚀 **RENDER DEPLOYMENT STEPS**

### **Step 1: Upload to GitHub**

1. **Create new GitHub repository**
2. **Upload the `francesco-fiori-complete` folder**
3. **Commit and push to GitHub**

### **Step 2: Connect to Render**

1. **Go to [render.com](https://render.com)**
2. **Sign up/Login with GitHub**
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repository**
5. **Select `francesco-fiori-complete` folder**

### **Step 3: Configure Service**

**Service Configuration:**
```
Name: francesco-fiori-piante
Environment: Node
Region: Oregon (US West) or Frankfurt (Europe)
Branch: main
Root Directory: francesco-fiori-complete
```

**Build & Deploy:**
```
Build Command: npm run render-build
Start Command: npm run render-start
```

### **Step 4: Environment Variables**

**Add these environment variables in Render dashboard:**

```bash
# Required - Supabase Configuration
VITE_SUPABASE_URL=https://despodpgvkszyexvcbft.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlc3BvZHBndmtzenlleHZjYmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTcyMTAsImV4cCI6MjA2MzkzMzIxMH0.zyjFQA-Kr317M5l_6qjV_a-6ED2iU4wraRuYaa0iGEg

# Required - Server Configuration
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NODE_ENV=production
```

### **Step 5: Deploy**

1. **Click "Create Web Service"**
2. **Wait for build to complete** (3-5 minutes)
3. **Your app will be live at:** `https://francesco-fiori-piante.onrender.com`

---

## 🔧 **GETTING YOUR KEYS**

### **Supabase Service Role Key:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the `service_role` key (not anon key)

### **Stripe Keys:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to Developers → API Keys
3. Copy your **Secret Key** (starts with `sk_test_`)
4. For webhook secret:
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-app.onrender.com/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook secret (starts with `whsec_`)

---

## 🧪 **TESTING AFTER DEPLOYMENT**

### **1. Basic Functionality:**
- ✅ Visit your Render URL
- ✅ Check homepage loads
- ✅ Test admin panel at `/admin`
- ✅ Test order dashboard at `/orders`

### **2. Server Endpoints:**
- ✅ Health check: `https://your-app.onrender.com/health`
- ✅ Stripe endpoints working
- ✅ Database connection active

### **3. Order Management:**
- ✅ Create test order from homepage
- ✅ Check notification in order dashboard
- ✅ Verify single notification (no duplicates)
- ✅ Test real-time updates

### **4. Stripe Integration:**
- ✅ Configure Stripe in admin panel
- ✅ Create test order with payment
- ✅ Verify checkout flow works
- ✅ Test webhook processing

---

## 📊 **RENDER SERVICE DETAILS**

### **Service Type:** Web Service
**Runtime:** Node.js 18
**Build Time:** ~3-5 minutes
**Start Time:** ~30 seconds
**Health Check:** `/health` endpoint
**Auto-Deploy:** On git push

### **URLs:**
- **Main App:** `https://francesco-fiori-piante.onrender.com`
- **Admin Panel:** `https://francesco-fiori-piante.onrender.com/admin`
- **Order Dashboard:** `https://francesco-fiori-piante.onrender.com/orders`
- **Health Check:** `https://francesco-fiori-piante.onrender.com/health`

---

## 🔍 **TROUBLESHOOTING**

### **Build Fails:**
1. Check Node.js version (should be 18+)
2. Verify all dependencies in package.json
3. Check build logs in Render dashboard

### **App Won't Start:**
1. Check environment variables are set
2. Verify start command: `npm run render-start`
3. Check server logs for errors

### **Stripe Not Working:**
1. Verify Stripe keys are correct
2. Check webhook endpoint URL
3. Test with Stripe test cards

### **Database Issues:**
1. Verify Supabase keys
2. Check service role key permissions
3. Test database connection

---

## 🎉 **RENDER DEPLOYMENT COMPLETE**

### **Your Francesco Fiori & Piante website will have:**

- ✅ **Full-Stack Application** - Frontend + Backend
- ✅ **Working Stripe Payments** - Complete payment processing
- ✅ **Real-time Order Management** - Live dashboard
- ✅ **Admin Panel** - Complete management system
- ✅ **Automatic HTTPS** - SSL certificates included
- ✅ **Health Monitoring** - Built-in checks
- ✅ **Auto-Deploy** - Updates on git push

### **🌐 Live URLs:**
- **Website:** `https://francesco-fiori-piante.onrender.com`
- **Admin:** `https://francesco-fiori-piante.onrender.com/admin`
- **Orders:** `https://francesco-fiori-piante.onrender.com/orders`

---

## 📁 **PACKAGE READY FOR RENDER**

**Deploy:** `francesco-fiori-complete/` folder  
**Platform:** Render.com  
**Type:** Web Service  
**Status:** ✅ **READY TO DEPLOY**

### 🚀 **Upload to GitHub and deploy on Render - Your flower shop will be live in minutes!**

🌸📱 **Complete flower shop management system optimized for Render!** 🌸📱

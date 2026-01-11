# 👋 Start Here - New Repository Clone Setup

## Current Status

✅ **Frontend Ready** - npm packages installed (683 packages)
⏸️ **Backend Pending** - Needs Maven build with Java 17

## Complete Setup in 2 Steps

### Step 1: Build Backend (Required)
```powershell
cd backend
.\mvn-java17.cmd clean package -DskipTests
```
⏱️ Takes 3-5 minutes on first run

### Step 2: Install Test Browsers (Optional)
```powershell
cd frontend
npx playwright install
```
⏱️ Takes 2-3 minutes (only needed for E2E tests)

## Quick Start After Setup

```powershell
# Terminal 1 - Start Backend
cd backend
mvn spring-boot:run
# 🌐 http://localhost:8080

# Terminal 2 - Start Frontend  
cd frontend
npm start
# 🌐 http://localhost:4200
```

## Documentation Guide

| File | Purpose |
|------|---------|
| **`COMPLETE_SETUP_NOW.md`** | ⚡ Quickest reference |
| **`SETUP_NEXT_STEPS.md`** | 📋 Step-by-step walkthrough |
| **`INITIAL_SETUP_STATUS.md`** | 📊 Detailed status report |
| **`SETUP_COMPLETE.md`** | 🔧 Troubleshooting guide |
| **`AGENTS.md`** | 📚 Full development reference |

## Need Help?

**Backend won't build?**
- See "Common Issues" in `SETUP_COMPLETE.md`
- Ensure Java 17 is installed at `C:\Environement\Java\jdk-17.0.5.8-hotspot`

**Port conflicts?**
- Backend uses port 8080
- Frontend uses port 4200
- Stop conflicting services or change ports in config

## What's Next?

1. ✅ Complete the 2 setup steps above
2. ✅ Verify with `mvn test` and `npm test`
3. ✅ Start developing!

---

**Pro Tip:** The `mvn-java17.cmd` script automatically sets Java 17, so you don't need to worry about JAVA_HOME! 🎯

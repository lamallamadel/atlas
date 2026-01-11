# 🚀 START HERE - Initial Repository Setup

## Setup Status: 60% Complete

✅ Frontend dependencies installed  
⚠️ Backend setup required (1 command)

---

## Complete Setup in 1 Step

Run this command from the repository root:

### Windows (Command Prompt or PowerShell)
```cmd
backend\run-mvn-with-java17.cmd clean install -DskipTests -gs settings.xml
```

This will:
- Use Java 17 automatically
- Download Maven dependencies (~100MB)
- Build the backend
- Take 3-5 minutes

---

## Verify Setup

After running the command above, check that the build succeeded:

```cmd
dir backend\target\backend.jar
```

You should see the `backend.jar` file (approximately 50-60 MB).

---

## What's Already Done

✅ Frontend dependencies installed (1,178 packages)  
✅ Helper scripts created  
✅ Documentation generated  

---

## Next Steps After Setup

1. **Read the development guide**: `AGENTS.md`
2. **Start the backend**: `cd backend && run-mvn-with-java17.cmd spring-boot:run`
3. **Start the frontend**: `cd frontend && npm start`
4. **Run tests**: See `AGENTS.md` for test commands

---

## Need More Details?

- `QUICKSTART_AFTER_CLONE.md` - Quick reference with all commands
- `SETUP_STATUS_FINAL_AFTER_CLONE.md` - Detailed setup status
- `INITIAL_SETUP_COMPLETE.md` - Complete setup documentation
- `AGENTS.md` - Full development guide

---

## Troubleshooting

**Problem**: "JAVA_HOME environment variable is not defined correctly"  
**Solution**: The `run-mvn-with-java17.cmd` script sets JAVA_HOME automatically. Make sure you're using it.

**Problem**: Maven command fails  
**Solution**: Make sure you're in the repository root directory and try again.

**Problem**: Build takes too long  
**Solution**: First build downloads dependencies (~100MB). Subsequent builds are faster.

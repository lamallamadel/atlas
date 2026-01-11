# Quick Setup Commands

## Current Status
✅ Frontend npm dependencies installed  
⚠️ Backend build needed  
⚠️ Playwright browsers needed  

## Complete Setup (Copy & Paste)

### Windows CMD:
```cmd
cd backend && mvn.cmd clean install && cd .. && cd frontend && npx playwright install && cd ..
```

### PowerShell:
```powershell
cd backend; mvn.cmd clean install; cd ..; cd frontend; npx playwright install; cd ..
```

### Or Step-by-Step:

#### 1. Backend
```cmd
cd backend
mvn.cmd clean install
cd ..
```

#### 2. Playwright
```cmd
cd frontend
npx playwright install
cd ..
```

## Verify Setup

```cmd
REM Backend test
cd backend && mvn test && cd ..

REM Frontend test
cd frontend && npm test && cd ..

REM E2E test
cd frontend && npm run e2e:fast && cd ..
```

## Start Development

```cmd
REM Terminal 1 - Backend
cd backend
mvn spring-boot:run

REM Terminal 2 - Frontend
cd frontend
npm start
```

Then open: http://localhost:4200

---

**See START_HERE.md for more info**

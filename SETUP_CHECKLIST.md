# Setup Checklist

## ✅ Completed by Automated Setup

- [x] Frontend dependencies installed (`npm install`)
- [x] node_modules directory created (684 modules, 1,178 packages)
- [x] Setup helper scripts created
- [x] Documentation updated

## ⬜ To Complete Manually

### Required Steps

- [ ] **Install Backend Dependencies**
  ```cmd
  backend\do-install.bat
  ```
  *Estimated time: 3-5 minutes*

- [ ] **Install Playwright Browsers**
  ```cmd
  cd frontend && npm run install-browsers
  ```
  *Estimated time: 2-3 minutes*

### Verification Steps

- [ ] **Verify Backend Build**
  ```cmd
  cd backend && mvn clean package
  ```

- [ ] **Verify Frontend Build**
  ```cmd
  cd frontend && npm run build
  ```

- [ ] **Verify Tests Work**
  ```cmd
  cd backend && mvn test
  ```

## Quick Setup (All Steps)

Instead of running individual commands, use:

```cmd
setup-repo.bat
```

This runs all required and verification steps automatically.

## After Setup

- [ ] Read `AGENTS.md` for available commands
- [ ] Start backend dev server: `cd backend && mvn spring-boot:run`
- [ ] Start frontend dev server: `cd frontend && npm start`
- [ ] Run E2E tests: `cd frontend && npm run e2e:fast`

---

**Current Progress**: 1 of 2 main components complete (50%)

**Time to Complete**: ~5-8 minutes

**Next Action**: Run `setup-repo.bat` or follow manual steps above

# E2E Tests - Quick Start

## 🚀 One-Time Setup

```bash
cd frontend
npm install
npx playwright install
```

## ▶️ Run Tests

```bash
# Run all tests
npm run e2e

# Run with visible browser
npm run e2e:headed

# Run interactive UI mode
npm run e2e:ui

# Run specific test
npx playwright test dossier-message.spec.ts
```

## 🔍 Debug Tests

```bash
# Step through test
npx playwright test --debug

# View last report
npx playwright show-report

# Show trace
npx playwright show-trace test-results/trace.zip
```

## ✅ Test Scenarios

### Scenario 1: Message Creation (`dossier-message.spec.ts`)
Login → Dossiers → Open dossier → Messages tab → Add message → Verify in timeline

**Validates:**
- ✅ Message appears with correct timestamp
- ✅ Channel badge (EMAIL, SMS, etc.)
- ✅ Direction badge (INBOUND/OUTBOUND)
- ✅ Message content

### Scenario 2: Appointment & Audit (`dossier-appointment.spec.ts`)
Open dossier → Rendez-vous tab → Add appointment → Verify → Historique tab → Verify audit

**Validates:**
- ✅ Appointment in list
- ✅ Appointment details
- ✅ Audit event with action=CREATE
- ✅ Audit event with entityType=APPOINTMENT

## 📋 Prerequisites

- ✅ Backend running on http://localhost:8080
- ✅ Frontend dev server on http://localhost:4200
- ✅ Test org (ORG-001) exists

## 📚 Documentation

- `README.md` - Overview and basic commands
- `SETUP_GUIDE.md` - Detailed setup and troubleshooting
- `TEST_SCENARIOS.md` - Test documentation
- `IMPLEMENTATION_SUMMARY.md` - Complete implementation details

## 🐛 Troubleshooting

**Tests timeout?**
→ Check backend is running: `curl http://localhost:8080/actuator/health`

**Element not found?**
→ Run with debug: `npx playwright test --debug`

**Tests fail in CI?**
→ Check `ci-example.yml` for CI setup

## 📞 Need Help?

1. Check `SETUP_GUIDE.md` troubleshooting
2. Run with `--debug` flag
3. Check Playwright docs: https://playwright.dev

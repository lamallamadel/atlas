# Quick Test Reference Card

## 🚀 Run Tests Now

### Fastest Way
```cmd
run-tests-with-report.cmd
```
Choose option 1 (H2) for fastest results (~5 min)

### Direct Commands
```cmd
# H2 (fast)
run-tests-h2.cmd

# PostgreSQL (thorough, requires Docker)
run-tests-postgres.cmd

# Both
run-tests-all.cmd
```

---

## 📊 View Results

### Coverage Report
```cmd
start backend\target\site\jacoco\index.html
```

### Test Report
```cmd
start backend\target\surefire-reports\index.html
```

### Generated Report
```cmd
start test-reports\detailed-report-*.md
```

---

## ✅ Success Criteria

### Must Pass
- ✓ All tests pass (0 failures)
- ✓ H2 execution <5 minutes
- ✓ PostgreSQL execution <15 minutes
- ✓ Line coverage ≥80% on critical packages
- ✓ Branch coverage ≥80% on critical packages

### Critical Packages
- `com.example.*.controller.*`
- `com.example.*.service.*`
- `com.example.*.repository.*`
- `com.example.*.security.*`

---

## 🛠️ Common Commands

### Run Single Test
```bash
cd backend
mvn test -Dtest=DossierBackendE2ETest -Pbackend-e2e-h2
```

### Clean Build
```bash
cd backend
mvn clean
```

### View Logs
```bash
type backend\target\surefire-reports\*.txt
```

### Docker Cleanup
```cmd
docker ps -a --filter "label=org.testcontainers=true"
docker rm -f <container-id>
```

---

## 🔧 Prerequisites

### Required
- ✓ Java 17+ (`JAVA_HOME` set to `C:\Environement\Java\jdk-17.0.5.8-hotspot`)
- ✓ Maven 3.6+

### For PostgreSQL Tests
- ✓ Docker running
- ✓ Port 5432 available

### Verify Setup
```cmd
java -version
mvn -version
docker ps
```

---

## 🐛 Quick Fixes

### Java Version Wrong
```cmd
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
java -version
```

### Port 5432 In Use
```powershell
Get-NetTCPConnection -LocalPort 5432
Stop-Service postgresql-x64-16
```

### Docker Not Running
```
Start Docker Desktop from Windows Start Menu
```

### Tests Stuck/Hanging
```
Ctrl+C to cancel
docker rm -f $(docker ps -a -q --filter "label=org.testcontainers=true")
```

---

## 📖 Documentation

| File | Purpose |
|------|---------|
| `RUN_FULL_TEST_VALIDATION.md` | Complete validation guide |
| `TEST_INFRASTRUCTURE_README.md` | Infrastructure details |
| `TEST_VALIDATION_SUITE.md` | Test suite architecture |
| `KNOWN_ISSUES.md` | Issue tracking |
| `AGENTS.md` | Development setup |

---

## 💡 Pro Tips

1. **Before commit**: Run H2 tests (`run-tests-h2.cmd`)
2. **Before push**: Run both profiles (`run-tests-all.cmd`)
3. **Check coverage**: Aim for 80%+ on business logic
4. **Review reports**: Read generated markdown reports
5. **Track performance**: Monitor execution time trends

---

## 🎯 Targets at a Glance

| Profile | Time Target | Coverage Target | Failures |
|---------|-------------|-----------------|----------|
| H2 | <5 min | 80%+ | Zero |
| PostgreSQL | <15 min | 80%+ | Zero |

---

## 📞 Support

1. Check this card first
2. Review detailed documentation above
3. Check `KNOWN_ISSUES.md`
4. Review test logs in `backend\target\surefire-reports\`

---

## 🔄 CI/CD

### Local Pre-CI Check
```cmd
run-tests-all.cmd
```

### Expected CI Behavior
- H2 tests run in <6 minutes
- PostgreSQL tests run in <16 minutes
- All tests pass with zero failures
- Coverage reports uploaded as artifacts

---

**Keep this card handy for quick reference!**
**Updated**: 2024-01-15

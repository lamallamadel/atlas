# Full Test Suite Validation Guide

This guide provides instructions for running the complete test validation suite with coverage reporting and performance metrics.

## Quick Start

### Windows (PowerShell)
```powershell
# Set Java 17 environment
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Run backend tests only
.\scripts\run-full-test-suite.ps1 -BackendOnly

# Run all tests (backend + frontend)
.\scripts\run-full-test-suite.ps1
```

### Windows (Command Prompt)
```cmd
REM Use the provided batch script
run-tests-h2.cmd
run-tests-postgres.cmd
run-tests-all.cmd
```

### Linux/Mac
```bash
export JAVA_HOME=/path/to/jdk-17
export PATH=$JAVA_HOME/bin:$PATH

# Run backend tests only
./scripts/run-full-test-suite.sh --backend-only

# Run all tests
./scripts/run-full-test-suite.sh
```

## Test Execution Commands

### Backend E2E Tests

#### H2 Profile (Target: <5 minutes, Zero failures)
```bash
cd backend
.\mvn-java17.cmd verify -s .\settings.xml -t .\toolchains.xml -Pbackend-e2e-h2
```

**What it does:**
- Runs all E2E tests with H2 in-memory database
- Uses PostgreSQL compatibility mode
- Executes surefire tests (*BackendE2ETest.java)
- Executes failsafe tests (*IT.java, *IntegrationTest.java)
- Generates JaCoCo coverage report
- Target: Complete in under 5 minutes with zero failures

#### PostgreSQL Profile (Target: <15 minutes, Zero failures)
```bash
cd backend
mvn verify -s .\settings.xml -t .\toolchains.xml -Pbackend-e2e-postgres
```

**What it does:**
- Runs all E2E tests with PostgreSQL via Testcontainers
- Tests real database features (JSONB, sequences, etc.)
- Automatically starts and stops PostgreSQL container
- Generates JaCoCo coverage report
- Target: Complete in under 15 minutes with zero failures

### Coverage Report Generation

Coverage reports are automatically generated during test execution and can be found at:
```
backend/target/site/jacoco/index.html
```

**Coverage Targets (80%+ on core business logic):**
- Controllers: 80%+ line and branch coverage
- Services: 80%+ line and branch coverage
- Repositories: 80%+ line and branch coverage
- Security: 80%+ line and branch coverage

### View Coverage Report

**Windows:**
```powershell
Start-Process "backend\target\site\jacoco\index.html"
```

**Linux/Mac:**
```bash
open backend/target/site/jacoco/index.html  # Mac
xdg-open backend/target/site/jacoco/index.html  # Linux
```

## Test Validation Checklist

### ✅ Pre-Execution Checklist
- [ ] Java 17+ installed and JAVA_HOME set
- [ ] Maven 3.6+ available
- [ ] Docker installed (for PostgreSQL tests)
- [ ] No processes using port 5432 (for PostgreSQL tests)
- [ ] Clean workspace (`mvn clean`)

### ✅ H2 Test Validation
- [ ] All tests pass (zero failures)
- [ ] Execution time < 5 minutes
- [ ] No compilation errors
- [ ] JaCoCo report generated
- [ ] Coverage >= 80% on critical packages

### ✅ PostgreSQL Test Validation
- [ ] All tests pass (zero failures)
- [ ] Execution time < 15 minutes
- [ ] Testcontainers start/stop successfully
- [ ] No port conflicts
- [ ] JaCoCo report generated
- [ ] Coverage >= 80% on critical packages
- [ ] Containers cleaned up after execution

### ✅ Coverage Validation
- [ ] Line coverage >= 80% on controllers
- [ ] Line coverage >= 80% on services
- [ ] Line coverage >= 80% on repositories
- [ ] Line coverage >= 80% on security
- [ ] Branch coverage >= 80% on critical paths
- [ ] HTML report accessible and readable

## Test Suites

### Backend E2E Test Files
```
backend/src/test/java/com/example/backend/
├── AnnonceBackendE2ETest.java           # Property CRUD tests
├── DossierBackendE2ETest.java           # Lead/Deal workflow tests
├── PartiesPrenanteBackendE2ETest.java   # Stakeholder management tests
├── MessageBackendE2ETest.java           # Message handling tests
├── AppointmentBackendE2ETest.java       # Appointment scheduling tests
├── ConsentementBackendE2ETest.java      # Consent management tests
├── AuditTrailBackendE2ETest.java        # Audit tracking tests
├── MultiTenantBackendE2ETest.java       # Multi-tenant isolation tests
├── SecurityBackendE2ETest.java          # Auth/AuthZ tests
├── CompleteWorkflowBackendE2ETest.java  # End-to-end workflows
└── controller/
    ├── NotificationBackendE2ETest.java       # Notification tests
    └── WhatsAppIntegrationBackendE2ETest.java # WhatsApp integration tests
```

### Test Count Summary
- **Total Backend E2E Tests**: ~14 test classes
- **Estimated Test Methods**: 150+ test methods
- **Test Categories**:
  - CRUD Operations: ~40 tests
  - Workflow/State Machine: ~30 tests
  - Multi-tenant: ~20 tests
  - Security: ~15 tests
  - Integration: ~25 tests
  - Edge Cases: ~20 tests

## Performance Benchmarks

### H2 Profile Performance
| Metric | Target | Acceptable | Action Required |
|--------|--------|-----------|-----------------|
| Execution Time | <4 min | <5 min | >5 min |
| Memory Usage | <512MB | <1GB | >1GB |
| Test Throughput | >30 tests/min | >25 tests/min | <25 tests/min |

### PostgreSQL Profile Performance
| Metric | Target | Acceptable | Action Required |
|--------|--------|-----------|-----------------|
| Execution Time | <12 min | <15 min | >15 min |
| Memory Usage | <1GB | <2GB | >2GB |
| Test Throughput | >10 tests/min | >8 tests/min | <8 tests/min |
| Container Startup | <30s | <60s | >60s |

## Troubleshooting

### Common Issues

#### 1. Port 5432 Already in Use
**Symptom:** PostgreSQL tests fail to start
**Solution:**
```powershell
# Windows
Get-NetTCPConnection -LocalPort 5432
Stop-Service postgresql-x64-16

# Linux/Mac
lsof -i :5432
sudo systemctl stop postgresql
```

#### 2. Java Version Mismatch
**Symptom:** Compilation errors or unsupported class version
**Solution:**
```bash
# Verify Java version
java -version

# Set JAVA_HOME (Windows PowerShell)
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

# Set JAVA_HOME (Linux/Mac)
export JAVA_HOME=/path/to/jdk-17
```

#### 3. Maven Dependency Download Failures
**Symptom:** Cannot resolve dependencies
**Solution:**
```bash
# Clean local repository cache
mvn dependency:purge-local-repository

# Retry with -U flag
mvn clean verify -U -Pbackend-e2e-h2
```

#### 4. Testcontainers Not Starting
**Symptom:** Docker connection errors
**Solution:**
```bash
# Verify Docker is running
docker ps

# Check Docker socket permissions (Linux)
sudo usermod -aG docker $USER

# Restart Docker Desktop (Windows/Mac)
```

#### 5. Out of Memory Errors
**Symptom:** Java heap space errors
**Solution:**
```bash
# Increase Maven memory
export MAVEN_OPTS="-Xmx2g -XX:MaxPermSize=512m"

# Or use the provided configuration in mvn-java17.cmd
```

#### 6. Coverage Report Not Generated
**Symptom:** jacoco/index.html not found
**Solution:**
```bash
# Ensure jacoco plugin is executed
mvn clean test -Pbackend-e2e-h2

# Check target directory
ls -la backend/target/site/jacoco/
```

### Known Issues

None at this time. All tests should pass with zero failures.

## Report Interpretation

### JaCoCo Coverage Report Structure

The JaCoCo HTML report shows:
- **Overall Coverage**: Total percentage across all packages
- **Package Coverage**: Individual package statistics
- **Class Coverage**: Per-class metrics
- **Method Coverage**: Method-level detail

**Color Coding:**
- 🟢 Green: Good coverage (80%+)
- 🟡 Yellow: Moderate coverage (50-80%)
- 🔴 Red: Poor coverage (<50%)

### Test Execution Report

The Maven Surefire report shows:
- Total tests run
- Tests passed
- Tests failed
- Tests skipped
- Execution time per test
- Error messages and stack traces

Location: `backend/target/surefire-reports/`

## Continuous Integration

### GitHub Actions Example
```yaml
name: Test Validation

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Run H2 Tests
        run: |
          cd backend
          mvn verify -Pbackend-e2e-h2
        timeout-minutes: 6
      
      - name: Run PostgreSQL Tests
        run: |
          cd backend
          mvn verify -Pbackend-e2e-postgres
        timeout-minutes: 16
      
      - name: Upload Coverage Report
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: backend/target/site/jacoco/
```

## Best Practices

1. **Run locally before pushing**: Always validate tests pass locally
2. **Monitor execution time**: Track test performance over time
3. **Review coverage reports**: Ensure critical paths are tested
4. **Clean between runs**: Use `mvn clean` to avoid stale data
5. **Check Docker cleanup**: Verify Testcontainers are removed after tests
6. **Update test data**: Keep test data realistic and representative
7. **Document failures**: Record any test failures with root cause analysis

## Validation Commands Summary

```bash
# Quick validation (H2 only)
cd backend && .\mvn-java17.cmd verify -s .\settings.xml -t .\toolchains.xml -Pbackend-e2e-h2

# Full validation (H2 + PostgreSQL)
cd backend && .\mvn-java17.cmd verify -s .\settings.xml -t .\toolchains.xml -Pbackend-e2e-h2
cd backend && mvn verify -s .\settings.xml -t .\toolchains.xml -Pbackend-e2e-postgres

# View coverage
Start-Process "backend\target\site\jacoco\index.html"

# Clean up Docker
docker ps -a -q --filter "label=org.testcontainers=true" | ForEach-Object { docker rm -f $_ }
```

## Success Criteria

### ✅ Tests Pass
- All H2 tests pass with zero failures
- All PostgreSQL tests pass with zero failures
- No compilation errors
- No runtime exceptions

### ⏱️ Performance Met
- H2 execution < 5 minutes
- PostgreSQL execution < 15 minutes

### 📊 Coverage Met
- Line coverage >= 80% on controllers
- Line coverage >= 80% on services
- Line coverage >= 80% on repositories
- Line coverage >= 80% on security
- Branch coverage >= 80% on critical paths

### 🧹 Cleanup Successful
- No orphaned Docker containers
- No port conflicts remaining
- Clean test database state

## Next Steps After Validation

1. **Review test results**: Check for any warnings or edge cases
2. **Analyze coverage**: Identify uncovered critical paths
3. **Update documentation**: Document any new test patterns
4. **Commit changes**: Push validated code to repository
5. **Monitor CI/CD**: Ensure pipeline passes with same results

## Support

For issues not covered in this guide:
1. Check `AGENTS.md` for development setup
2. Review `TEST_VALIDATION_SUITE.md` for detailed architecture
3. Check test logs in `backend/target/surefire-reports/`
4. Review JaCoCo reports for coverage gaps
5. Check Docker logs: `docker logs <container-id>`

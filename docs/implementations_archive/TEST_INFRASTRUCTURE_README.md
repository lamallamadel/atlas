# Test Infrastructure Documentation

## Overview

This document describes the complete test validation infrastructure for the backend E2E test suite, including execution scripts, coverage reporting, and validation procedures.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Execution Scripts](#test-execution-scripts)
3. [Coverage Configuration](#coverage-configuration)
4. [Test Profiles](#test-profiles)
5. [Report Generation](#report-generation)
6. [Performance Targets](#performance-targets)
7. [Troubleshooting](#troubleshooting)
8. [CI/CD Integration](#cicd-integration)

---

## Quick Start

### Simplest Way to Run Tests

**Option 1: Interactive Script (Recommended)**
```cmd
run-tests-with-report.cmd
```
This script:
- Prompts you to choose test profile (H2, PostgreSQL, or both)
- Runs the selected tests
- Generates a comprehensive markdown report
- Opens results automatically

**Option 2: Individual Profiles**
```cmd
REM H2 only (fast)
run-tests-h2.cmd

REM PostgreSQL only (requires Docker)
run-tests-postgres.cmd

REM Both profiles
run-tests-all.cmd
```

**Option 3: PowerShell Script**
```powershell
.\scripts\run-full-test-suite.ps1 -BackendOnly
```

**Option 4: Direct Maven Commands**
```bash
cd backend

# H2 profile
.\mvn-java17.cmd verify -s .\settings.xml -t .\toolchains.xml -Pbackend-e2e-h2

# PostgreSQL profile
mvn verify -s .\settings.xml -t .\toolchains.xml -Pbackend-e2e-postgres
```

---

## Test Execution Scripts

### 1. run-tests-h2.cmd

**Purpose**: Run E2E tests with H2 in-memory database

**Target**: <5 minutes, zero failures

**Usage**:
```cmd
run-tests-h2.cmd
```

**What it does**:
- Sets Java 17 environment
- Runs H2 E2E test profile
- Measures execution time
- Opens coverage report on success
- Returns exit code 0 on success, 1 on failure

**Output**:
- Console summary
- JaCoCo HTML report at `backend\target\site\jacoco\index.html`
- Surefire reports at `backend\target\surefire-reports\`

---

### 2. run-tests-postgres.cmd

**Purpose**: Run E2E tests with PostgreSQL via Testcontainers

**Target**: <15 minutes, zero failures

**Prerequisites**: Docker must be running

**Usage**:
```cmd
run-tests-postgres.cmd
```

**What it does**:
- Sets Java 17 environment
- Verifies Docker is running
- Checks port 5432 availability
- Runs PostgreSQL E2E test profile
- Cleans up Testcontainers
- Opens coverage report on success

**Output**:
- Console summary
- JaCoCo HTML report
- Surefire reports
- Cleaned Docker containers

---

### 3. run-tests-all.cmd

**Purpose**: Run complete test suite (H2 + PostgreSQL)

**Target**: ~15-20 minutes total, zero failures

**Usage**:
```cmd
run-tests-all.cmd
```

**What it does**:
- Runs H2 tests first
- Runs PostgreSQL tests second
- Provides comprehensive summary
- Opens coverage report if all pass

**Output**:
- Combined execution summary
- Individual profile results
- Overall pass/fail status

---

### 4. run-tests-with-report.cmd

**Purpose**: Run tests and generate detailed markdown report

**Target**: Selected profile time + ~5 seconds for report generation

**Usage**:
```cmd
run-tests-with-report.cmd
```

**Interactive prompts**:
1. Choose profile (H2, PostgreSQL, or both)
2. Confirm execution
3. View results

**What it does**:
- Runs selected test profile(s)
- Generates comprehensive markdown report
- Includes failure analysis
- Includes coverage analysis
- Includes performance metrics
- Provides actionable recommendations

**Output**:
- Detailed markdown report at `test-reports\detailed-report-<timestamp>.md`
- All standard test outputs
- Automatically opens report

---

### 5. scripts/run-full-test-suite.ps1

**Purpose**: Comprehensive test suite for backend and frontend

**Parameters**:
- `-BackendOnly`: Run only backend tests
- `-FrontendOnly`: Run only frontend tests
- `-Configuration`: Specify frontend config (h2-mock, postgres-mock, etc.)

**Usage**:
```powershell
# Backend only
.\scripts\run-full-test-suite.ps1 -BackendOnly

# Frontend only
.\scripts\run-full-test-suite.ps1 -FrontendOnly

# Everything
.\scripts\run-full-test-suite.ps1
```

**What it does**:
- Validates prerequisites (Java, Docker, Playwright)
- Runs selected test suites
- Generates markdown report
- Cleans up resources
- Provides comprehensive summary

**Output**:
- Markdown report at `test-reports\test-validation-report-<timestamp>.md`
- All test suite outputs

---

### 6. scripts/generate-test-report.ps1

**Purpose**: Parse test results and generate detailed markdown report

**Parameters**:
- `-ReportsDir`: Location of test reports (default: `backend\target`)
- `-OutputFile`: Output markdown file (default: auto-generated with timestamp)

**Usage**:
```powershell
# Default usage (after running tests)
.\scripts\generate-test-report.ps1

# Custom paths
.\scripts\generate-test-report.ps1 -ReportsDir "backend\target" -OutputFile "my-report.md"
```

**What it analyzes**:
- Surefire XML reports (`TEST-*.xml`)
- JaCoCo XML report (`jacoco.xml`)
- Test execution times
- Failure details
- Coverage metrics per package

**Report includes**:
- Executive summary with pass/fail status
- Detailed test results
- Performance metrics (slowest tests)
- Coverage analysis (per package)
- Failure analysis with stack traces
- Actionable recommendations
- Links to detailed reports

---

## Coverage Configuration

### JaCoCo Plugin Configuration

Location: `backend/pom.xml`

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <id>prepare-agent</id>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
        <execution>
            <id>jacoco-check</id>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <rule>
                        <element>PACKAGE</element>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                            <limit>
                                <counter>BRANCH</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                        </limits>
                        <includes>
                            <include>com.example.*.controller.*</include>
                            <include>com.example.*.service.*</include>
                            <include>com.example.*.repository.*</include>
                            <include>com.example.*.security.*</include>
                        </includes>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### Coverage Targets

| Package Type | Line Coverage | Branch Coverage |
|--------------|---------------|-----------------|
| Controllers | ≥80% | ≥80% |
| Services | ≥80% | ≥80% |
| Repositories | ≥80% | ≥80% |
| Security | ≥80% | ≥80% |

### Coverage Reports

**HTML Report**:
- Location: `backend/target/site/jacoco/index.html`
- Interactive, detailed coverage visualization
- Shows line-by-line coverage
- Highlights uncovered code in red

**XML Report**:
- Location: `backend/target/site/jacoco/jacoco.xml`
- Machine-readable format
- Used by CI/CD and reporting tools
- Parsed by `generate-test-report.ps1`

**CSV Report**:
- Location: `backend/target/site/jacoco/jacoco.csv`
- Spreadsheet-friendly format
- Good for tracking trends over time

---

## Test Profiles

### H2 Profile (`backend-e2e-h2`)

**Maven Profile**:
```xml
<profile>
    <id>backend-e2e-h2</id>
    <properties>
        <spring.profiles.active>test</spring.profiles.active>
    </properties>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <configuration>
                    <includes>
                        <include>**/*BackendE2ETest.java</include>
                        <include>**/*E2ETest.java</include>
                    </includes>
                    <systemPropertyVariables>
                        <test.database>h2</test.database>
                    </systemPropertyVariables>
                </configuration>
            </plugin>
        </plugins>
    </build>
</profile>
```

**Spring Profile**: `test`

**Configuration**: `backend/src/test/resources/application-test.yml`

**Database**:
- H2 in-memory database
- PostgreSQL compatibility mode
- URL: `jdbc:h2:mem:testdb`

**Characteristics**:
- Fast execution (<5 minutes target)
- No external dependencies
- Good for rapid development
- Tests business logic
- May not catch database-specific issues

**When to use**:
- Rapid development testing
- Pre-commit validation
- CI/CD pipelines (fast feedback)
- Unit/integration testing

---

### PostgreSQL Profile (`backend-e2e-postgres`)

**Maven Profile**:
```xml
<profile>
    <id>backend-e2e-postgres</id>
    <properties>
        <spring.profiles.active>e2e-postgres</spring.profiles.active>
    </properties>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <configuration>
                    <includes>
                        <include>**/*BackendE2ETest.java</include>
                        <include>**/*E2ETest.java</include>
                    </includes>
                    <systemPropertyVariables>
                        <test.database>postgres</test.database>
                    </systemPropertyVariables>
                </configuration>
            </plugin>
        </plugins>
    </build>
</profile>
```

**Spring Profile**: `e2e-postgres`

**Configuration**: `backend/src/test/resources/application-backend-e2e-postgres.yml`

**Database**:
- PostgreSQL via Testcontainers
- Real PostgreSQL instance in Docker
- Automatically starts/stops container

**Characteristics**:
- Slower execution (<15 minutes target)
- Requires Docker
- Tests database-specific features (JSONB, sequences, etc.)
- More realistic testing
- Catches database compatibility issues

**When to use**:
- Pre-release validation
- Database migration testing
- Full integration testing
- Catching PostgreSQL-specific bugs

---

## Report Generation

### Automatic Report Generation

Reports are automatically generated by:
1. `run-tests-with-report.cmd` - Always generates report
2. `run-full-test-suite.ps1` - Always generates report
3. Manual execution: `.\scripts\generate-test-report.ps1`

### Report Contents

#### 1. Executive Summary
- Pass/fail status with visual indicators
- Total test count
- Pass rate percentage
- Coverage percentages
- Execution time

#### 2. Test Results
- Detailed test counts
- Pass/fail breakdown
- Skipped tests

#### 3. Performance Metrics
- Total execution time
- Average test duration
- Top 10 slowest tests

#### 4. Coverage Analysis
- Overall line and branch coverage
- Per-package coverage breakdown
- Recommendations for improvement

#### 5. Failure Analysis
- List of all failed tests
- Error messages
- Full stack traces
- Root cause hints

#### 6. Recommendations
- Prioritized action items
- Coverage gaps
- Performance issues
- Next steps

### Report Locations

- Detailed reports: `test-reports/detailed-report-<timestamp>.md`
- Validation reports: `test-reports/test-validation-report-<timestamp>.md`
- Coverage HTML: `backend/target/site/jacoco/index.html`
- Surefire HTML: `backend/target/surefire-reports/index.html`

---

## Performance Targets

### H2 Profile

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Total Time | <4 min | 4-5 min | >5 min |
| Avg Test Time | <2s | 2-3s | >3s |
| Slowest Test | <10s | 10-20s | >20s |

### PostgreSQL Profile

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Total Time | <12 min | 12-15 min | >15 min |
| Avg Test Time | <5s | 5-8s | >8s |
| Slowest Test | <30s | 30-60s | >60s |
| Container Startup | <30s | 30-60s | >60s |

### Tracking Performance

Use `generate-test-report.ps1` to track:
- Total execution time over time
- Individual test performance
- Performance regressions

---

## Troubleshooting

### Common Issues

See `RUN_FULL_TEST_VALIDATION.md` for detailed troubleshooting.

Quick references:

**Java Version Issues**:
```cmd
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
java -version
```

**Docker Not Running**:
```cmd
docker ps
REM Start Docker Desktop
```

**Port 5432 In Use**:
```powershell
Get-NetTCPConnection -LocalPort 5432
Stop-Service postgresql-x64-16
```

**Stale Test Containers**:
```cmd
docker ps -a --filter "label=org.testcontainers=true"
docker rm -f <container-id>
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Backend E2E Tests

on: [push, pull_request]

jobs:
  test-h2:
    name: E2E Tests - H2
    runs-on: ubuntu-latest
    timeout-minutes: 6
    
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
      
      - name: Generate Report
        if: always()
        run: |
          pwsh scripts/generate-test-report.ps1
      
      - name: Upload Coverage Report
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report-h2
          path: backend/target/site/jacoco/
      
      - name: Upload Test Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-report-h2
          path: test-reports/
  
  test-postgres:
    name: E2E Tests - PostgreSQL
    runs-on: ubuntu-latest
    timeout-minutes: 16
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Run PostgreSQL Tests
        run: |
          cd backend
          mvn verify -Pbackend-e2e-postgres
      
      - name: Generate Report
        if: always()
        run: |
          pwsh scripts/generate-test-report.ps1
      
      - name: Upload Coverage Report
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report-postgres
          path: backend/target/site/jacoco/
      
      - name: Upload Test Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-report-postgres
          path: test-reports/
```

---

## File Structure

```
/
├── backend/
│   ├── src/test/java/com/example/backend/
│   │   ├── *BackendE2ETest.java (E2E test files)
│   │   └── annotation/
│   │       ├── BackendE2ETest.java (test annotation)
│   │       └── BaseBackendE2ETest.java (base class)
│   ├── src/test/resources/
│   │   ├── application-test.yml (H2 config)
│   │   ├── application-backend-e2e.yml
│   │   ├── application-backend-e2e-h2.yml
│   │   └── application-backend-e2e-postgres.yml
│   ├── target/
│   │   ├── site/jacoco/ (coverage reports)
│   │   └── surefire-reports/ (test reports)
│   ├── pom.xml (Maven config with profiles and JaCoCo)
│   ├── settings.xml (Maven settings)
│   ├── toolchains.xml (Java 17 toolchain)
│   └── mvn-java17.cmd (Java 17 wrapper)
├── scripts/
│   ├── run-full-test-suite.ps1 (comprehensive suite)
│   └── generate-test-report.ps1 (report generator)
├── test-reports/ (generated reports)
├── run-tests-h2.cmd (H2 runner)
├── run-tests-postgres.cmd (PostgreSQL runner)
├── run-tests-all.cmd (complete suite runner)
├── run-tests-with-report.cmd (interactive runner)
├── RUN_FULL_TEST_VALIDATION.md (validation guide)
├── TEST_INFRASTRUCTURE_README.md (this file)
├── TEST_VALIDATION_SUITE.md (test suite documentation)
└── KNOWN_ISSUES.md (issue tracking)
```

---

## Best Practices

1. **Run H2 tests before commit**: Fast feedback loop
2. **Run PostgreSQL tests before push**: Catch DB issues
3. **Review coverage reports**: Ensure critical paths covered
4. **Check performance trends**: Identify regression
5. **Document failures**: Use KNOWN_ISSUES.md
6. **Clean between runs**: `mvn clean` to avoid stale data
7. **Keep Docker clean**: Remove orphaned containers
8. **Monitor execution time**: Track against targets

---

## Maintenance

### Adding New Tests

1. Create `*BackendE2ETest.java` in `backend/src/test/java/com/example/backend/`
2. Extend `BaseBackendE2ETest`
3. Annotate with `@BackendE2ETest`
4. Run tests to verify

### Updating Coverage Targets

Edit `backend/pom.xml`:
```xml
<minimum>0.80</minimum> <!-- Change to desired percentage -->
```

### Adding New Profiles

1. Add profile to `backend/pom.xml`
2. Create Spring config in `backend/src/test/resources/`
3. Update test scripts to include new profile
4. Update documentation

---

## Support

For questions or issues:
1. Check this README
2. Review `RUN_FULL_TEST_VALIDATION.md`
3. Check `TEST_VALIDATION_SUITE.md`
4. Review `KNOWN_ISSUES.md`
5. Check test logs and reports

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0

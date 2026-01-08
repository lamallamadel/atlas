# Known Issues and Follow-Up Tasks

## Current Status: NO KNOWN ISSUES ✅

All tests should pass with zero failures. If you encounter any issues, please document them here.

## Issue Template

When documenting issues, use the following template:

### Issue #X: [Short Description]

**Status**: Open | In Progress | Resolved
**Priority**: Critical | High | Medium | Low
**Affects**: H2 Profile | PostgreSQL Profile | Both

**Description**:
[Detailed description of the issue]

**Reproduction Steps**:
1. Step 1
2. Step 2
3. ...

**Root Cause Analysis**:
[Analysis of why the issue occurs]

**Workaround**:
[Temporary solution if available]

**Permanent Fix**:
[Proposed solution]

**Test Evidence**:
```
[Stack trace, error messages, or test output]
```

**Related Files**:
- File 1
- File 2

**Created**: YYYY-MM-DD
**Updated**: YYYY-MM-DD
**Resolved**: YYYY-MM-DD (if applicable)

---

## Resolved Issues Archive

### Example: Issue #0: Template Example (RESOLVED)

**Status**: Resolved
**Priority**: Low
**Affects**: Documentation

**Description**:
This is an example issue entry showing the expected format.

**Root Cause Analysis**:
Example for documentation purposes.

**Permanent Fix**:
Documented the issue tracking format.

**Resolved**: 2024-01-15

---

## Follow-Up Tasks

### Performance Optimization
- [ ] Monitor H2 test execution time - target to stay under 4 minutes
- [ ] Monitor PostgreSQL test execution time - target to stay under 12 minutes
- [ ] Identify and optimize slow tests
- [ ] Review test database initialization strategies

### Coverage Improvements
- [ ] Maintain 80%+ line coverage on controllers
- [ ] Maintain 80%+ line coverage on services
- [ ] Maintain 80%+ line coverage on repositories
- [ ] Maintain 80%+ line coverage on security components
- [ ] Add tests for edge cases in critical paths

### Test Infrastructure
- [ ] Automate Testcontainer cleanup in CI/CD
- [ ] Add test execution metrics dashboard
- [ ] Set up test result notifications
- [ ] Create test data generation utilities
- [ ] Implement test execution time regression alerts

### Documentation
- [ ] Keep test documentation up-to-date
- [ ] Document new test patterns
- [ ] Update troubleshooting guide with new solutions
- [ ] Create video walkthroughs for test suite

### Database Compatibility
- [ ] Verify all H2/PostgreSQL compatibility edge cases
- [ ] Test with different PostgreSQL versions
- [ ] Document database-specific behaviors
- [ ] Create migration testing utilities

### CI/CD Integration
- [ ] Configure GitHub Actions workflow
- [ ] Set up test result badges
- [ ] Configure automatic coverage reports
- [ ] Set up failure notifications

---

## How to Report Issues

1. **Run the failing test in isolation** to confirm the issue
2. **Capture the full error output** including stack traces
3. **Identify the root cause** if possible
4. **Check if it's environment-specific** (H2 vs PostgreSQL, OS, etc.)
5. **Document the issue** using the template above
6. **Create a follow-up task** if it requires significant work

## Issue Categories

### Test Failures
Issues where tests fail to pass with zero errors.

### Performance Issues
Issues where tests exceed the target execution time:
- H2: >5 minutes
- PostgreSQL: >15 minutes

### Coverage Gaps
Issues where coverage falls below 80% target on critical packages.

### Environment Issues
Issues related to Docker, Java version, port conflicts, etc.

### Data Issues
Issues related to test data, database state, or data generation.

### Flaky Tests
Tests that pass/fail intermittently.

---

## Monitoring and Prevention

### Daily Checks
- Run full test suite before committing
- Review test execution time trends
- Monitor coverage percentage

### Weekly Reviews
- Review this document for new issues
- Update follow-up task progress
- Archive resolved issues

### Release Checklist
- All tests pass with zero failures
- All tests meet performance targets
- Coverage meets 80%+ threshold
- No unresolved critical issues
- All follow-up tasks assessed

---

## Useful Commands for Issue Investigation

### Run a single test
```bash
cd backend
mvn test -Dtest=DossierBackendE2ETest -Pbackend-e2e-h2
```

### Run with debug logging
```bash
cd backend
mvn test -X -Pbackend-e2e-h2
```

### Check test reports
```bash
# View HTML report
start backend\target\surefire-reports\index.html

# View text reports
type backend\target\surefire-reports\*.txt
```

### Docker diagnostics
```bash
# List Testcontainers
docker ps -a --filter "label=org.testcontainers=true"

# View container logs
docker logs <container-id>

# Check port usage
netstat -ano | findstr ":5432"
```

### Coverage analysis
```bash
# Open coverage report
start backend\target\site\jacoco\index.html

# View coverage summary (requires xmlstarlet or similar)
# Or just open the HTML report
```

---

**Last Updated**: 2024-01-15
**Next Review**: Before each release

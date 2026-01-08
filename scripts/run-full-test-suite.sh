#!/bin/bash
set -euo pipefail

# Comprehensive test validation suite runner for backend and frontend E2E tests

# Color output functions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${CYAN}======================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}======================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}[✓] $1${NC}"
}

print_failure() {
    echo -e "${RED}[✗] $1${NC}"
}

print_info() {
    echo -e "${YELLOW}[i] $1${NC}"
}

print_timing() {
    echo -e "${MAGENTA}[⏱] $1${NC}"
}

# Parse command line arguments
SKIP_BACKEND=false
SKIP_FRONTEND=false
CONFIGURATION="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-backend)
            SKIP_BACKEND=true
            shift
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
            shift
            ;;
        --backend-only)
            SKIP_FRONTEND=true
            shift
            ;;
        --frontend-only)
            SKIP_BACKEND=true
            shift
            ;;
        --configuration)
            CONFIGURATION="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Initialize test results
declare -A BACKEND_H2=(["status"]="NotRun" ["duration"]=0 ["tests"]=0 ["failures"]=0)
declare -A BACKEND_POSTGRES=(["status"]="NotRun" ["duration"]=0 ["tests"]=0 ["failures"]=0)
declare -A FRONTEND_H2_MOCK=(["status"]="NotRun" ["duration"]=0 ["tests"]=0 ["failures"]=0)
declare -A FRONTEND_H2_KEYCLOAK=(["status"]="NotRun" ["duration"]=0 ["tests"]=0 ["failures"]=0)
declare -A FRONTEND_POSTGRES_MOCK=(["status"]="NotRun" ["duration"]=0 ["tests"]=0 ["failures"]=0)
declare -A FRONTEND_POSTGRES_KEYCLOAK=(["status"]="NotRun" ["duration"]=0 ["tests"]=0 ["failures"]=0)
declare -A COVERAGE=(["line"]=0 ["branch"]=0)

# Set up directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
REPORTS_DIR="$ROOT_DIR/test-reports"

# Create reports directory
mkdir -p "$REPORTS_DIR"

REPORT_FILE="$REPORTS_DIR/test-validation-report-$(date +%Y%m%d-%H%M%S).md"

# ============================================
# Backend E2E Tests
# ============================================

if [ "$SKIP_BACKEND" = false ]; then
    print_header "BACKEND E2E TESTS"
    
    # Check Java version
    print_info "Checking Java version..."
    if ! command -v java &> /dev/null; then
        print_failure "Java not found. Please install Java 17+"
        exit 1
    fi
    
    JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -lt 17 ]; then
        print_failure "Java 17 or higher required. Found: Java $JAVA_VERSION"
        exit 1
    fi
    print_success "Java version: $JAVA_VERSION"
    
    # H2 Profile Tests
    print_header "Backend E2E Tests - H2 Profile (Target: <5 minutes)"
    H2_START=$(date +%s)
    
    cd "$BACKEND_DIR"
    print_info "Running: mvn clean test -Pbackend-e2e-h2"
    
    if mvn clean test -Pbackend-e2e-h2 > /tmp/h2-output.log 2>&1; then
        H2_EXIT_CODE=0
    else
        H2_EXIT_CODE=$?
    fi
    
    H2_END=$(date +%s)
    BACKEND_H2["duration"]=$((H2_END - H2_START))
    
    # Parse results
    if grep -q "Tests run:" /tmp/h2-output.log; then
        TESTS=$(grep "Tests run:" /tmp/h2-output.log | tail -1 | sed -n 's/.*Tests run: \([0-9]*\).*/\1/p')
        FAILURES=$(grep "Tests run:" /tmp/h2-output.log | tail -1 | sed -n 's/.*Failures: \([0-9]*\).*/\1/p')
        ERRORS=$(grep "Tests run:" /tmp/h2-output.log | tail -1 | sed -n 's/.*Errors: \([0-9]*\).*/\1/p')
        BACKEND_H2["tests"]=$TESTS
        BACKEND_H2["failures"]=$((FAILURES + ERRORS))
    fi
    
    if [ $H2_EXIT_CODE -eq 0 ] && [ "${BACKEND_H2["failures"]}" -eq 0 ]; then
        BACKEND_H2["status"]="Passed"
        print_success "Backend H2 tests passed in ${BACKEND_H2["duration"]}s"
        
        if [ "${BACKEND_H2["duration"]}" -lt 300 ]; then
            print_success "Duration under 5 minutes target ✓"
        else
            print_failure "Duration exceeds 5 minutes target"
        fi
    else
        BACKEND_H2["status"]="Failed"
        print_failure "Backend H2 tests failed"
    fi
    
    cd "$ROOT_DIR"
    
    # PostgreSQL Profile Tests
    print_header "Backend E2E Tests - PostgreSQL Profile (Target: <15 minutes)"
    POSTGRES_START=$(date +%s)
    
    cd "$BACKEND_DIR"
    print_info "Running: mvn clean test -Pbackend-e2e-postgres"
    
    if mvn clean test -Pbackend-e2e-postgres > /tmp/postgres-output.log 2>&1; then
        POSTGRES_EXIT_CODE=0
    else
        POSTGRES_EXIT_CODE=$?
    fi
    
    POSTGRES_END=$(date +%s)
    BACKEND_POSTGRES["duration"]=$((POSTGRES_END - POSTGRES_START))
    
    # Parse results
    if grep -q "Tests run:" /tmp/postgres-output.log; then
        TESTS=$(grep "Tests run:" /tmp/postgres-output.log | tail -1 | sed -n 's/.*Tests run: \([0-9]*\).*/\1/p')
        FAILURES=$(grep "Tests run:" /tmp/postgres-output.log | tail -1 | sed -n 's/.*Failures: \([0-9]*\).*/\1/p')
        ERRORS=$(grep "Tests run:" /tmp/postgres-output.log | tail -1 | sed -n 's/.*Errors: \([0-9]*\).*/\1/p')
        BACKEND_POSTGRES["tests"]=$TESTS
        BACKEND_POSTGRES["failures"]=$((FAILURES + ERRORS))
    fi
    
    if [ $POSTGRES_EXIT_CODE -eq 0 ] && [ "${BACKEND_POSTGRES["failures"]}" -eq 0 ]; then
        BACKEND_POSTGRES["status"]="Passed"
        print_success "Backend PostgreSQL tests passed in ${BACKEND_POSTGRES["duration"]}s"
        
        if [ "${BACKEND_POSTGRES["duration"]}" -lt 900 ]; then
            print_success "Duration under 15 minutes target ✓"
        else
            print_failure "Duration exceeds 15 minutes target"
        fi
    else
        BACKEND_POSTGRES["status"]="Failed"
        print_failure "Backend PostgreSQL tests failed"
    fi
    
    cd "$ROOT_DIR"
    
    # Cleanup Testcontainers
    print_header "Cleaning up Testcontainers"
    if command -v docker &> /dev/null; then
        print_info "Removing Testcontainers..."
        CONTAINERS=$(docker ps -a -q --filter "label=org.testcontainers=true" 2>/dev/null || true)
        if [ -n "$CONTAINERS" ]; then
            docker rm -f $CONTAINERS 2>/dev/null || true
            print_success "Testcontainers cleaned up"
        else
            print_info "No Testcontainers to clean up"
        fi
    else
        print_info "Docker not available, skipping cleanup"
    fi
    
    # Extract coverage metrics
    print_header "Extracting Coverage Metrics"
    JACOCO_REPORT="$BACKEND_DIR/target/site/jacoco/index.html"
    if [ -f "$JACOCO_REPORT" ]; then
        if grep -q "Total" "$JACOCO_REPORT"; then
            LINE_COV=$(grep -A 1 "Total" "$JACOCO_REPORT" | grep -oP '\d+%' | head -1 | tr -d '%')
            BRANCH_COV=$(grep -A 1 "Total" "$JACOCO_REPORT" | grep -oP '\d+%' | tail -1 | tr -d '%')
            COVERAGE["line"]=$LINE_COV
            COVERAGE["branch"]=$BRANCH_COV
            
            print_info "Line Coverage: ${COVERAGE["line"]}%"
            print_info "Branch Coverage: ${COVERAGE["branch"]}%"
            
            AVG_COV=$(( (LINE_COV + BRANCH_COV) / 2 ))
            if [ $AVG_COV -ge 80 ]; then
                print_success "Coverage meets 80%+ target ✓"
            else
                print_failure "Coverage below 80% target"
            fi
        fi
    fi
fi

# ============================================
# Frontend E2E Tests
# ============================================

if [ "$SKIP_FRONTEND" = false ]; then
    print_header "FRONTEND E2E TESTS"
    
    # Check Playwright
    print_info "Checking Playwright installation..."
    cd "$FRONTEND_DIR"
    if ! npx playwright --version &> /dev/null; then
        print_info "Installing Playwright browsers..."
        npx playwright install
    fi
    print_success "Playwright ready"
    
    # H2 + Mock Auth Configuration
    if [ "$CONFIGURATION" = "all" ] || [ "$CONFIGURATION" = "h2-mock" ]; then
        print_header "Frontend E2E Tests - H2 + Mock Auth"
        H2_MOCK_START=$(date +%s)
        
        cd "$FRONTEND_DIR"
        print_info "Running: npx playwright test"
        
        if npx playwright test > /tmp/h2-mock-output.log 2>&1; then
            H2_MOCK_EXIT_CODE=0
        else
            H2_MOCK_EXIT_CODE=$?
        fi
        
        H2_MOCK_END=$(date +%s)
        FRONTEND_H2_MOCK["duration"]=$((H2_MOCK_END - H2_MOCK_START))
        
        # Parse results
        if grep -q "passed" /tmp/h2-mock-output.log; then
            PASSED=$(grep -oP '\d+(?= passed)' /tmp/h2-mock-output.log | tail -1)
            FRONTEND_H2_MOCK["tests"]=${PASSED:-0}
        fi
        if grep -q "failed" /tmp/h2-mock-output.log; then
            FAILED=$(grep -oP '\d+(?= failed)' /tmp/h2-mock-output.log | tail -1)
            FRONTEND_H2_MOCK["failures"]=${FAILED:-0}
        fi
        
        if [ $H2_MOCK_EXIT_CODE -eq 0 ]; then
            FRONTEND_H2_MOCK["status"]="Passed"
            print_success "Frontend H2+Mock tests passed in ${FRONTEND_H2_MOCK["duration"]}s"
        else
            FRONTEND_H2_MOCK["status"]="Failed"
            print_failure "Frontend H2+Mock tests failed"
        fi
        
        cd "$ROOT_DIR"
    fi
    
    # PostgreSQL + Mock Auth Configuration
    if [ "$CONFIGURATION" = "all" ] || [ "$CONFIGURATION" = "postgres-mock" ]; then
        print_header "Frontend E2E Tests - PostgreSQL + Mock Auth"
        POSTGRES_MOCK_START=$(date +%s)
        
        cd "$FRONTEND_DIR"
        print_info "Running: npx playwright test -c playwright-postgres-mock.config.ts"
        
        if npx playwright test -c playwright-postgres-mock.config.ts > /tmp/postgres-mock-output.log 2>&1; then
            POSTGRES_MOCK_EXIT_CODE=0
        else
            POSTGRES_MOCK_EXIT_CODE=$?
        fi
        
        POSTGRES_MOCK_END=$(date +%s)
        FRONTEND_POSTGRES_MOCK["duration"]=$((POSTGRES_MOCK_END - POSTGRES_MOCK_START))
        
        # Parse results
        if grep -q "passed" /tmp/postgres-mock-output.log; then
            PASSED=$(grep -oP '\d+(?= passed)' /tmp/postgres-mock-output.log | tail -1)
            FRONTEND_POSTGRES_MOCK["tests"]=${PASSED:-0}
        fi
        if grep -q "failed" /tmp/postgres-mock-output.log; then
            FAILED=$(grep -oP '\d+(?= failed)' /tmp/postgres-mock-output.log | tail -1)
            FRONTEND_POSTGRES_MOCK["failures"]=${FAILED:-0}
        fi
        
        if [ $POSTGRES_MOCK_EXIT_CODE -eq 0 ]; then
            FRONTEND_POSTGRES_MOCK["status"]="Passed"
            print_success "Frontend Postgres+Mock tests passed in ${FRONTEND_POSTGRES_MOCK["duration"]}s"
        else
            FRONTEND_POSTGRES_MOCK["status"]="Failed"
            print_failure "Frontend Postgres+Mock tests failed"
        fi
        
        cd "$ROOT_DIR"
    fi
    
    # H2 + Keycloak Auth Configuration
    if [ "$CONFIGURATION" = "all" ] || [ "$CONFIGURATION" = "h2-keycloak" ]; then
        print_header "Frontend E2E Tests - H2 + Keycloak Auth"
        print_info "Note: This requires Keycloak to be running"
        
        H2_KEYCLOAK_START=$(date +%s)
        
        cd "$FRONTEND_DIR"
        print_info "Running: npx playwright test -c playwright-h2-keycloak.config.ts"
        
        if npx playwright test -c playwright-h2-keycloak.config.ts > /tmp/h2-keycloak-output.log 2>&1; then
            H2_KEYCLOAK_EXIT_CODE=0
        else
            H2_KEYCLOAK_EXIT_CODE=$?
        fi
        
        H2_KEYCLOAK_END=$(date +%s)
        FRONTEND_H2_KEYCLOAK["duration"]=$((H2_KEYCLOAK_END - H2_KEYCLOAK_START))
        
        # Parse results
        if grep -q "passed" /tmp/h2-keycloak-output.log; then
            PASSED=$(grep -oP '\d+(?= passed)' /tmp/h2-keycloak-output.log | tail -1)
            FRONTEND_H2_KEYCLOAK["tests"]=${PASSED:-0}
        fi
        if grep -q "failed" /tmp/h2-keycloak-output.log; then
            FAILED=$(grep -oP '\d+(?= failed)' /tmp/h2-keycloak-output.log | tail -1)
            FRONTEND_H2_KEYCLOAK["failures"]=${FAILED:-0}
        fi
        
        if [ $H2_KEYCLOAK_EXIT_CODE -eq 0 ]; then
            FRONTEND_H2_KEYCLOAK["status"]="Passed"
            print_success "Frontend H2+Keycloak tests passed in ${FRONTEND_H2_KEYCLOAK["duration"]}s"
        else
            FRONTEND_H2_KEYCLOAK["status"]="Failed"
            print_failure "Frontend H2+Keycloak tests failed"
        fi
        
        cd "$ROOT_DIR"
    fi
    
    # PostgreSQL + Keycloak Auth Configuration
    if [ "$CONFIGURATION" = "all" ] || [ "$CONFIGURATION" = "postgres-keycloak" ]; then
        print_header "Frontend E2E Tests - PostgreSQL + Keycloak Auth"
        print_info "Note: This requires Keycloak and PostgreSQL to be running"
        
        POSTGRES_KEYCLOAK_START=$(date +%s)
        
        cd "$FRONTEND_DIR"
        print_info "Running: npx playwright test -c playwright-postgres-keycloak.config.ts"
        
        if npx playwright test -c playwright-postgres-keycloak.config.ts > /tmp/postgres-keycloak-output.log 2>&1; then
            POSTGRES_KEYCLOAK_EXIT_CODE=0
        else
            POSTGRES_KEYCLOAK_EXIT_CODE=$?
        fi
        
        POSTGRES_KEYCLOAK_END=$(date +%s)
        FRONTEND_POSTGRES_KEYCLOAK["duration"]=$((POSTGRES_KEYCLOAK_END - POSTGRES_KEYCLOAK_START))
        
        # Parse results
        if grep -q "passed" /tmp/postgres-keycloak-output.log; then
            PASSED=$(grep -oP '\d+(?= passed)' /tmp/postgres-keycloak-output.log | tail -1)
            FRONTEND_POSTGRES_KEYCLOAK["tests"]=${PASSED:-0}
        fi
        if grep -q "failed" /tmp/postgres-keycloak-output.log; then
            FAILED=$(grep -oP '\d+(?= failed)' /tmp/postgres-keycloak-output.log | tail -1)
            FRONTEND_POSTGRES_KEYCLOAK["failures"]=${FAILED:-0}
        fi
        
        if [ $POSTGRES_KEYCLOAK_EXIT_CODE -eq 0 ]; then
            FRONTEND_POSTGRES_KEYCLOAK["status"]="Passed"
            print_success "Frontend Postgres+Keycloak tests passed in ${FRONTEND_POSTGRES_KEYCLOAK["duration"]}s"
        else
            FRONTEND_POSTGRES_KEYCLOAK["status"]="Failed"
            print_failure "Frontend Postgres+Keycloak tests failed"
        fi
        
        cd "$ROOT_DIR"
    fi
fi

# ============================================
# Generate Report
# ============================================

print_header "Generating Test Report"

AVG_COVERAGE=$(( (${COVERAGE["line"]} + ${COVERAGE["branch"]}) / 2 ))

cat > "$REPORT_FILE" << EOF
# Test Validation Report
Generated: $(date '+%Y-%m-%d %H:%M:%S')

## Summary

| Test Suite | Status | Duration | Tests | Failures |
|------------|--------|----------|-------|----------|
| Backend H2 | ${BACKEND_H2["status"]} | ${BACKEND_H2["duration"]}s | ${BACKEND_H2["tests"]} | ${BACKEND_H2["failures"]} |
| Backend PostgreSQL | ${BACKEND_POSTGRES["status"]} | ${BACKEND_POSTGRES["duration"]}s | ${BACKEND_POSTGRES["tests"]} | ${BACKEND_POSTGRES["failures"]} |
| Frontend H2+Mock | ${FRONTEND_H2_MOCK["status"]} | ${FRONTEND_H2_MOCK["duration"]}s | ${FRONTEND_H2_MOCK["tests"]} | ${FRONTEND_H2_MOCK["failures"]} |
| Frontend H2+Keycloak | ${FRONTEND_H2_KEYCLOAK["status"]} | ${FRONTEND_H2_KEYCLOAK["duration"]}s | ${FRONTEND_H2_KEYCLOAK["tests"]} | ${FRONTEND_H2_KEYCLOAK["failures"]} |
| Frontend Postgres+Mock | ${FRONTEND_POSTGRES_MOCK["status"]} | ${FRONTEND_POSTGRES_MOCK["duration"]}s | ${FRONTEND_POSTGRES_MOCK["tests"]} | ${FRONTEND_POSTGRES_MOCK["failures"]} |
| Frontend Postgres+Keycloak | ${FRONTEND_POSTGRES_KEYCLOAK["status"]} | ${FRONTEND_POSTGRES_KEYCLOAK["duration"]}s | ${FRONTEND_POSTGRES_KEYCLOAK["tests"]} | ${FRONTEND_POSTGRES_KEYCLOAK["failures"]} |

## Performance Metrics

### Backend Tests
- H2 Profile: ${BACKEND_H2["duration"]}s $([ ${BACKEND_H2["duration"]} -lt 300 ] && echo "✓ Under 5min target" || echo "✗ Exceeds 5min target")
- PostgreSQL Profile: ${BACKEND_POSTGRES["duration"]}s $([ ${BACKEND_POSTGRES["duration"]} -lt 900 ] && echo "✓ Under 15min target" || echo "✗ Exceeds 15min target")

### Frontend Tests
- H2+Mock: ${FRONTEND_H2_MOCK["duration"]}s
- H2+Keycloak: ${FRONTEND_H2_KEYCLOAK["duration"]}s
- Postgres+Mock: ${FRONTEND_POSTGRES_MOCK["duration"]}s
- Postgres+Keycloak: ${FRONTEND_POSTGRES_KEYCLOAK["duration"]}s

## Coverage Metrics

- Line Coverage: ${COVERAGE["line"]}%
- Branch Coverage: ${COVERAGE["branch"]}%
- Average Coverage: ${AVG_COVERAGE}%
- Target: 80%+ $([ $AVG_COVERAGE -ge 80 ] && echo "✓ Met" || echo "✗ Not met")

## Database Compatibility

Tests verify compatibility across:
- H2 in-memory database (PostgreSQL mode)
- PostgreSQL with Testcontainers
- JSONB vs JSON type handling
- UUID generation strategies
- Timestamp precision handling
- Sequence behavior differences

## Authentication Configuration

Tests verify both:
- Mock JWT decoder for fast testing
- Real Keycloak authentication flow
- Token validation and propagation
- Multi-tenant org_id handling

## Test Categories

### Backend E2E Tests
- Annonce (Property) CRUD operations
- Dossier (Lead/Deal) workflow
- Partie Prenante (Stakeholder) management
- Message handling (SMS/Email/WhatsApp)
- Appointment scheduling
- Consentement (Consent) management
- Audit trail tracking
- Multi-tenant isolation
- Security and authentication
- Complete business workflows

### Frontend E2E Tests
- Annonce wizard workflow
- Dossier state machine transitions
- Message composition and sending
- Appointment creation and management
- Partie prenante CRUD operations
- Consentement capture and storage
- Multi-tenant functionality
- Error handling and validation
- Duplicate detection

## Exit Status

EOF

# Determine overall status
ALL_PASSED=true
for status in "${BACKEND_H2["status"]}" "${BACKEND_POSTGRES["status"]}" \
              "${FRONTEND_H2_MOCK["status"]}" "${FRONTEND_H2_KEYCLOAK["status"]}" \
              "${FRONTEND_POSTGRES_MOCK["status"]}" "${FRONTEND_POSTGRES_KEYCLOAK["status"]}"; do
    if [ "$status" = "Failed" ] || [ "$status" = "Error" ]; then
        ALL_PASSED=false
        break
    fi
done

if [ "$ALL_PASSED" = true ]; then
    echo "✅ **ALL TESTS PASSED**" >> "$REPORT_FILE"
    print_success "All tests passed!"
    EXIT_CODE=0
else
    echo "❌ **SOME TESTS FAILED**" >> "$REPORT_FILE"
    print_failure "Some tests failed. Review the report for details."
    EXIT_CODE=1
fi

print_success "Report saved to: $REPORT_FILE"

# Display summary
print_header "TEST VALIDATION SUMMARY"
cat "$REPORT_FILE"

exit $EXIT_CODE

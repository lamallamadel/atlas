#!/bin/bash
# Performance Load Testing Script
# Usage: ./run-load-tests.sh [test-type] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BASE_URL="${BASE_URL:-http://localhost:8080}"
TEST_TYPE="${1:-all}"

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Performance Load Testing Suite                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if backend is running
check_backend() {
    echo -e "${YELLOW}Checking if backend is running at ${BASE_URL}...${NC}"
    if curl -s -f "${BASE_URL}/actuator/health" > /dev/null; then
        echo -e "${GREEN}✓ Backend is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Backend is not running at ${BASE_URL}${NC}"
        echo -e "${YELLOW}Please start the backend first:${NC}"
        echo -e "  cd backend && SPRING_PROFILES_ACTIVE=performance mvn spring-boot:run"
        exit 1
    fi
}

# Function to run Gatling tests
run_gatling_test() {
    local test_class=$1
    local test_name=$2
    
    echo -e "${BLUE}Running Gatling test: ${test_name}${NC}"
    mvn gatling:test -Dgatling.simulationClass="${test_class}"
    
    # Find the latest report
    LATEST_REPORT=$(find target/gatling -name "index.html" | sort -r | head -n 1)
    if [ -n "$LATEST_REPORT" ]; then
        echo -e "${GREEN}✓ Test completed. Report available at: ${LATEST_REPORT}${NC}"
    fi
}

# Function to run K6 tests
run_k6_test() {
    local test_file=$1
    local test_name=$2
    
    echo -e "${BLUE}Running K6 test: ${test_name}${NC}"
    if command -v k6 &> /dev/null; then
        cd k6-tests
        k6 run "${test_file}" -e BASE_URL="${BASE_URL}"
        cd ..
        echo -e "${GREEN}✓ Test completed${NC}"
    else
        echo -e "${YELLOW}⚠ K6 not installed. Skipping K6 test.${NC}"
        echo -e "  Install K6: https://k6.io/docs/getting-started/installation/"
    fi
}

check_backend

case "${TEST_TYPE}" in
    "dossier"|"standard")
        echo -e "${GREEN}Running standard dossier creation load test...${NC}"
        run_gatling_test "com.example.backend.loadtest.DossierCreationLoadTest" "Dossier Creation Load Test"
        ;;
    
    "spike")
        echo -e "${GREEN}Running spike load test...${NC}"
        run_gatling_test "com.example.backend.loadtest.SpikeLoadTest" "Spike Load Test"
        ;;
    
    "stress")
        echo -e "${GREEN}Running stress load test...${NC}"
        run_gatling_test "com.example.backend.loadtest.StressLoadTest" "Stress Load Test"
        ;;
    
    "endurance")
        echo -e "${GREEN}Running endurance load test...${NC}"
        run_gatling_test "com.example.backend.loadtest.EnduranceLoadTest" "Endurance Load Test"
        ;;
    
    "k6")
        echo -e "${GREEN}Running K6 load tests...${NC}"
        run_k6_test "dossier-creation-load.js" "K6 Dossier Creation Load Test"
        ;;
    
    "all")
        echo -e "${GREEN}Running all load tests...${NC}"
        run_gatling_test "com.example.backend.loadtest.DossierCreationLoadTest" "Dossier Creation Load Test"
        run_gatling_test "com.example.backend.loadtest.SpikeLoadTest" "Spike Load Test"
        run_gatling_test "com.example.backend.loadtest.StressLoadTest" "Stress Load Test"
        ;;
    
    *)
        echo -e "${RED}Unknown test type: ${TEST_TYPE}${NC}"
        echo ""
        echo -e "${YELLOW}Usage: $0 [test-type]${NC}"
        echo ""
        echo "Available test types:"
        echo "  dossier|standard  - Standard dossier creation workflow (100 users, 60 min)"
        echo "  spike             - Sudden traffic spikes test"
        echo "  stress            - Gradual load increase to breaking point"
        echo "  endurance         - Sustained load over extended period"
        echo "  k6                - K6 load tests (if K6 is installed)"
        echo "  all               - Run all Gatling tests"
        echo ""
        echo "Examples:"
        echo "  $0 dossier"
        echo "  $0 spike"
        echo "  BASE_URL=http://staging.example.com $0 stress"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Load Testing Complete                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"

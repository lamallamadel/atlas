#!/bin/bash

# Bash script to run Backend E2E tests with PostgreSQL Testcontainers
# This script captures detailed logs showing the initialization order

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║ Backend E2E Tests with PostgreSQL Testcontainers                           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is running
echo -e "${YELLOW}Checking Docker status...${NC}"
if docker info &> /dev/null; then
    echo -e "${GREEN}✓ Docker is running${NC}"
else
    echo -e "${RED}✗ Docker is not running${NC}"
    echo -e "${YELLOW}Please start Docker and try again.${NC}"
    exit 1
fi

# Check Java version
echo ""
echo -e "${YELLOW}Checking Java version...${NC}"
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo -e "${GREEN}✓ Java found: $JAVA_VERSION${NC}"
else
    echo -e "${RED}✗ Java not found${NC}"
    echo -e "${YELLOW}Please ensure Java 17 is installed and in PATH${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║ Running Maven Verify with backend-e2e-postgres Profile                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create logs directory if it doesn't exist
LOGS_DIR="target/e2e-test-logs"
mkdir -p "$LOGS_DIR"

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="$LOGS_DIR/e2e-postgres-$TIMESTAMP.log"

echo -e "${CYAN}Test execution logs will be saved to: $LOG_FILE${NC}"
echo ""

# Run Maven verify with the backend-e2e-postgres profile
# Tee output to both console and log file
set +e
mvn verify -Pbackend-e2e-postgres 2>&1 | tee "$LOG_FILE"
EXIT_CODE=${PIPESTATUS[0]}
set -e

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║ Test Execution Complete                                                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed successfully!${NC}"
else
    echo -e "${RED}✗ Some tests failed. Exit code: $EXIT_CODE${NC}"
    echo ""
    echo -e "${YELLOW}Review the logs for details:${NC}"
    echo -e "${CYAN}  $LOG_FILE${NC}"
    echo ""
    echo -e "${YELLOW}Test reports available at:${NC}"
    echo -e "${CYAN}  target/surefire-reports/${NC}"
fi

echo ""
echo -e "${CYAN}Log file saved: $LOG_FILE${NC}"

# Extract and display initialization order summary from logs
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║ Initialization Order Summary                                               ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════════╝${NC}"

if grep -q "STEP 1: Initializing PostgreSQL Testcontainer" "$LOG_FILE"; then
    echo -e "${GREEN}✓ Step 1: PostgreSQL Testcontainer initialized${NC}"
fi
if grep -q "STEP 2: Registering PostgreSQL Container" "$LOG_FILE"; then
    echo -e "${GREEN}✓ Step 2: DataSource configured${NC}"
fi
if grep -q "STEP 3: Configuring Flyway" "$LOG_FILE"; then
    echo -e "${GREEN}✓ Step 3: Flyway configured${NC}"
fi
if grep -q "STEP 4: Starting Flyway Database Migrations" "$LOG_FILE"; then
    echo -e "${GREEN}✓ Step 4: Flyway migrations executed${NC}"
fi
if grep -q "STEP 5: Initializing Spring Application Context" "$LOG_FILE"; then
    echo -e "${GREEN}✓ Step 5: Spring Application Context initialized${NC}"
fi
if grep -q "STEP 6: Spring Application Context Ready" "$LOG_FILE"; then
    echo -e "${GREEN}✓ Step 6: Tests ready to execute${NC}"
fi

echo ""

exit $EXIT_CODE

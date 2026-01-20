#!/usr/bin/env pwsh
# Run backend E2E tests with PostgreSQL database
# This script sets JAVA_HOME to Java 17 and runs the tests

$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn verify -Pbackend-e2e-postgres

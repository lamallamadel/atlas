@echo off
echo Running H2 E2E Tests...
cd backend
mvn verify -Pbackend-e2e-h2
cd ..

#!/bin/bash

# Infra Reset Script
# This script stops the Infrastructure containers, removes the volumes, and recreates it

set -e

echo "Stopping Infrastructure..."
docker compose down -v

docker volume rm postgres_data 2>/dev/null || echo "Volume not found, continuing..."

echo "Infrastructure stoped."

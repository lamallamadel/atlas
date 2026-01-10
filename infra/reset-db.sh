#!/bin/bash

# Database Reset Script
# This script stops the PostgreSQL container, removes the volume, and recreates it

set -e

echo "Stopping PostgreSQL container..."
docker compose down -v

echo "Removing PostgreSQL volume..."
docker volume rm postgres_data 2>/dev/null || echo "Volume not found, continuing..."

echo "Starting PostgreSQL container with fresh volume..."
docker compose up -d

echo "Waiting for PostgreSQL to be healthy..."
until docker-compose ps | grep -q "healthy"; do
  echo -n "."
  sleep 1
done

echo ""
echo "Database reset complete! PostgreSQL is ready."

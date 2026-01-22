-- This migration seeds default referentials for specific organizations
-- It demonstrates the seeding pattern that can be used per tenant
-- Production deployments should use the ReferentialSeedingService

-- NOTE: Referential seeding is handled by:
-- 1. SeedDataLoader for dev profile (application startup)
-- 2. V104__Migration_postgres_default_referentials.sql for production PostgreSQL
-- The DO $$ procedural block previously in this file (lines 6-82) has been removed
-- to maintain H2 compatibility, as H2 does not support PostgreSQL's procedural blocks.

-- Update version column for existing DEFAULT-ORG referentials
UPDATE referential SET version = 1 WHERE org_id = 'DEFAULT-ORG' AND version IS NULL;

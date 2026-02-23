-- This migration originally seeded default referentials for organizations.
-- 
-- IMPORTANT: Referential seeding is now handled by:
-- 
-- 1. SeedDataLoader (com.example.backend.config.SeedDataLoader)
--    - Runs on application startup with 'dev' profile
--    - Automatically seeds referentials for development environments
--    - Uses ReferentialSeedingService for consistent seeding logic
-- 
-- 2. V104__Seed_default_referentials_per_org.sql
--    - PostgreSQL-specific migration for production environments
--    - Uses native PostgreSQL INSERT ... ON CONFLICT DO NOTHING syntax
--    - Provides idempotent seeding for production deployments
-- 
-- The MERGE statements that were previously in this file (lines 13-287) have been
-- removed to avoid duplicate seeding logic and reduce maintenance burden.
-- All referential data seeding is now centralized in the above mechanisms.

-- Update version column for existing DEFAULT-ORG referentials
-- This UPDATE statement is retained for backward compatibility with existing data
-- that may have been created by earlier versions of this migration.
UPDATE referential SET version = 1 WHERE org_id = 'DEFAULT-ORG' AND version IS NULL;



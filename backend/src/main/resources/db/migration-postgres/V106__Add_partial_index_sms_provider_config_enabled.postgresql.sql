-- Postgres optimization: only enabled rows
CREATE INDEX IF NOT EXISTS idx_sms_provider_config_enabled_true
  ON sms_provider_config (enabled)
  WHERE enabled IS TRUE;

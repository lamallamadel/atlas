-- Postgres optimization: only enabled rows
CREATE INDEX IF NOT EXISTS idx_sms_provider_config_enabled_true
  ON sms_provider_config (enabled)
  WHERE enabled IS TRUE;

-- Optional Postgres optimizations (partial indexes)

-- enabled providers only
CREATE INDEX IF NOT EXISTS idx_sms_provider_config_enabled_true
  ON sms_provider_config (enabled)
  WHERE enabled IS TRUE;

-- only rows with a throttle timestamp
CREATE INDEX IF NOT EXISTS idx_sms_rate_limit_throttle_not_null
  ON sms_rate_limit (throttle_until)
  WHERE throttle_until IS NOT NULL;
-- only rows with reset_at in the future
CREATE INDEX IF NOT EXISTS idx_sms_rate_limit_reset_at_future
  ON sms_rate_limit (reset_at)
  WHERE reset_at > CURRENT_TIMESTAMP;

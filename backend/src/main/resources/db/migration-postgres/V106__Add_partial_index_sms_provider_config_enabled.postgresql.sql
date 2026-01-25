-- Enabled providers only (keep ONE definition)
CREATE INDEX IF NOT EXISTS idx_sms_provider_config_enabled_true
  ON sms_provider_config (enabled)
  WHERE enabled IS TRUE;

-- Only rows with a throttle timestamp
CREATE INDEX IF NOT EXISTS idx_sms_rate_limit_throttle_until_not_null
  ON sms_rate_limit (throttle_until)
  WHERE throttle_until IS NOT NULL;

-- Fix: cannot use CURRENT_TIMESTAMP in partial index predicate
DROP INDEX IF EXISTS idx_sms_rate_limit_reset_at_future;

-- Use a normal index (works well with reset_at > now() queries)
CREATE INDEX IF NOT EXISTS idx_sms_rate_limit_reset_at
  ON sms_rate_limit (reset_at);

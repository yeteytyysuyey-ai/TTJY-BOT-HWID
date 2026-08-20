-- ============================================================
-- TTJY-BOT Database Schema
-- Run this SQL in your Supabase SQL Editor
-- ============================================================

-- 1. Create keys table
--    HWID policy: 1 HWID per key (TEXT column, nullable)
--    When hwid IS NULL  → key is unbound (new / reset)
--    When hwid IS SET   → key is locked to that device
CREATE TABLE IF NOT EXISTS keys (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_id  TEXT        NOT NULL,
    custom_name TEXT        NOT NULL,
    key_value   TEXT        NOT NULL UNIQUE,
    hwid        TEXT        DEFAULT NULL,   -- single HWID binding (1 per key)
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by discord_id and key_value
CREATE INDEX IF NOT EXISTS idx_keys_discord_id ON keys(discord_id);
CREATE INDEX IF NOT EXISTS idx_keys_key_value  ON keys(key_value);
CREATE INDEX IF NOT EXISTS idx_keys_hwid       ON keys(hwid);

-- ============================================================
-- MIGRATION: If upgrading from the old schema that used
-- hwids JSONB column, run this to add the new hwid column:
--
-- ALTER TABLE keys ADD COLUMN IF NOT EXISTS hwid TEXT DEFAULT NULL;
--
-- To migrate existing JSONB hwids data to the new single column:
-- UPDATE keys
-- SET hwid = (hwids->0->>'hwid_value')
-- WHERE jsonb_array_length(hwids) > 0 AND hwid IS NULL;
-- ============================================================

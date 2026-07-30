-- Run this SQL in your Supabase SQL Editor

-- 1. Create keys table
CREATE TABLE keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_id TEXT NOT NULL,
    custom_name TEXT NOT NULL,
    key_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create hwids table
CREATE TABLE hwids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id UUID NOT NULL REFERENCES keys(id) ON DELETE CASCADE,
    custom_name TEXT NOT NULL,
    hwid_value TEXT NOT NULL
);

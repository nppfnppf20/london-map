-- Migrate beacons: populate categories from category, then drop old column
-- Run this in Supabase SQL Editor

-- 1. Populate categories from the old category column where not already set
UPDATE beacons SET categories = jsonb_build_array(category) WHERE category IS NOT NULL AND (categories IS NULL OR categories = '[]'::jsonb);

-- 2. Drop the old column
ALTER TABLE beacons DROP COLUMN IF EXISTS category;

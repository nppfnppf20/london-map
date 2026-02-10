-- Add image_path column to beacons table
ALTER TABLE beacons ADD COLUMN IF NOT EXISTS image_path TEXT;

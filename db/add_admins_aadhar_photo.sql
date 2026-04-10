-- Run once against PostgreSQL (e.g. psql "$DB_URL" -f db/add_admins_aadhar_photo.sql)
-- Stores uploaded file path like: uploads/<filename>
ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS aadhar_photo TEXT;


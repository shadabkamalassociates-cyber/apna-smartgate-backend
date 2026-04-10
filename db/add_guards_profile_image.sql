-- Run once against PostgreSQL (e.g. psql "$DB_URL" -f db/add_guards_profile_image.sql)
ALTER TABLE guards
  ADD COLUMN IF NOT EXISTS profile_image TEXT;

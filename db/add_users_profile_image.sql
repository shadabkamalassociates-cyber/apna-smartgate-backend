-- Run once against your PostgreSQL database (e.g. psql -f db/add_users_profile_image.sql)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_image TEXT;

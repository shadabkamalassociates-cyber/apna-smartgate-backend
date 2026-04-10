-- Run once if `admins.profile_image` is missing (e.g. psql "$DB_URL" -f db/add_admins_profile_image.sql)
ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS profile_image TEXT;

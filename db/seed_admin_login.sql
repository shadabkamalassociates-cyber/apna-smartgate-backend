-- Seed script for admin-panel login user
-- Login endpoint this supports: POST /api/secretory/sign-in
--
-- Default credentials:
--   email:    admin@kamalassociates.com
--   password: Admin@123
--
-- Run:
--   psql -h <DB_HOST> -p <DB_PORT> -U <DB_USER> -d <DB_NAME> -f db/seed_admin_login.sql

BEGIN;

DO $$
DECLARE
  has_created_by boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admins'
      AND column_name = 'created_by'
  ) INTO has_created_by;

  IF has_created_by THEN
    IF EXISTS (SELECT 1 FROM admins WHERE email = 'admin@kamalassociates.com') THEN
      UPDATE admins
      SET
        name = 'Admin Panel User',
        phone = '9999999999',
        password = '$2b$10$vnLNJteuQZRh0wEKrh.OS.yhsEnBBSjIel6ORrtHjUJLEGdOAE5wC',
        role = 'admin',
        updated_at = CURRENT_TIMESTAMP
      WHERE email = 'admin@kamalassociates.com';
    ELSE
      INSERT INTO admins (name, email, phone, password, role, created_by)
      VALUES (
        'Admin Panel User',
        'admin@kamalassociates.com',
        '9999999999',
        '$2b$10$vnLNJteuQZRh0wEKrh.OS.yhsEnBBSjIel6ORrtHjUJLEGdOAE5wC',
        'admin',
        NULL
      );
    END IF;
  ELSE
    IF EXISTS (SELECT 1 FROM admins WHERE email = 'admin@kamalassociates.com') THEN
      UPDATE admins
      SET
        name = 'Admin Panel User',
        phone = '9999999999',
        password = '$2b$10$vnLNJteuQZRh0wEKrh.OS.yhsEnBBSjIel6ORrtHjUJLEGdOAE5wC',
        role = 'admin',
        updated_at = CURRENT_TIMESTAMP
      WHERE email = 'admin@kamalassociates.com';
    ELSE
      INSERT INTO admins (name, email, phone, password, role)
      VALUES (
        'Admin Panel User',
        'admin@kamalassociates.com',
        '9999999999',
        '$2b$10$vnLNJteuQZRh0wEKrh.OS.yhsEnBBSjIel6ORrtHjUJLEGdOAE5wC',
        'admin'
      );
    END IF;
  END IF;
END $$;

COMMIT;

SELECT id, name, email, phone, role
FROM admins
WHERE email = 'admin@kamalassociates.com';

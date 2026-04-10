-- Run once against PostgreSQL (e.g. psql "$DB_URL" -f db/add_vendor_services_images.sql)
-- Stores uploaded image paths like: uploads/vendor-service-images/<filename>
ALTER TABLE vendor_services
  ADD COLUMN IF NOT EXISTS images TEXT[];


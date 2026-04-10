-- Run once against PostgreSQL (e.g. psql "$DB_URL" -f db/add_tickets_images.sql)
-- Stores uploaded image paths like: uploads/ticket-images/<filename>
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS images TEXT[];


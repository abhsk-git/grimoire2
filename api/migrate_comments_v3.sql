-- Comments v3 migration: GIF + sticker attachments
-- Additive only — adds two NULLable columns. Existing rows are untouched
-- (every current comment simply gets media_url = NULL and renders text-only).
-- Run once on the live database:
--   mysql -u root -p linkvault < migrate_comments_v3.sql

ALTER TABLE blog_comments
  ADD COLUMN media_url  VARCHAR(512)              NULL AFTER content,
  ADD COLUMN media_type ENUM('gif','sticker')    NULL AFTER media_url;

-- Comments v2 migration: threaded replies + reactions
-- Run once on the live database:
--   mysql -u root -p linkvault < migrate_comments_v2.sql

ALTER TABLE blog_comments
  ADD COLUMN parent_id INT NULL     AFTER post_id,
  ADD COLUMN likes     INT UNSIGNED DEFAULT 0 AFTER content,
  ADD COLUMN dislikes  INT UNSIGNED DEFAULT 0 AFTER likes;

ALTER TABLE blog_comments
  ADD CONSTRAINT fk_comment_parent
    FOREIGN KEY (parent_id) REFERENCES blog_comments(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS comment_votes (
  comment_id  INT         NOT NULL,
  session_key VARCHAR(64) NOT NULL,
  vote        TINYINT     NOT NULL,   -- 1 = upvote, -1 = downvote
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (comment_id, session_key),
  FOREIGN KEY (comment_id) REFERENCES blog_comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Grimoire migrations — run once on existing databases
-- Safe to run multiple times (uses IF NOT EXISTS / ignores duplicate column errors)

USE linkvault;

-- Add is_starred column to links (for starred/favourites feature)
ALTER TABLE links ADD COLUMN IF NOT EXISTS is_starred TINYINT(1) DEFAULT 0;
ALTER TABLE links ADD INDEX IF NOT EXISTS idx_starred (user_id, is_starred);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ensure blog_posts has the featured column (already in schema_blog.sql but safe to repeat)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured TINYINT(1) DEFAULT 0;

-- User settings: JSON blob, synced per-account (editor prefs, theme, etc.)
ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSON NULL;

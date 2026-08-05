-- LinkVault Blog Schema
-- Run: mysql -u root -p linkvault < schema_blog.sql

-- Media bytes live in media_assets (schema.sql), not the container filesystem.

CREATE TABLE IF NOT EXISTS blog_posts (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  title         VARCHAR(500) NOT NULL,
  slug          VARCHAR(600) NOT NULL,
  excerpt       TEXT,
  content       LONGTEXT,
  cover_image   VARCHAR(500) DEFAULT '',
  tags          VARCHAR(500) DEFAULT '',
  status        ENUM('draft','published') DEFAULT 'draft',
  reading_time  TINYINT UNSIGNED DEFAULT 1,
  views         INT UNSIGNED DEFAULT 0,
  likes         INT UNSIGNED DEFAULT 0,
  featured      TINYINT(1) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at  TIMESTAMP NULL,
  UNIQUE KEY uq_slug (slug),
  FULLTEXT KEY ft_posts (title, excerpt, tags),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_likes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  post_id      INT NOT NULL,
  user_id      INT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_like    (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_comments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  post_id     INT NOT NULL,
  parent_id   INT NULL,
  user_id     INT NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  content     TEXT NOT NULL,
  media_url   VARCHAR(512) NULL,
  media_type  ENUM('gif','sticker') NULL,
  likes       INT UNSIGNED DEFAULT 0,
  dislikes    INT UNSIGNED DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id)   REFERENCES blog_posts(id)    ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES blog_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comment_votes (
  comment_id  INT         NOT NULL,
  user_id     INT         NOT NULL,
  vote        TINYINT     NOT NULL,
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (comment_id, user_id),
  FOREIGN KEY (comment_id) REFERENCES blog_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

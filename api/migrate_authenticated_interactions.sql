-- Remove forgeable anonymous interaction identities and retain account-owned data.
-- Run once before deploying the matching backend.

DELETE FROM blog_likes WHERE user_id IS NULL;
ALTER TABLE blog_likes DROP INDEX uq_session_like;
ALTER TABLE blog_likes DROP COLUMN session_key;
ALTER TABLE blog_likes MODIFY user_id INT NOT NULL;

-- Anonymous comments cannot have ownership or safe deletion semantics.
DELETE FROM blog_comments WHERE user_id IS NULL;
ALTER TABLE blog_comments DROP FOREIGN KEY blog_comments_ibfk_2;
ALTER TABLE blog_comments MODIFY user_id INT NOT NULL;
ALTER TABLE blog_comments MODIFY author_name VARCHAR(100) NOT NULL;
ALTER TABLE blog_comments
  ADD CONSTRAINT fk_blog_comments_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Anonymous votes are intentionally discarded; counts are rebuilt from account votes.
DELETE FROM comment_votes;
UPDATE blog_comments SET likes=0, dislikes=0;
ALTER TABLE comment_votes ADD INDEX idx_comment_votes_comment (comment_id);
ALTER TABLE comment_votes DROP PRIMARY KEY;
ALTER TABLE comment_votes CHANGE session_key user_id INT NOT NULL;
ALTER TABLE comment_votes ADD PRIMARY KEY (comment_id, user_id);
ALTER TABLE comment_votes
  ADD CONSTRAINT fk_comment_votes_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Remove obsolete theme/privacy keys from persisted user preferences.
UPDATE users
SET settings = JSON_REMOVE(settings, '$.privacy.allowAnonymousVotes')
WHERE settings IS NOT NULL;
UPDATE users
SET settings = JSON_SET(settings, '$.appearance.theme', 'light')
WHERE JSON_UNQUOTE(JSON_EXTRACT(settings, '$.appearance.theme')) = 'glass';

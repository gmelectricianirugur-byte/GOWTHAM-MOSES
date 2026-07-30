-- ELE Work portfolio database schema (PostgreSQL 15+)
-- Create a database first, then run: psql -d ele_work -f schema.sql

BEGIN;

CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_sessions (
  token UUID PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX admin_sessions_active_lookup_idx
  ON admin_sessions (token, expires_at)
  WHERE revoked_at IS NULL;

CREATE TYPE media_type AS ENUM ('image', 'video');

CREATE TABLE work_items (
  id UUID PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  category VARCHAR(100) NOT NULL,
  media_type media_type NOT NULL,
  media_url TEXT NOT NULL UNIQUE,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  uploaded_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT work_items_media_url_check CHECK (media_url LIKE '/uploads/%'),
  CONSTRAINT work_items_mime_type_check CHECK (
    (media_type = 'image' AND mime_type LIKE 'image/%') OR
    (media_type = 'video' AND mime_type LIKE 'video/%')
  )
);

CREATE INDEX work_items_created_at_idx ON work_items (created_at DESC);
CREATE INDEX work_items_category_idx ON work_items (category);

-- Posts can be used for project updates, announcements, or a blog section.
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  body TEXT NOT NULL,
  excerpt VARCHAR(320),
  featured_media_url TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  author_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT posts_featured_media_url_check CHECK (
    featured_media_url IS NULL OR featured_media_url LIKE '/uploads/%'
  ),
  CONSTRAINT posts_published_at_check CHECK (
    (published = FALSE AND published_at IS NULL) OR
    (published = TRUE AND published_at IS NOT NULL)
  )
);

CREATE INDEX posts_public_feed_idx ON posts (published_at DESC) WHERE published = TRUE;
CREATE INDEX posts_author_idx ON posts (author_id);

-- Keep updated_at correct for application updates.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_users_set_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER work_items_set_updated_at
BEFORE UPDATE ON work_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER posts_set_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- SQL used by the current API.

-- Public work gallery
-- SELECT id, title, category, media_type AS type, media_url AS url, created_at AS "createdAt"
-- FROM work_items ORDER BY created_at DESC;

-- Login lookup (compare password with bcrypt in Node.js)
-- SELECT id, username, password_hash FROM admin_users WHERE username = $1;

-- Save a session after successful login
-- INSERT INTO admin_sessions (token, admin_user_id, expires_at) VALUES ($1, $2, $3);

-- Verify an owner token
-- SELECT admin_user_id FROM admin_sessions
-- WHERE token = $1 AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP;

-- Create a work item
-- INSERT INTO work_items
--   (id, title, category, media_type, media_url, original_filename, mime_type, file_size_bytes, uploaded_by)
-- VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
-- RETURNING id, title, category, media_type AS type, media_url AS url, created_at AS "createdAt";

-- Fetch the media path before deleting the matching file from disk
-- DELETE FROM work_items WHERE id = $1
-- RETURNING media_url;

-- Create a post. Generate id and slug in Node.js.
-- INSERT INTO posts (id, title, slug, body, excerpt, featured_media_url, published, published_at, author_id)
-- VALUES ($1, $2, $3, $4, $5, $6, $7,
--   CASE WHEN $7 THEN CURRENT_TIMESTAMP ELSE NULL END, $8)
-- RETURNING id, title, slug, body, excerpt, featured_media_url AS "featuredMediaUrl",
--   published, published_at AS "publishedAt", created_at AS "createdAt", updated_at AS "updatedAt";

-- Public published posts
-- SELECT id, title, slug, body, excerpt, featured_media_url AS "featuredMediaUrl",
--   published_at AS "publishedAt", created_at AS "createdAt"
-- FROM posts WHERE published = TRUE ORDER BY published_at DESC;

-- Owner dashboard posts (includes drafts)
-- SELECT id, title, slug, excerpt, published, published_at AS "publishedAt",
--   created_at AS "createdAt", updated_at AS "updatedAt"
-- FROM posts ORDER BY created_at DESC;

-- Update a post
-- UPDATE posts SET title = $2, slug = $3, body = $4, excerpt = $5,
--   featured_media_url = $6, published = $7,
--   published_at = CASE WHEN $7 THEN COALESCE(published_at, CURRENT_TIMESTAMP) ELSE NULL END
-- WHERE id = $1
-- RETURNING id, title, slug, body, excerpt, featured_media_url AS "featuredMediaUrl",
--   published, published_at AS "publishedAt", updated_at AS "updatedAt";

-- Delete a post
-- DELETE FROM posts WHERE id = $1 RETURNING id;

COMMIT;

# Grimoire

Grimoire is a quiet, durable publishing space for people who write, read, and keep the links that shaped their thinking. It combines a long-form blog, a personal archive of bookmarks, and a focused writing environment without treating knowledge like a noisy productivity dashboard.

> **Project status:** self-hosted application under active development.

## Screenshots

![Landing page](docs/images/landing.png)
![Explore and search](docs/images/explore.png)
![Writing editor](docs/images/editor.png)
![Blog reading view](docs/images/reading.png)
![Profile](docs/images/profile.png)

## What it includes

- Public profiles and published long-form posts
- Private drafts and public/private bookmark visibility
- Focused editor with rich text, code blocks, syntax highlighting, mathematics, tables, images, links, tasks, and embeds
- Explore feed, search, tags, featured posts, RSS, and public user discovery
- Comments, authenticated likes, and authenticated comment votes
- Profile avatar/banner editing with image cropping
- GIF and bundled sticker support
- Account settings, email verification, password reset, optional 2FA, and optional Google OAuth configuration
- Light and dark themes with a persistent browser preference
- Database-backed media so uploaded images are included in database backups

## Architecture

    Browser
      └── Next.js / React frontend :3000
            └── Flask API / Gunicorn :5051
                  └── MariaDB 11 (Docker volume: mariadb_data)

### Stack

**Frontend:** Next.js 16.2.6, React 19.2.4, TypeScript 5, Tiptap, lowlight, DOMPurify, KaTeX, Tailwind/PostCSS.

**Backend:** Python 3.9, Flask 3, Gunicorn, PyJWT, bcrypt, Authlib, Flask-CORS, Flask-Limiter, Requests, BeautifulSoup/lxml, nh3.

**Database:** MariaDB 11 with UTF-8 `utf8mb4` tables.

**Deployment:** Docker Compose. The original frontend is the default service. An alternative local frontend can be run separately when available, but both frontends cannot use host port 3000 at the same time.

## Repository layout

    api/                 Flask API, blueprints, schemas, migrations
    frontend/             Main Next.js application
    ops/                  Backup/log rotation scripts and migration notes
    docker-compose.example.yml  Safe Compose template without live secrets
    PRODUCT.md            Product goals and design principles

## Design principles

Grimoire favors quiet interfaces, readable long-form content, progressive disclosure, durable data, privacy by default, and accessible contrast. The interface should recede so the writing and knowledge remain the focus.

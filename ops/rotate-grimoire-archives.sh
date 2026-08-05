#!/bin/sh
set -eu

ARCHIVE_ROOT="/opt/grimoire2/runtime/archives"
DAY="$(date -u +%F)"
DEST="$ARCHIVE_ROOT/$DAY"
mkdir -p "$DEST"

# The database dump includes media_assets.data, so profile and post images travel
# with the SQL dump. Credentials stay inside the database container environment.
docker exec grimoire-db sh -lc \
  'mariadb-dump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" --single-transaction --routines --events' \
  | gzip -c > "$DEST/database.sql.gz"

for container in grimoire-backend grimoire-frontend grimoire-frontend2; do
  docker logs --since=24h "$container" > "$DEST/$container.log" 2>&1 || true
done

# Keep exactly the recent three daily directories; older archives are recoverable
# from the database host’s normal backup system if one is configured.
find "$ARCHIVE_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +3 -exec rm -rf -- {} +

#!/usr/bin/env python3
"""One-off runner for migrate_comments_v3.sql (GIF/sticker columns).

Safety:
  * Takes a mysqldump backup of blog_comments + comment_votes first.
  * Idempotent — skips the ALTER if the columns already exist.
  * Verifies the comment row count is identical before and after.
  * Aborts on any mismatch.

Reads DB credentials from config/.env exactly like the app (never prints them).
"""
import os
import sys
import datetime

_here = os.path.dirname(os.path.abspath(__file__))
from dotenv import load_dotenv
load_dotenv(os.path.join(_here, 'config', '.env'))

import mysql.connector

DB = dict(
    host=os.environ.get('DB_HOST', 'localhost'),
    user=os.environ.get('DB_USER', 'linkvault'),
    password=os.environ.get('DB_PASS', ''),
    database=os.environ.get('DB_NAME', 'linkvault'),
    charset='utf8mb4',
)


def _sql_val(v):
    if v is None:
        return 'NULL'
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (datetime.datetime, datetime.date)):
        return "'" + str(v) + "'"
    s = str(v).replace('\\', '\\\\').replace("'", "\\'")
    return "'" + s + "'"


def _dump_table(cur, table, fh):
    """Write a restorable CREATE + INSERT dump for one table."""
    cur.execute(f'SHOW CREATE TABLE `{table}`')
    create = cur.fetchone()[1]
    fh.write(f'\n-- ---------- {table} ----------\n')
    fh.write(create + ';\n')
    cur.execute(f'SELECT * FROM `{table}`')
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    if rows:
        collist = ','.join(f'`{c}`' for c in cols)
        for r in rows:
            vals = ','.join(_sql_val(v) for v in r)
            fh.write(f'INSERT INTO `{table}` ({collist}) VALUES ({vals});\n')
    return len(rows)


def main():
    ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = os.path.join(_here, 'backups')
    os.makedirs(backup_dir, exist_ok=True)
    backup_path = os.path.join(backup_dir, f'blog_comments_{ts}.sql')

    conn = mysql.connector.connect(**DB)
    cur = conn.cursor()

    # 1. Backup (pure-Python dump via the same connector the app uses) ──────────
    with open(backup_path, 'w', encoding='utf-8') as fh:
        fh.write(f'-- Grimoire comment backup {ts}\n')
        fh.write('SET FOREIGN_KEY_CHECKS=0;\n')
        n1 = _dump_table(cur, 'blog_comments', fh)
        n2 = _dump_table(cur, 'comment_votes', fh)
        fh.write('SET FOREIGN_KEY_CHECKS=1;\n')
    size = os.path.getsize(backup_path)
    if size == 0:
        print('ABORT: backup is empty')
        sys.exit(1)
    print(f'[1/4] Backup written: {backup_path} ({size} bytes, '
          f'{n1} comments + {n2} votes)')

    # 2. Row count before ──────────────────────────────────────────────────────
    cur.execute('SELECT COUNT(*) FROM blog_comments')
    before = cur.fetchone()[0]
    print(f'[2/4] blog_comments rows before: {before}')

    # 3. Apply ALTER only if columns are missing (idempotent) ───────────────────
    cur.execute("""
        SELECT COLUMN_NAME FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA=%s AND TABLE_NAME='blog_comments'
          AND COLUMN_NAME IN ('media_url','media_type')
    """, (DB['database'],))
    existing = {r[0] for r in cur.fetchall()}
    if {'media_url', 'media_type'} <= existing:
        print('[3/4] Columns already present — nothing to do.')
    else:
        cur.execute("""
            ALTER TABLE blog_comments
              ADD COLUMN media_url  VARCHAR(512)           NULL AFTER content,
              ADD COLUMN media_type ENUM('gif','sticker')  NULL AFTER media_url
        """)
        conn.commit()
        print('[3/4] ALTER applied: added media_url, media_type.')

    # 4. Row count after — must be unchanged ────────────────────────────────────
    cur.execute('SELECT COUNT(*) FROM blog_comments')
    after = cur.fetchone()[0]
    cur.execute("""
        SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA=%s AND TABLE_NAME='blog_comments'
          AND COLUMN_NAME IN ('media_url','media_type')
    """, (DB['database'],))
    cols = cur.fetchall()
    cur.close()
    conn.close()

    print(f'[4/4] blog_comments rows after:  {after}')
    print('       new columns:', cols)
    if before != after:
        print(f'ABORT: row count changed ({before} -> {after}). Backup at {backup_path}')
        sys.exit(1)
    print('OK: migration complete, row count unchanged.')


if __name__ == '__main__':
    main()

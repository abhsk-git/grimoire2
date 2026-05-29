import os, smtplib, logging, datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

_APP_URL = lambda: os.environ.get('APP_URL', 'https://grimoire.sysnode.in')
_YEAR    = lambda: datetime.datetime.utcnow().year


def _smtp_send(to_email: str, subject: str, text: str, html: str) -> bool:
    host  = os.environ.get('SMTP_HOST', 'localhost')
    port  = int(os.environ.get('SMTP_PORT', 587))
    user  = os.environ.get('SMTP_USER', '')
    pw    = os.environ.get('SMTP_PASS', '')
    from_ = os.environ.get('SMTP_FROM', f'Grimoire <{user}>')
    if not user or not pw:
        logger.warning('SMTP not configured — email to %s skipped', to_email)
        return False
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From']    = from_
    msg['To']      = to_email
    msg.attach(MIMEText(text, 'plain'))
    msg.attach(MIMEText(html, 'html'))
    try:
        with smtplib.SMTP(host, port, timeout=10) as s:
            s.ehlo(); s.starttls(); s.login(user, pw)
            s.sendmail(from_, to_email, msg.as_string())
        return True
    except Exception:
        logger.exception('Failed to send email to %s', to_email)
        return False


def send_comment_notification(to_email: str, post_title: str, post_slug: str,
                               commenter_name: str, comment_preview: str) -> bool:
    app_url   = _APP_URL()
    post_url  = f'{app_url}/blog/{post_slug}'
    subject   = f'New comment on "{post_title}"'
    preview   = comment_preview[:200] + ('…' if len(comment_preview) > 200 else '')

    text = f"""Someone commented on your post "{post_title}".

{commenter_name} wrote:
"{preview}"

Read and reply: {post_url}

— The Grimoire Team
{app_url}
"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>{subject}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <tr><td style="background:#6366f1;height:4px;font-size:0;">&nbsp;</td></tr>
      <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:0.8px;">New Comment</p>
        <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#0f0f0f;">Someone commented on your post</h1>
        <p style="margin:0 0 8px;font-size:14px;color:#555;">Post: <strong>{post_title}</strong></p>
        <blockquote style="margin:16px 0;padding:14px 18px;background:#f8f8ff;border-left:3px solid #6366f1;border-radius:4px;font-size:14px;color:#333;font-style:italic;">
          <strong style="font-style:normal;">{commenter_name}</strong> wrote:<br>
          "{preview}"
        </blockquote>
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr><td style="background:#6366f1;border-radius:8px;">
            <a href="{post_url}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;">Read &amp; Reply &rarr;</a>
          </td></tr>
        </table>
        <p style="margin:0;font-size:12px;color:#999;">To stop these emails, turn off comment notifications in your <a href="{app_url}/settings" style="color:#6366f1;">settings</a>.</p>
      </td></tr>
      <tr><td style="padding:16px 40px;border-top:1px solid #f3f4f6;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; {_YEAR()} Grimoire &middot; <a href="{app_url}" style="color:#6366f1;text-decoration:none;">{app_url.replace('https://','')}</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""

    return _smtp_send(to_email, subject, text, html)


def send_reply_notification(to_email: str, post_title: str, post_slug: str,
                             replier_name: str, reply_preview: str) -> bool:
    app_url  = _APP_URL()
    post_url = f'{app_url}/blog/{post_slug}'
    subject  = f'New reply to your comment on "{post_title}"'
    preview  = reply_preview[:200] + ('…' if len(reply_preview) > 200 else '')

    text = f"""{replier_name} replied to your comment on "{post_title}".

"{preview}"

View the thread: {post_url}

— The Grimoire Team
{app_url}
"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>{subject}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <tr><td style="background:#6366f1;height:4px;font-size:0;">&nbsp;</td></tr>
      <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:0.8px;">New Reply</p>
        <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#0f0f0f;">Someone replied to your comment</h1>
        <p style="margin:0 0 8px;font-size:14px;color:#555;">On: <strong>{post_title}</strong></p>
        <blockquote style="margin:16px 0;padding:14px 18px;background:#f8f8ff;border-left:3px solid #6366f1;border-radius:4px;font-size:14px;color:#333;font-style:italic;">
          <strong style="font-style:normal;">{replier_name}</strong> replied:<br>
          "{preview}"
        </blockquote>
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr><td style="background:#6366f1;border-radius:8px;">
            <a href="{post_url}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;">View Thread &rarr;</a>
          </td></tr>
        </table>
        <p style="margin:0;font-size:12px;color:#999;">To stop these emails, turn off reply notifications in your <a href="{app_url}/settings" style="color:#6366f1;">settings</a>.</p>
      </td></tr>
      <tr><td style="padding:16px 40px;border-top:1px solid #f3f4f6;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; {_YEAR()} Grimoire &middot; <a href="{app_url}" style="color:#6366f1;text-decoration:none;">{app_url.replace('https://','')}</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""

    return _smtp_send(to_email, subject, text, html)


def send_weekly_digest(to_email: str, user_name: str, posts: list) -> bool:
    """Send a weekly digest of top posts. `posts` is a list of dicts with title/slug/author_name/views."""
    app_url = _APP_URL()
    subject = 'Your Grimoire weekly digest'

    post_lines_text = '\n'.join(
        f'• {p["title"]} by {p["author_name"]} — {p.get("views",0)} views\n  {app_url}/blog/{p["slug"]}'
        for p in posts
    )

    post_items_html = ''.join(f"""
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
            <a href="{app_url}/blog/{p['slug']}" style="font-size:15px;font-weight:600;color:#0f0f0f;text-decoration:none;">{p['title']}</a>
            <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">by {p['author_name']} &middot; {p.get('views',0)} views</p>
          </td>
        </tr>
    """ for p in posts)

    text = f"""Hi {user_name},

Here are this week's top posts on Grimoire:

{post_lines_text}

Explore more: {app_url}/explore

— The Grimoire Team
{app_url}
"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>{subject}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <tr><td style="background:#6366f1;height:4px;font-size:0;">&nbsp;</td></tr>
      <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:0.8px;">Weekly Digest</p>
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f0f0f;">This week on Grimoire</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#666;">Hi {user_name}, here are the top posts from the past week.</p>
        <table width="100%" cellpadding="0" cellspacing="0">{post_items_html}</table>
        <table cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
          <tr><td style="background:#6366f1;border-radius:8px;">
            <a href="{app_url}/explore" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;">Explore more &rarr;</a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:16px 40px;border-top:1px solid #f3f4f6;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; {_YEAR()} Grimoire &middot; <a href="{app_url}/settings" style="color:#6366f1;">Unsubscribe</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""

    return _smtp_send(to_email, subject, text, html)

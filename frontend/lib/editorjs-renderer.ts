// Converts EditorJS JSON → sanitized HTML for backward compat with old posts.

function sanitize(html: string): string {
  if (!html) return "";
  let s = html.replace(
    /<(?:script|style|iframe|object|embed)[\s>][\s\S]*?<\/(?:script|style|iframe|object|embed)>/gi,
    ""
  );
  s = s.replace(/<(?:script|style|iframe|object|embed)[^>]*\/>/gi, "");
  s = s.replace(/[\s/]+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");
  s = s.replace(/(?:href|src|action)\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, "");
  s = s.replace(/src\s*=\s*["']?\s*data:[^"'\s>]*/gi, "");
  return s;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function sanitizeHtml(html: string): string {
  return sanitize(html);
}

export function editorJsToHtml(contentJson: string): string {
  let data: { blocks?: { type: string; data: Record<string, unknown> }[] };
  try {
    data = JSON.parse(contentJson);
  } catch {
    return "<p>Content unavailable.</p>";
  }
  const parts: string[] = [];
  for (const b of data.blocks || []) {
    const bt: string = b.type || "";
    const bd = b.data as Record<string, unknown>;

    if (bt === "paragraph") {
      parts.push(`<p>${sanitize(String(bd.text || ""))}</p>`);
    } else if (bt === "header") {
      const lvl = Math.min(Math.max(parseInt(String(bd.level)) || 2, 1), 6);
      const text = sanitize(String(bd.text || ""));
      const anchor = String(bd.text || "")
        .replace(/<[^>]+>/g, "")
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[-\s]+/g, "-")
        .replace(/^-|-$/g, "");
      parts.push(`<h${lvl} id="${esc(anchor)}">${text}</h${lvl}>`);
    } else if (bt === "list") {
      const tag = bd.style === "ordered" ? "ol" : "ul";
      const items = ((bd.items as string[]) || [])
        .map((i) => `<li>${sanitize(i)}</li>`)
        .join("");
      parts.push(`<${tag}>${items}</${tag}>`);
    } else if (bt === "checklist") {
      const rows = ((bd.items as { checked: boolean; text: string }[]) || [])
        .map(
          (item) =>
            `<label class="cl-item"><input type="checkbox"${item.checked ? " checked" : ""
            } disabled><span>${sanitize(item.text || "")}</span></label>`
        )
        .join("");
      parts.push(`<div class="blog-checklist">${rows}</div>`);
    } else if (bt === "quote") {
      const cap = bd.caption
        ? `<cite>${sanitize(String(bd.caption))}</cite>`
        : "";
      const align = esc(String(bd.alignment || "left"));
      parts.push(
        `<blockquote style="text-align:${align}"><p>${sanitize(String(bd.text || ""))}</p>${cap}</blockquote>`
      );
    } else if (bt === "code") {
      const lang = esc(String(bd.language || ""));
      const code = escHtml(String(bd.code || ""));
      parts.push(`<pre><code class="language-${lang}">${code}</code></pre>`);
    } else if (bt === "image") {
      const file = bd.file as { url?: string } | undefined;
      const url = esc(String(file?.url || bd.url || ""));
      const cap = String(bd.caption || "");
      const cls = [
        bd.stretched ? "stretched" : "",
        bd.withBorder ? "bordered" : "",
        bd.withBackground ? "with-bg" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const capHtml = cap ? `<figcaption>${sanitize(cap)}</figcaption>` : "";
      parts.push(
        `<figure class="blog-figure ${cls}"><img src="${url}" alt="${esc(cap.replace(/<[^>]+>/g, ""))}" loading="lazy">${capHtml}</figure>`
      );
    } else if (bt === "embed") {
      const rawEmbed = String(bd.embed || "");
      const SAFE_EMBED_HOSTS = new Set([
        "www.youtube.com", "youtube.com", "www.youtube-nocookie.com",
        "player.vimeo.com", "vimeo.com", "twitter.com", "www.twitter.com",
        "www.instagram.com", "open.spotify.com", "soundcloud.com", "codepen.io",
      ]);
      let allowed = false;
      try {
        const u = new URL(rawEmbed);
        if ((u.protocol === "https:" || u.protocol === "http:") && SAFE_EMBED_HOSTS.has(u.hostname))
          allowed = true;
      } catch { /* invalid URL */ }
      if (!allowed) continue;
      const embed = esc(rawEmbed);
      const cap = String(bd.caption || "");
      const capHtml = cap ? `<figcaption>${sanitize(cap)}</figcaption>` : "";
      parts.push(
        `<figure class="blog-embed"><iframe src="${embed}" frameborder="0" allowfullscreen loading="lazy"></iframe>${capHtml}</figure>`
      );
    } else if (bt === "table") {
      let rowsHtml = "";
      ((bd.content as string[][]) || []).forEach((row, i) => {
        const tag = i === 0 ? "th" : "td";
        rowsHtml += "<tr>" + row.map((c) => `<${tag}>${sanitize(c)}</${tag}>`).join("") + "</tr>";
      });
      parts.push(`<div class="table-wrap"><table>${rowsHtml}</table></div>`);
    } else if (bt === "delimiter") {
      parts.push('<div class="blog-delimiter">✦ &nbsp; ✦ &nbsp; ✦</div>');
    } else if (bt === "warning") {
      parts.push(
        `<div class="blog-warning"><strong>${sanitize(String(bd.title || ""))}</strong><p>${sanitize(String(bd.message || ""))}</p></div>`
      );
    }
  }
  return parts.join("\n");
}

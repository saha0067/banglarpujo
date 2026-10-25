// Vercel Serverless Function: /p/<slug> -> social preview (OG tags) + redirect to the post
const SB_URL = "https://hhyaxcbjznyqqmdgumvr.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoeWF4Y2Jqem55cXFtZGd1bXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MjAyNzgsImV4cCI6MjEwODQ5NjI3OH0.DxQ5aMBQq_91XxXgGXDZjHjEKdQFNL6KQjUD1JOsW1U";
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = async (req, res) => {
  const slug = String((req.query && req.query.slug) || "");
  if (!/^[a-z0-9]{4,16}$/.test(slug)) { res.statusCode = 302; res.setHeader("Location", "/"); return res.end(); }
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const base = "https://" + host;
  let p = null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/posts?slug=eq.${slug}&approved=eq.true&select=slug,puja,year,district,caption,location,media,media_url,media_type&limit=1`,
      { headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY } });
    const d = await r.json();
    p = Array.isArray(d) && d[0];
  } catch (e) {}
  if (!p) { res.statusCode = 302; res.setHeader("Location", "/"); return res.end(); }

  const items = p.media && p.media.length ? p.media : [{ url: p.media_url, type: p.media_type }];
  const img = (items.find((m) => m.type !== "video") || {}).url || base + "/logo.jpg";
  const title = `${p.puja} ${p.year}${p.district ? " · " + p.district : ""} | বাংলার পুজো`;
  const desc = (p.caption || (p.location ? "📍 " + p.location : "") || "বাংলার সব পুজোর ছবি ও ভিডিও এক জায়গায়").slice(0, 200);
  const url = `${base}/p/${slug}`, go = `/?p=${slug}`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");
  res.end(`<!DOCTYPE html><html lang="bn"><head><meta charset="utf-8"><title>${esc(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="article"><meta property="og:site_name" content="বাংলার পুজো">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}"><meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:image" content="${esc(img)}">
<link rel="icon" href="/logo.jpg"><meta http-equiv="refresh" content="0;url=${go}"></head>
<body style="background:#14162e;color:#f3eee4;font-family:sans-serif;text-align:center;padding:40px"><p>লোড হচ্ছে...</p><a style="color:#f5a623" href="${go}">পোস্টটি দেখুন</a>
<script>location.replace(${JSON.stringify(go)})</script></body></html>`);
};

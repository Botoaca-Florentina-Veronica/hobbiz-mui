const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const path = require('path');

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getImageUrl(img, baseUrl) {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  const base = baseUrl.replace(/\/$/, '');
  if (img.startsWith('/uploads')) return `${base}${img}`;
  if (img.startsWith('uploads/')) return `${base}/${img}`;
  return `${base}/uploads/${img.replace(/^.*[\\/]/, '')}`;
}

function truncate(str, len) {
  const s = String(str || '');
  return s.length > len ? s.slice(0, len).trimEnd() + '…' : s;
}

router.get('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('user', 'firstName lastName avatar')
      .lean();

    if (!announcement) {
      return res.status(404).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Negăsit · Hobbiz</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><p style="color:#666">Anunțul nu a fost găsit.</p></body></html>`);
    }

    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const frontendUrl = (process.env.FRONTEND_URL || 'https://hobbiz-mui.netlify.app').replace(/\/$/, '');
    const shareUrl = `${baseUrl}/share/${announcement._id}`;
    const webUrl = `${frontendUrl}/announcement/${announcement._id}`;

    const imageUrl = getImageUrl(announcement.images?.[0], baseUrl);
    const allImages = (announcement.images || [])
      .map(img => getImageUrl(img, baseUrl))
      .filter(Boolean);

    const title = escapeHtml(announcement.title);
    const descriptionRaw = announcement.description || '';
    const descriptionShort = escapeHtml(truncate(descriptionRaw, 220));
    const location = escapeHtml(announcement.location || '');
    const category = escapeHtml(announcement.category || '');
    const sellerFirst = escapeHtml(announcement.user?.firstName || '');
    const sellerLast = escapeHtml(announcement.user?.lastName || '');
    const sellerName = (sellerFirst + ' ' + sellerLast).trim() || 'Utilizator';
    const sellerInitials = ((sellerFirst[0] || '') + (sellerLast[0] || '')).toUpperCase() || 'U';
    const sellerAvatar = getImageUrl(announcement.user?.avatar, baseUrl);

    const price = announcement.price != null
      ? new Intl.NumberFormat('ro-RO').format(announcement.price) + ' RON'
      : null;

    const createdAt = announcement.createdAt
      ? new Date(announcement.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })
      : '';

    // OG description: plain text, no HTML
    const ogDescription = truncate(descriptionRaw, 200);

    const extraImageTags = allImages.slice(1, 4)
      .map(u => `<meta property="og:image" content="${escapeHtml(u)}">`)
      .join('\n  ');

    const thumbnailSlides = allImages.length > 1
      ? allImages.slice(0, 6).map((u, i) => `
          <button class="thumb ${i === 0 ? 'active' : ''}" onclick="setImg(${i})" aria-label="Imagine ${i + 1}">
            <img src="${escapeHtml(u)}" alt="" loading="lazy">
          </button>`).join('')
      : '';

    const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>${title} · Hobbiz</title>

  <!-- Primary meta -->
  <meta name="description" content="${escapeHtml(ogDescription)}">
  <link rel="canonical" href="${escapeHtml(shareUrl)}">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Hobbiz">
  <meta property="og:locale" content="ro_RO">
  <meta property="og:url" content="${escapeHtml(shareUrl)}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  ${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${title}">` : ''}
  ${extraImageTags}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="${imageUrl ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
  ${imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">` : ''}

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --primary: #355070;
      --primary-light: #eef2f7;
      --text: #1f2937;
      --muted: #6b7280;
      --border: #e5e7eb;
      --bg: #f3f5f7;
      --surface: #ffffff;
      --radius: 18px;
      --radius-sm: 10px;
    }

    html, body {
      min-height: 100%;
      background: var(--bg);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: var(--text);
      -webkit-font-smoothing: antialiased;
    }

    /* ─── Page wrapper ─────────────────────────── */
    .page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 0 48px;
    }

    /* ─── Top bar ─────────────────────────────── */
    .topbar {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px 24px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: var(--primary);
    }
    .logo-mark {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-mark svg { display: block; }
    .logo-name {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: var(--primary);
    }

    /* ─── Card ────────────────────────────────── */
    .card {
      width: 100%;
      max-width: 520px;
      background: var(--surface);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
      margin: 28px 16px 0;
    }

    /* ─── Hero image ──────────────────────────── */
    .hero {
      position: relative;
      width: 100%;
      height: 260px;
      background: #e8ecf0;
      overflow: hidden;
    }
    .hero img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: opacity .3s;
    }
    .hero-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        rgba(0,0,0,0) 40%,
        rgba(0,0,0,0.55) 100%
      );
    }
    .hero-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #e8ecf0 0%, #d0d8e4 100%);
    }
    .hero-placeholder svg { opacity: 0.35; }

    /* Overlay badges on image */
    .hero-meta {
      position: absolute;
      bottom: 14px;
      left: 16px;
      right: 16px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 8px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 11px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    .badge-cat {
      background: rgba(53, 80, 112, 0.85);
      color: #fff;
    }
    .badge-loc {
      background: rgba(255,255,255,0.88);
      color: var(--text);
      max-width: 180px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ─── Thumbnails strip ────────────────────── */
    .thumbs {
      display: flex;
      gap: 6px;
      padding: 12px 16px 0;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .thumbs::-webkit-scrollbar { display: none; }
    .thumb {
      flex: 0 0 52px;
      height: 52px;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      border: 2px solid transparent;
      background: none;
      padding: 0;
      transition: border-color .15s, transform .15s;
    }
    .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .thumb.active { border-color: var(--primary); }
    .thumb:hover { transform: scale(1.05); }

    /* ─── Content ─────────────────────────────── */
    .content {
      padding: 20px 20px 24px;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      line-height: 1.25;
      color: var(--text);
      letter-spacing: -0.3px;
      margin-bottom: 10px;
    }
    .price {
      display: inline-block;
      font-size: 20px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 14px;
    }
    .description {
      font-size: 14px;
      line-height: 1.65;
      color: var(--muted);
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 20px;
    }

    /* ─── Divider ─────────────────────────────── */
    .divider {
      height: 1px;
      background: var(--border);
      margin: 0 0 20px;
    }

    /* ─── Seller ──────────────────────────────── */
    .seller {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
    }
    .avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      color: var(--primary);
      overflow: hidden;
      flex-shrink: 0;
    }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .seller-info { flex: 1; min-width: 0; }
    .seller-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .seller-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .posted-date {
      font-size: 12px;
      color: var(--muted);
      margin-top: 8px;
    }

    /* ─── CTA ─────────────────────────────────── */
    .cta-area {
      padding: 0 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 15px 20px;
      border-radius: var(--radius-sm);
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: opacity .15s, transform .1s;
      letter-spacing: 0.2px;
    }
    .btn:active { transform: scale(0.98); }
    .btn-primary {
      background: var(--primary);
      color: #fff;
      box-shadow: 0 4px 14px rgba(53,80,112,0.35);
    }
    .btn-primary:hover { opacity: 0.92; }
    .btn-outline {
      background: transparent;
      color: var(--primary);
      border: 1.5px solid var(--primary);
    }
    .btn-outline:hover { background: var(--primary-light); }

    /* ─── Footer ──────────────────────────────── */
    .footer {
      margin-top: 32px;
      text-align: center;
      color: var(--muted);
      font-size: 13px;
    }
    .footer a {
      color: var(--primary);
      font-weight: 600;
      text-decoration: none;
    }
    .footer a:hover { text-decoration: underline; }

    @media (max-width: 360px) {
      .card { margin: 20px 10px 0; }
      .hero { height: 220px; }
      .title { font-size: 19px; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Top bar -->
    <header class="topbar">
      <a href="${escapeHtml(frontendUrl)}" class="logo" rel="noopener">
        <div class="logo-mark">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2C5.13 2 2 5.13 2 9s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0 9.2a5.08 5.08 0 0 1-4.24-2.28C4.8 10.36 7.47 9.6 9 9.6c1.53 0 4.2.76 4.24 2.32A5.08 5.08 0 0 1 9 14.2z" fill="#fff"/>
          </svg>
        </div>
        <span class="logo-name">Hobbiz</span>
      </a>
    </header>

    <!-- Card -->
    <article class="card">

      <!-- Hero image -->
      <div class="hero" id="heroWrap">
        ${imageUrl
          ? `<img id="heroImg" src="${escapeHtml(imageUrl)}" alt="${title}" loading="eager">`
          : `<div class="hero-placeholder">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#355070" stroke-width="1.2">
                <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>`
        }
        <div class="hero-gradient"></div>
        <div class="hero-meta">
          ${category ? `<span class="badge badge-cat">${category}</span>` : '<span></span>'}
          ${location ? `<span class="badge badge-loc">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            ${location}
          </span>` : ''}
        </div>
      </div>

      <!-- Thumbnails (only if multiple images) -->
      ${allImages.length > 1 ? `<div class="thumbs">${thumbnailSlides}</div>` : ''}

      <!-- Content -->
      <div class="content">
        <h1 class="title">${title}</h1>
        ${price ? `<span class="price">${escapeHtml(price)}</span>` : ''}
        <p class="description">${descriptionShort}</p>
        <div class="divider"></div>
        <div class="seller">
          <div class="avatar">
            ${sellerAvatar
              ? `<img src="${escapeHtml(sellerAvatar)}" alt="${sellerName}" loading="lazy">`
              : sellerInitials
            }
          </div>
          <div class="seller-info">
            <div class="seller-label">Publicat de</div>
            <div class="seller-name">${sellerName}</div>
          </div>
        </div>
        ${createdAt ? `<div class="posted-date">${createdAt}</div>` : ''}
      </div>

      <!-- CTA buttons -->
      <div class="cta-area">
        <a href="${escapeHtml(webUrl)}" class="btn btn-primary" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10A15.3 15.3 0 0 1 8 12a15.3 15.3 0 0 1 4-10z"/>
          </svg>
          Vizualizează anunțul
        </a>
      </div>
    </article>

    <!-- Footer -->
    <footer class="footer">
      <p>Distribuit prin <a href="${escapeHtml(frontendUrl)}" rel="noopener">Hobbiz</a> · Descoperă hobby-uri în jurul tău</p>
    </footer>

  </div>

  ${allImages.length > 1 ? `
  <script>
    var imgs = ${JSON.stringify(allImages)};
    var current = 0;
    function setImg(i) {
      current = i;
      var hero = document.getElementById('heroImg');
      if (hero) { hero.src = imgs[i]; }
      document.querySelectorAll('.thumb').forEach(function(t, idx) {
        t.classList.toggle('active', idx === i);
      });
    }
  </script>` : ''}
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    res.send(html);
  } catch (err) {
    console.error('[shareRoutes] Error:', err.message);
    res.status(500).send('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:sans-serif;padding:40px">Eroare internă de server.</body></html>');
  }
});

module.exports = router;

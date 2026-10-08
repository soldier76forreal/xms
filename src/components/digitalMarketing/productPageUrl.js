// Small helpers shared by the product page editor, its gallery and its live preview.

export const slugify = (s) => String(s || '').trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// MA01, TR48 ... - the two letters and two digits that identify an inventory product.
export const normalizeCode = (s) => {
  const raw = String(s || '').trim().toUpperCase();
  const match = raw.match(/[A-Z]{2}\d{2}/);
  return match ? match[0] : raw;
};

const isLocalHost = (host) => host === 'localhost' || host === '127.0.0.1'
  || /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) || /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);

// Where the public website lives: its own origin online, the Next dev server (port 3000,
// or REACT_APP_WEBSITE_PORT) on a developer machine. REACT_APP_WEBSITE_URL overrides both.
export function websiteBase(axiosGlobal) {
  const forced = process.env.REACT_APP_WEBSITE_URL;
  if (forced) return String(forced).replace(/\/+$/, '');
  const host = window.location.hostname;
  if (isLocalHost(host)) return `http://${host}:${process.env.REACT_APP_WEBSITE_PORT || '3000'}`;
  return String((axiosGlobal && axiosGlobal.publicWebsiteUrl) || 'https://www.lazulitemarble.com').replace(/\/+$/, '');
}

// A gallery image url as stored -> something an <img> in XMS can load.
//   https://...        used as is
//   /uploads/...       XMS API files (what the gallery uploader stores)
//   /wp-content/...    WordPress files, served by the website itself
export function assetUrl(url, axiosGlobal) {
  const u = String(url || '').trim();
  if (!u) return '';
  if (/^(https?:)?\/\//i.test(u) || u.startsWith('data:') || u.startsWith('blob:')) return u;
  if (u.startsWith('/uploads/')) return String(axiosGlobal.defaultTargetApi || '') + u;
  return websiteBase(axiosGlobal) + (u.startsWith('/') ? u : '/' + u);
}

// The 480px thumbnail the uploader writes beside every image it stores. Other images
// (WordPress imports, pasted links) have none - the caller falls back to the image.
export function thumbPath(url) {
  const match = /^\/uploads\/(pc-[^/]+?)\.[A-Za-z0-9]+$/.exec(String(url || ''));
  return match ? `/uploads/thumb-${match[1]}.jpg` : '';
}

// The public product page for a record, optionally showing a preview token.
export function productPageUrl({ base, branchSlug = '', lang = 'en', slug, token = '', bust = 0 }) {
  const path = `${branchSlug ? branchSlug + '/' : ''}${lang === 'en' ? '' : lang + '/'}product/${encodeURIComponent(slug || 'preview')}/`;
  const query = [token ? `xms-preview=${token}` : '', bust ? `r=${bust}` : ''].filter(Boolean).join('&');
  return `${base}/${path}${query ? '?' + query : ''}`;
}

export const formatBytes = (n) => {
  const bytes = Number(n) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

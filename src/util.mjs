export function slugify(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/&/g, ' en ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'x';
}

export function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// JSON for inline <script> tags: prevent "</script>" breakouts.
export function jsonInline(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

export function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearest(origin, items, n, filter = () => true) {
  return items
    .filter((x) => x !== origin && filter(x))
    .map((x) => ({ item: x, km: distanceKm(origin, x) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, n);
}

export function formatKm(km, lang) {
  const v = km < 10 ? km.toFixed(1) : Math.round(km).toString();
  return (lang === 'en' ? v : v.replace('.', ',')) + ' km';
}

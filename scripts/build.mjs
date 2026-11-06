// Static site generator for FrituurFinder. No dependencies: plain Node 18+.
//
//   node scripts/build.mjs            build into dist/
//   FORCE_FETCH=1 node scripts/build.mjs   re-download OSM data first
import { readFile, writeFile, mkdir, rm, cp, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS, T } from '../src/i18n.mjs';
import { PROVINCES, townIdentity } from '../src/geo.mjs';
import { slugify, esc, jsonInline, nearest, formatKm } from '../src/util.mjs';
import { hoursLines, schemaOpeningHours } from '../src/hours.mjs';
import { DATA_FILE, fetchAndSave } from './fetch-osm.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist');

const SITE_URL = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  'http://localhost:3000'
).replace(/\/+$/, '');

const BRAND = 'FrituurFinder';

// ---------------------------------------------------------------- data
async function loadData() {
  const exists = await access(DATA_FILE).then(() => true, () => false);
  if (!exists || process.env.FORCE_FETCH) {
    try {
      await fetchAndSave();
    } catch (err) {
      if (!exists) throw new Error(`No data/frituren.json and OpenStreetMap download failed: ${err.message}`);
      console.warn('[build] fetch failed, using existing data/frituren.json');
    }
  }
  return JSON.parse(await readFile(DATA_FILE, 'utf8'));
}

function buildModel(shops) {
  const provinces = new Map(); // code -> {code, names, slugs, towns: Map}
  for (const code of Object.keys(PROVINCES)) {
    const names = PROVINCES[code];
    provinces.set(code, {
      code,
      names,
      slugs: Object.fromEntries(LANGS.map((l) => [l, slugify(names[l])])),
      towns: new Map(),
      shops: [],
    });
  }

  for (const s of shops) {
    const prov = provinces.get(s.province);
    if (!prov) continue;
    const id = townIdentity(s.city);
    let town = prov.towns.get(id.key);
    if (!town) {
      town = {
        key: id.key,
        names: id.names,
        slugs: Object.fromEntries(LANGS.map((l) => [l, slugify(id.names[l])])),
        province: prov,
        shops: [],
      };
      prov.towns.set(id.key, town);
    }
    s.town = town;
    town.shops.push(s);
    prov.shops.push(s);
  }

  const towns = [];
  for (const prov of provinces.values()) {
    for (const town of prov.towns.values()) {
      town.shops.sort((a, b) => a.name.localeCompare(b.name, 'nl'));
      town.lat = town.shops.reduce((a, s) => a + s.lat, 0) / town.shops.length;
      town.lon = town.shops.reduce((a, s) => a + s.lon, 0) / town.shops.length;
      // Unique shop slugs within a town.
      const used = new Set();
      for (const s of town.shops) {
        let slug = slugify(s.name);
        if (used.has(slug) && s.street) slug = `${slug}-${slugify(s.street)}`;
        let n = 2;
        const base = slug;
        while (used.has(slug)) slug = `${base}-${n++}`;
        used.add(slug);
        s.slug = slug;
      }
      towns.push(town);
    }
  }
  for (const prov of [...provinces.values()]) if (!prov.shops.length) provinces.delete(prov.code);
  return { provinces: [...provinces.values()], towns };
}

// ---------------------------------------------------------------- urls
const u = {
  home: (l) => `/${l}/`,
  province: (l, p) => `/${l}/${p.slugs[l]}/`,
  town: (l, t) => `/${l}/${t.province.slugs[l]}/${t.slugs[l]}/`,
  shop: (l, s) => `${u.town(l, s.town)}${s.slug}/`,
};
const abs = (p) => SITE_URL + p;

// ---------------------------------------------------------------- layout
function layout(lang, { title, description, urls, body, jsonLd = [], map = null, noindex = false, xDefault = null }) {
  const t = T[lang];
  const canonical = abs(urls[lang]);
  const alternates = LANGS.map(
    (l) => `<link rel="alternate" hreflang="${T[l].htmlLang}" href="${esc(abs(urls[l]))}">`,
  ).join('\n');
  const langSwitch = LANGS.map((l) =>
    l === lang
      ? `<span aria-current="true">${l.toUpperCase()}</span>`
      : `<a href="${esc(urls[l])}" hreflang="${T[l].htmlLang}" lang="${T[l].htmlLang}">${l.toUpperCase()}</a>`,
  ).join('');

  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="google-site-verification" content="tLi76mfyMGptNwBZQAOTs4t3eE1U_KP0OQ6VRB4h84I">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
${alternates}
<link rel="alternate" hreflang="x-default" href="${esc(abs(xDefault ?? urls.nl))}">
${noindex ? '<meta name="robots" content="noindex,follow">\n' : ''}<meta property="og:type" content="website">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:locale" content="${t.locale}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
${map ? '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="">' : ''}
${jsonLd.map((j) => `<script type="application/ld+json">${jsonInline(j)}</script>`).join('\n')}
</head>
<body>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="logo" href="${u.home(lang)}"><span class="logo-mark" aria-hidden="true">🍟</span>${BRAND}</a>
    <nav class="lang" aria-label="${esc(t.langSwitch)}">${langSwitch}</nav>
  </div>
</header>
<main class="wrap">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <p>${esc(t.footerAbout)}</p>
    <p class="muted">${esc(t.dataNote)}: © <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap contributors</a> (ODbL).</p>
  </div>
</footer>
${map ? mapScript(map) : ''}
</body>
</html>`;
}

function mapScript(map) {
  return `<script>window.__MAP__=${jsonInline(map)};</script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin="" defer></script>
<script src="/map.js" defer></script>`;
}

function breadcrumbs(lang, items) {
  const html = `<nav class="crumbs" aria-label="breadcrumb"><ol>${items
    .map((it, i) =>
      i === items.length - 1
        ? `<li aria-current="page">${esc(it.name)}</li>`
        : `<li><a href="${esc(it.url)}">${esc(it.name)}</a></li>`,
    )
    .join('')}</ol></nav>`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.url),
    })),
  };
  return { html, ld };
}

const addressLine = (s) =>
  [[s.street, s.housenumber].filter(Boolean).join(' '), [s.postcode, s.city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');

function shopCard(lang, s, extra = '') {
  const t = T[lang];
  const hours = hoursLines(s.openingHours, lang);
  return `<li class="card">
  <h3><a href="${esc(u.shop(lang, s))}">${esc(s.name)}</a></h3>
  <p class="addr">${esc(addressLine(s) || s.town.names[lang])}</p>
  ${hours.length ? `<p class="hours"><span class="label">${esc(t.hours)}:</span> ${hours.map(esc).join(' · ')}</p>` : ''}
  ${extra}
</li>`;
}

function townLinks(lang, towns, withCount = true) {
  return `<ul class="pills">${towns
    .map(
      (tw) =>
        `<li><a href="${esc(u.town(lang, tw))}">${esc(tw.names[lang])}${
          withCount ? ` <span class="count">${tw.shops.length}</span>` : ''
        }</a></li>`,
    )
    .join('')}</ul>`;
}

// Search index: every language's town name (Gent / Gand / Ghent) points to this language's page.
// The current language's name is added last so it wins on collisions.
function searchIndex(lang, towns) {
  const idx = {};
  for (const l of [...LANGS.filter((x) => x !== lang), lang]) {
    for (const tw of towns) idx[tw.names[l].toLowerCase()] = u.town(lang, tw);
  }
  return idx;
}

// ---------------------------------------------------------------- pages
function homePage(lang, model, totals) {
  const t = T[lang];
  const urls = Object.fromEntries(LANGS.map((l) => [l, u.home(l)]));
  const topTowns = [...model.towns].sort((a, b) => b.shops.length - a.shops.length).slice(0, 24);
  const provinces = [...model.provinces].sort((a, b) => a.names[lang].localeCompare(b.names[lang], lang));
  const townIndex = model.towns
    .map((tw) => [tw.names[lang], u.town(lang, tw)])
    .sort((a, b) => a[0].localeCompare(b[0], lang));

  const body = `
<section class="hero">
  <h1>${esc(t.homeH1)}</h1>
  <p class="lead">${esc(t.homeIntro(totals.shops, totals.towns))}</p>
  <form class="search" action="${u.home(lang)}" role="search" data-search>
    <label for="q">${esc(t.searchLabel)}</label>
    <div class="search-row">
      <input id="q" name="q" list="towns" placeholder="${esc(t.searchPlaceholder)}" autocomplete="off" required>
      <button type="submit">${esc(t.searchButton)}</button>
    </div>
    <datalist id="towns">${townIndex.map(([n]) => `<option value="${esc(n)}">`).join('')}</datalist>
  </form>
</section>
<section>
  <h2>${esc(t.byProvince)}</h2>
  <ul class="grid">${provinces
    .map(
      (p) =>
        `<li><a class="tile" href="${esc(u.province(lang, p))}"><strong>${esc(p.names[lang])}</strong><span>${esc(
          t.nShops(p.shops.length),
        )}</span></a></li>`,
    )
    .join('')}</ul>
</section>
<section>
  <h2>${esc(t.biggestTowns)}</h2>
  ${townLinks(lang, topTowns)}
</section>
<script>window.__TOWNS__=${jsonInline(searchIndex(lang, model.towns))};</script>
<script src="/search.js" defer></script>`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: BRAND,
      url: abs(u.home(lang)),
      inLanguage: t.htmlLang,
    },
  ];
  return {
    urls,
    html: layout(lang, { title: t.homeTitle, description: t.homeDesc(totals.shops, totals.towns), urls, body, jsonLd, xDefault: '/' }),
  };
}

function provincePage(lang, p) {
  const t = T[lang];
  const urls = Object.fromEntries(LANGS.map((l) => [l, u.province(l, p)]));
  const towns = [...p.towns.values()].sort((a, b) => a.names[lang].localeCompare(b.names[lang], lang));
  const name = p.names[lang];
  const crumbs = breadcrumbs(lang, [
    { name: t.home, url: u.home(lang) },
    { name, url: u.province(lang, p) },
  ]);
  const body = `
${crumbs.html}
<h1>${esc(t.provinceH1(name))}</h1>
<p class="lead">${esc(t.provinceIntro(name, p.shops.length, towns.length))}</p>
<section>
  <h2>${esc(t.townsInProvince(name))}</h2>
  ${townLinks(lang, towns)}
</section>`;
  return {
    urls,
    html: layout(lang, {
      title: t.provinceTitle(name, p.shops.length),
      description: t.provinceDesc(name, p.shops.length, towns.length),
      urls,
      body,
      jsonLd: [crumbs.ld],
    }),
  };
}

function townPage(lang, town, allTowns) {
  const t = T[lang];
  const urls = Object.fromEntries(LANGS.map((l) => [l, u.town(l, town)]));
  const name = town.names[lang];
  const pName = town.province.names[lang];
  const n = town.shops.length;
  const crumbs = breadcrumbs(lang, [
    { name: t.home, url: u.home(lang) },
    { name: pName, url: u.province(lang, town.province) },
    { name, url: u.town(lang, town) },
  ]);
  const nearby = nearest(town, allTowns, 8);
  const body = `
${crumbs.html}
<h1>${esc(t.townH1(name))}</h1>
<p class="lead">${esc(t.townIntro(name, n, pName))}</p>
<div id="map" class="map" role="img" aria-label="${esc(t.townH1(name))}"></div>
<ul class="cards">${town.shops.map((s) => shopCard(lang, s)).join('')}</ul>
<section>
  <h2>${esc(t.nearbyTowns)}</h2>
  <ul class="pills">${nearby
    .map(
      ({ item, km }) =>
        `<li><a href="${esc(u.town(lang, item))}">${esc(item.names[lang])} <span class="count">${esc(
          formatKm(km, lang),
        )}</span></a></li>`,
    )
    .join('')}</ul>
</section>`;
  const jsonLd = [
    crumbs.ld,
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: t.townH1(name),
      numberOfItems: n,
      itemListElement: town.shops.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: abs(u.shop(lang, s)),
        name: s.name,
      })),
    },
  ];
  const map = {
    center: [town.lat, town.lon],
    zoom: 13,
    markers: town.shops.map((s) => ({ lat: s.lat, lon: s.lon, name: s.name, url: u.shop(lang, s) })),
  };
  return {
    urls,
    html: layout(lang, { title: t.townTitle(name, n), description: t.townDesc(name, n), urls, body, jsonLd, map }),
  };
}

function shopPage(lang, s, allShops) {
  const t = T[lang];
  const urls = Object.fromEntries(LANGS.map((l) => [l, u.shop(l, s)]));
  const town = s.town;
  const tName = town.names[lang];
  const addr = addressLine(s);
  const crumbs = breadcrumbs(lang, [
    { name: t.home, url: u.home(lang) },
    { name: town.province.names[lang], url: u.province(lang, town.province) },
    { name: tName, url: u.town(lang, town) },
    { name: s.name, url: u.shop(lang, s) },
  ]);
  const hours = hoursLines(s.openingHours, lang);
  const facilities = ['takeaway', 'delivery', 'outdoorSeating', 'cards', 'vegetarian', 'wheelchair']
    .filter((k) => s[k] !== undefined && s[k] !== null)
    .map((k) => `<li class="${s[k] ? 'yes' : 'no'}">${s[k] ? '✓' : '✗'} ${esc(t[k])}</li>`);
  const website = s.website && /^https?:\/\//i.test(s.website) ? s.website : s.website ? `https://${s.website}` : null;
  const nearby = nearest(s, allShops, 6);

  const body = `
${crumbs.html}
<article class="shop">
  <h1>${esc(s.name)}</h1>
  <p class="lead">${esc(t.shopIntro(s.name, tName))}</p>
  <div class="shop-grid">
    <dl class="facts">
      <dt>${esc(t.address)}</dt>
      <dd>${addr ? esc(addr) : esc(tName)}<br><a href="https://www.google.com/maps/dir/?api=1&amp;destination=${s.lat},${s.lon}" rel="nofollow noopener">${esc(t.route)} →</a></dd>
      <dt>${esc(t.hours)}</dt>
      <dd>${hours.length ? hours.map(esc).join('<br>') : `<span class="muted">${esc(t.unknown)}</span>`}</dd>
      ${s.phone ? `<dt>${esc(t.phone)}</dt><dd><a href="tel:${esc(s.phone.replace(/[^\d+]/g, ''))}">${esc(s.phone)}</a></dd>` : ''}
      ${website ? `<dt>${esc(t.website)}</dt><dd><a href="${esc(website)}" rel="nofollow noopener">${esc(website.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''))}</a></dd>` : ''}
      ${facilities.length ? `<dt>${esc(t.facilities)}</dt><dd><ul class="facilities">${facilities.join('')}</ul></dd>` : ''}
    </dl>
    <div id="map" class="map map-small" role="img" aria-label="${esc(s.name)}"></div>
  </div>
  <p class="muted small"><a href="https://www.openstreetmap.org/${esc(s.id)}" rel="nofollow noopener">${esc(t.improve)}</a></p>
</article>
<section>
  <h2>${esc(t.nearbyShops)}</h2>
  <ul class="cards">${nearby
    .map(({ item, km }) => shopCard(lang, item, `<p class="dist">${esc(formatKm(km, lang))} ${esc(t.away)}</p>`))
    .join('')}</ul>
  <p><a href="${esc(u.town(lang, town))}">${esc(t.viewAll)} – ${esc(tName)} →</a></p>
</section>`;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FastFoodRestaurant',
    '@id': abs(u.shop(lang, s)) + '#restaurant',
    name: s.name,
    url: abs(u.shop(lang, s)),
    servesCuisine: ['Belgian', 'Fries'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: [s.street, s.housenumber].filter(Boolean).join(' ') || undefined,
      postalCode: s.postcode || undefined,
      addressLocality: s.city,
      addressRegion: town.province.names[lang],
      addressCountry: 'BE',
    },
    geo: { '@type': 'GeoCoordinates', latitude: s.lat, longitude: s.lon },
    telephone: s.phone || undefined,
    sameAs: [website, s.facebook].filter(Boolean),
    openingHours: schemaOpeningHours(s.openingHours),
  };
  if (!ld.sameAs.length) delete ld.sameAs;

  const map = { center: [s.lat, s.lon], zoom: 16, markers: [{ lat: s.lat, lon: s.lon, name: s.name }] };
  return {
    urls,
    html: layout(lang, {
      title: t.shopTitle(s.name, tName),
      description: t.shopDesc(s.name, tName, addr),
      urls,
      body,
      jsonLd: [crumbs.ld, ld],
      map,
    }),
  };
}

function rootPage(totals) {
  // x-default landing page: links to the three language homes.
  const urls = Object.fromEntries(LANGS.map((l) => [l, u.home(l)]));
  return `<!doctype html>
<html lang="nl-BE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="google-site-verification" content="tLi76mfyMGptNwBZQAOTs4t3eE1U_KP0OQ6VRB4h84I">
<title>FrituurFinder – Frituren in België · Friteries en Belgique · Belgian fries shops</title>
<meta name="description" content="${esc(`${totals.shops} frituren in België · ${totals.shops} friteries en Belgique · ${totals.shops} Belgian fries shops.`)}">
<link rel="canonical" href="${abs('/')}">
${LANGS.map((l) => `<link rel="alternate" hreflang="${T[l].htmlLang}" href="${abs(urls[l])}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${abs('/')}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
</head>
<body class="root">
<main class="wrap root-main">
  <p class="logo big"><span class="logo-mark" aria-hidden="true">🍟</span>${BRAND}</p>
  <h1 class="sr-only">FrituurFinder</h1>
  <ul class="grid lang-grid">
    ${LANGS.map((l) => `<li><a class="tile" href="${urls[l]}" hreflang="${T[l].htmlLang}" lang="${T[l].htmlLang}"><strong>${esc(T[l].langName)}</strong><span>${esc(T[l].tagline)}</span></a></li>`).join('\n    ')}
  </ul>
</main>
</body>
</html>`;
}

function notFoundPage() {
  const body = LANGS.map(
    (l) => `<section lang="${T[l].htmlLang}"><h2>${esc(T[l].notFoundTitle)}</h2><p>${esc(T[l].notFoundText)}</p><p><a href="${u.home(l)}">${esc(T[l].home)} →</a></p></section>`,
  ).join('');
  return `<!doctype html><html lang="nl-BE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>404 – FrituurFinder</title><meta name="robots" content="noindex"><link rel="stylesheet" href="/styles.css"><link rel="icon" href="/favicon.svg" type="image/svg+xml"></head><body><main class="wrap"><h1>404</h1>${body}</main></body></html>`;
}

// ---------------------------------------------------------------- write
async function writePage(urlPath, html) {
  const file = path.join(OUT, urlPath, 'index.html');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
}

async function main() {
  const t0 = Date.now();
  const data = await loadData();
  const shops = data.shops.map((s) => ({ ...s }));
  const model = buildModel(shops);
  const placed = shops.filter((s) => s.town);
  const totals = { shops: placed.length, towns: model.towns.length };
  const lastmod = (data.fetchedAt || new Date().toISOString()).slice(0, 10);

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await cp(path.join(ROOT, 'static'), OUT, { recursive: true });

  const sitemap = []; // each entry: urls {nl,fr,en}
  const emit = async (page) => {
    sitemap.push(page.urls);
  };

  for (const lang of LANGS) {
    const home = homePage(lang, model, totals);
    await writePage(home.urls[lang], home.html);
    if (lang === 'nl') await emit(home);

    for (const p of model.provinces) {
      const page = provincePage(lang, p);
      await writePage(page.urls[lang], page.html);
      if (lang === 'nl') await emit(page);
    }
    for (const town of model.towns) {
      const page = townPage(lang, town, model.towns);
      await writePage(page.urls[lang], page.html);
      if (lang === 'nl') await emit(page);
    }
    for (const s of placed) {
      const page = shopPage(lang, s, placed);
      await writePage(page.urls[lang], page.html);
      if (lang === 'nl') await emit(page);
    }
  }

  await writeFile(path.join(OUT, 'index.html'), rootPage(totals));
  await writeFile(path.join(OUT, '404.html'), notFoundPage());

  // Sitemap with hreflang alternates for every language version.
  const entries = [`<url><loc>${esc(abs('/'))}</loc><lastmod>${lastmod}</lastmod></url>`];
  for (const urls of sitemap) {
    const alts = LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${T[l].htmlLang}" href="${esc(abs(urls[l]))}"/>`).join('');
    for (const l of LANGS) entries.push(`<url><loc>${esc(abs(urls[l]))}</loc><lastmod>${lastmod}</lastmod>${alts}</url>`);
  }
  await writeFile(
    path.join(OUT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`,
  );
  await writeFile(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

  console.log(
    `[build] ${totals.shops} frituren, ${totals.towns} towns, ${model.provinces.length} provinces → ${entries.length} pages in ${((Date.now() - t0) / 1000).toFixed(1)}s (site: ${SITE_URL})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

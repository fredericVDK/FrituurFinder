// Downloads every frituur in Belgium from OpenStreetMap (Overpass API) and
// writes a cleaned dataset to data/frituren.json.
//
//   node scripts/fetch-osm.mjs
//
// The build script calls this automatically when data/frituren.json is missing.
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { cleanCityName, provinceFromPostcode, townIdentity } from '../src/geo.mjs';
import { distanceKm } from '../src/util.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATA_FILE = path.join(ROOT, 'data', 'frituren.json');

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const QUERY = `
[out:json][timeout:180];
area["ISO3166-1"="BE"][admin_level=2]->.be;
(
  nwr["cuisine"~"friture|fries|french_fries|chips",i](area.be);
  nwr["amenity"~"^(fast_food|restaurant)$"]["name"~"frituur|friture|friterie|frietkot|fritkot|frietshop|frietjes|frietuur|frit'",i](area.be);
)->.f;
.f out center tags;
node["place"~"^(city|town|village)$"](area.be);
out body;
`;

async function overpass() {
  let lastErr;
  for (const url of ENDPOINTS) {
    try {
      console.log(`[fetch-osm] querying ${url}`);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'FrituurFinder/1.0 (static site build)',
        },
        body: 'data=' + encodeURIComponent(QUERY),
        signal: AbortSignal.timeout(240_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!Array.isArray(json.elements)) throw new Error('no elements in response');
      return json.elements;
    } catch (err) {
      console.warn(`[fetch-osm] ${url} failed: ${err.message}`);
      lastErr = err;
    }
  }
  throw lastErr;
}

const yes = (v) => (v === 'yes' || v === 'only' ? true : v === 'no' ? false : undefined);

export function normalize(elements) {
  const places = elements
    .filter((e) => e.type === 'node' && e.tags?.place && e.tags?.name)
    .map((e) => ({ name: e.tags['name:nl'] || e.tags.name, lat: e.lat, lon: e.lon, place: e.tags.place }));

  const seen = new Set();
  const shops = [];
  for (const e of elements) {
    const t = e.tags ?? {};
    if (t.place) continue;
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    if (!t.name || lat == null || lon == null) continue; // unnamed = thin page, skip
    if (t.disused || t['disused:amenity'] || t.shop === 'vacant') continue;
    const id = `${e.type}/${e.id}`;
    if (seen.has(id)) continue;
    seen.add(id);

    let city = cleanCityName(t['addr:city'] || t['addr:municipality']);
    if (!city) {
      // Fall back to the nearest city/town/village node.
      let best = null;
      for (const p of places) {
        const d = distanceKm({ lat, lon }, p);
        // Cities "pull" from further away than villages.
        const w = d / (p.place === 'city' ? 2.5 : p.place === 'town' ? 1.5 : 1);
        if (!best || w < best.w) best = { w, p };
      }
      city = best?.p.name ?? null;
    }
    if (!city) continue;

    shops.push({
      id,
      name: t.name.trim(),
      lat: +lat.toFixed(6),
      lon: +lon.toFixed(6),
      street: t['addr:street'] || null,
      housenumber: t['addr:housenumber'] || null,
      postcode: t['addr:postcode'] || null,
      city,
      province: provinceFromPostcode(t['addr:postcode']),
      phone: t.phone || t['contact:phone'] || null,
      website: t.website || t['contact:website'] || null,
      facebook: t['contact:facebook'] || null,
      openingHours: t.opening_hours || null,
      takeaway: yes(t.takeaway),
      delivery: yes(t.delivery),
      outdoorSeating: yes(t.outdoor_seating),
      wheelchair: yes(t.wheelchair),
      cards: yes(t['payment:cards'] ?? t['payment:debit_cards']),
      vegetarian: yes(t['diet:vegetarian']),
    });
  }

  // Fill missing provinces: same town first, then nearest shop with a province.
  const byTown = new Map();
  for (const s of shops) {
    const k = townIdentity(s.city).key;
    if (s.province && !byTown.has(k)) byTown.set(k, s.province);
  }
  const known = shops.filter((s) => s.province);
  for (const s of shops) {
    if (s.province) continue;
    s.province = byTown.get(townIdentity(s.city).key) ?? null;
    if (!s.province && known.length) {
      // Majority vote of the 5 nearest shops that do have a postcode.
      const votes = {};
      known
        .map((k) => ({ k, d: distanceKm(s, k) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 5)
        .forEach(({ k, d }) => (votes[k.province] = (votes[k.province] ?? 0) + 1 / (1 + d) ** 2));
      s.province = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
    }
  }

  return shops.filter((s) => s.province).sort((a, b) => a.id.localeCompare(b.id));
}

export async function fetchAndSave() {
  const elements = await overpass();
  const shops = normalize(elements);
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(
    DATA_FILE,
    JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'OpenStreetMap', shops }, null, 1),
  );
  console.log(`[fetch-osm] saved ${shops.length} frituren to data/frituren.json`);
  return shops;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fetchAndSave().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

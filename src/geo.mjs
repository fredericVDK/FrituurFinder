// Belgian provinces (plus Brussels-Capital Region), with names per language.
export const PROVINCES = {
  bru: { nl: 'Brussel', fr: 'Bruxelles', en: 'Brussels' },
  wbr: { nl: 'Waals-Brabant', fr: 'Brabant wallon', en: 'Walloon Brabant' },
  vbr: { nl: 'Vlaams-Brabant', fr: 'Brabant flamand', en: 'Flemish Brabant' },
  ant: { nl: 'Antwerpen', fr: 'Anvers', en: 'Antwerp' },
  lim: { nl: 'Limburg', fr: 'Limbourg', en: 'Limburg' },
  lie: { nl: 'Luik', fr: 'Liège', en: 'Liège' },
  nam: { nl: 'Namen', fr: 'Namur', en: 'Namur' },
  hai: { nl: 'Henegouwen', fr: 'Hainaut', en: 'Hainaut' },
  lux: { nl: 'Luxemburg', fr: 'Luxembourg', en: 'Luxembourg' },
  wvl: { nl: 'West-Vlaanderen', fr: 'Flandre-Occidentale', en: 'West Flanders' },
  ovl: { nl: 'Oost-Vlaanderen', fr: 'Flandre-Orientale', en: 'East Flanders' },
};

// Belgian postcodes map deterministically onto provinces.
export function provinceFromPostcode(pc) {
  const n = parseInt(String(pc ?? '').replace(/\D/g, '').slice(0, 4), 10);
  if (!n || n < 1000 || n > 9999) return null;
  if (n < 1300) return 'bru';
  if (n < 1500) return 'wbr';
  if (n < 2000) return 'vbr';
  if (n < 3000) return 'ant';
  if (n < 3500) return 'vbr';
  if (n < 4000) return 'lim';
  if (n < 5000) return 'lie';
  if (n < 6000) return 'nam';
  if (n < 6600) return 'hai';
  if (n < 7000) return 'lux';
  if (n < 8000) return 'hai';
  if (n < 9000) return 'wvl';
  return 'ovl';
}

// Bilingual / exonym town names. Key = canonical slug; every variant maps to it.
const TOWN_NAMES = [
  { nl: 'Brussel', fr: 'Bruxelles', en: 'Brussels', alt: ['Brussel-Stad', 'Bruxelles-Ville', 'City of Brussels'] },
  { nl: 'Antwerpen', fr: 'Anvers', en: 'Antwerp' },
  { nl: 'Gent', fr: 'Gand', en: 'Ghent' },
  { nl: 'Luik', fr: 'Liège', en: 'Liège', alt: ['Liege'] },
  { nl: 'Bergen', fr: 'Mons', en: 'Mons' },
  { nl: 'Namen', fr: 'Namur', en: 'Namur' },
  { nl: 'Leuven', fr: 'Louvain', en: 'Leuven' },
  { nl: 'Mechelen', fr: 'Malines', en: 'Mechelen' },
  { nl: 'Kortrijk', fr: 'Courtrai', en: 'Kortrijk' },
  { nl: 'Doornik', fr: 'Tournai', en: 'Tournai' },
  { nl: 'Ieper', fr: 'Ypres', en: 'Ypres' },
  { nl: 'Brugge', fr: 'Bruges', en: 'Bruges' },
  { nl: 'Oostende', fr: 'Ostende', en: 'Ostend' },
  { nl: 'Aalst', fr: 'Alost', en: 'Aalst' },
  { nl: 'Hasselt', fr: 'Hasselt', en: 'Hasselt' },
  { nl: 'Tongeren', fr: 'Tongres', en: 'Tongeren' },
  { nl: 'Sint-Truiden', fr: 'Saint-Trond', en: 'Sint-Truiden' },
  { nl: 'Halle', fr: 'Hal', en: 'Halle' },
  { nl: 'Vilvoorde', fr: 'Vilvorde', en: 'Vilvoorde' },
  { nl: 'Dendermonde', fr: 'Termonde', en: 'Dendermonde' },
  { nl: 'Oudenaarde', fr: 'Audenarde', en: 'Oudenaarde' },
  { nl: 'Ronse', fr: 'Renaix', en: 'Ronse' },
  { nl: 'Geraardsbergen', fr: 'Grammont', en: 'Geraardsbergen' },
  { nl: 'Moeskroen', fr: 'Mouscron', en: 'Mouscron' },
  { nl: 'Komen-Waasten', fr: 'Comines-Warneton', en: 'Comines-Warneton' },
  { nl: 'Aat', fr: 'Ath', en: 'Ath' },
  { nl: 'Zinnik', fr: 'Soignies', en: 'Soignies' },
  { nl: 'Edingen', fr: 'Enghien', en: 'Enghien' },
  { nl: 'Waver', fr: 'Wavre', en: 'Wavre' },
  { nl: 'Nijvel', fr: 'Nivelles', en: 'Nivelles' },
  { nl: 'Geldenaken', fr: 'Jodoigne', en: 'Jodoigne' },
  { nl: 'Hoei', fr: 'Huy', en: 'Huy' },
  { nl: 'Borgworm', fr: 'Waremme', en: 'Waremme' },
  { nl: 'Verviers', fr: 'Verviers', en: 'Verviers' },
  { nl: 'Aarlen', fr: 'Arlon', en: 'Arlon' },
  { nl: 'Bastenaken', fr: 'Bastogne', en: 'Bastogne' },
  { nl: 'Elsene', fr: 'Ixelles', en: 'Ixelles' },
  { nl: 'Sint-Gillis', fr: 'Saint-Gilles', en: 'Saint-Gilles' },
  { nl: 'Schaarbeek', fr: 'Schaerbeek', en: 'Schaerbeek' },
  { nl: 'Sint-Jans-Molenbeek', fr: 'Molenbeek-Saint-Jean', en: 'Molenbeek', alt: ['Molenbeek'] },
  { nl: 'Ukkel', fr: 'Uccle', en: 'Uccle' },
  { nl: 'Vorst', fr: 'Forest', en: 'Forest' },
  { nl: 'Oudergem', fr: 'Auderghem', en: 'Auderghem' },
  { nl: 'Watermaal-Bosvoorde', fr: 'Watermael-Boitsfort', en: 'Watermael-Boitsfort' },
  { nl: 'Sint-Lambrechts-Woluwe', fr: 'Woluwe-Saint-Lambert', en: 'Woluwe-Saint-Lambert' },
  { nl: 'Sint-Pieters-Woluwe', fr: 'Woluwe-Saint-Pierre', en: 'Woluwe-Saint-Pierre' },
  { nl: 'Sint-Joost-ten-Node', fr: 'Saint-Josse-ten-Noode', en: 'Saint-Josse-ten-Noode' },
  { nl: 'Sint-Agatha-Berchem', fr: 'Berchem-Sainte-Agathe', en: 'Berchem-Sainte-Agathe' },
];

const norm = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

const ALIAS = new Map();
for (const t of TOWN_NAMES) {
  for (const v of [t.nl, t.fr, t.en, ...(t.alt ?? [])]) ALIAS.set(norm(v), t);
}

// Clean "Bruxelles - Brussel", "Gent (Sint-Amandsberg)" etc. into one name.
export function cleanCityName(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  const parts = s.split(/\s+[-–\/]\s+|\s*\/\s*/);
  for (const p of parts) if (ALIAS.has(norm(p))) return p.trim();
  s = parts[0].replace(/\s*\(.*\)\s*$/, '').trim();
  return s || null;
}

// Returns { key, names: {nl, fr, en} }
export function townIdentity(name) {
  const known = ALIAS.get(norm(name));
  if (known) return { key: norm(known.nl), names: { nl: known.nl, fr: known.fr, en: known.en } };
  return { key: norm(name), names: { nl: name, fr: name, en: name } };
}

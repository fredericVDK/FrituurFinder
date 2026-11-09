// Helpers for OSM opening_hours strings.
const DAYS = {
  nl: { Mo: 'ma', Tu: 'di', We: 'wo', Th: 'do', Fr: 'vr', Sa: 'za', Su: 'zo', PH: 'feestdagen', off: 'gesloten', closed: 'gesloten' },
  fr: { Mo: 'lun', Tu: 'mar', We: 'mer', Th: 'jeu', Fr: 'ven', Sa: 'sam', Su: 'dim', PH: 'jours fériés', off: 'fermé', closed: 'fermé' },
  en: { Mo: 'Mon', Tu: 'Tue', We: 'Wed', Th: 'Thu', Fr: 'Fri', Sa: 'Sat', Su: 'Sun', PH: 'public holidays', off: 'closed', closed: 'closed' },
};
const ORDER = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const DAY_NAMES = {
  nl: ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'],
  fr: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};
const CLOSED = { nl: 'gesloten', fr: 'fermé', en: 'closed' };

// Raw, human-readable lines (fallback when the string can't be parsed).
export function hoursLines(oh, lang) {
  if (!oh) return [];
  const map = DAYS[lang];
  return oh
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) =>
      part
        .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH|off|closed)\b/g, (m) => map[m] ?? m)
        .replace(/,(?=[\dA-Za-z])/g, ', ')
        .replace(/24\/7/, lang === 'nl' ? 'dag en nacht open' : lang === 'fr' ? 'ouvert 24h/24' : 'open 24/7'),
    );
}

// ------------------------------------------------------------------ parser
// Returns a week: array of 7 (Mon..Sun) lists of [startMin, endMin] or null
// when the string uses syntax we don't support. endMin may exceed 1440 when
// a slot runs past midnight (e.g. 12:00-02:00 → [720, 1560]).
const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

function parseDays(sel) {
  const days = new Set();
  for (const part of sel.split(',')) {
    if (part === 'PH') continue; // public holidays: ignored
    const m = part.match(/^(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?$/);
    if (!m) return null;
    const a = ORDER.indexOf(m[1]);
    const b = m[2] ? ORDER.indexOf(m[2]) : a;
    for (let i = a; ; i = (i + 1) % 7) {
      days.add(i);
      if (i === b) break;
    }
  }
  return days;
}

function parseTimes(str) {
  if (/^(off|closed)$/.test(str)) return [];
  const out = [];
  for (const span of str.split(',')) {
    const m = span.match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
    if (!m) return null;
    const s = toMin(m[1]);
    let e = toMin(m[2]);
    if (e <= s) e += 1440;
    if (s >= 1440 || e > 2880) return null;
    out.push([s, e]);
  }
  return out;
}

export function parseHours(oh) {
  if (!oh) return null;
  const src = oh.trim();
  if (src === '24/7') return Array.from({ length: 7 }, () => [[0, 1440]]);
  if (src.includes('||') || /"/.test(src)) return null;
  const week = Array.from({ length: 7 }, () => []);
  let any = false;
  for (let rule of src.split(';')) {
    rule = rule.trim().replace(/\s*,\s*/g, ',').replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ');
    if (!rule) continue;
    const m = rule.match(/^(?:([A-Za-z,-]+) )?(.+)$/);
    if (!m) return null;
    let [, sel, times] = m;
    if (!sel && /^[A-Z][a-z]([-,][A-Z][a-z])*$/.test(times)) return null; // days without times
    if (sel && /^(PH)$/.test(sel)) continue;
    const days = sel ? parseDays(sel) : new Set([0, 1, 2, 3, 4, 5, 6]);
    if (!days) return null;
    const slots = parseTimes(times);
    if (!slots) return null;
    for (const d of days) week[d] = slots.map((x) => [...x]);
    any = true;
  }
  return any ? week : null;
}

const hhmm = (min) => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

export function formatSlots(slots, lang) {
  if (!slots || !slots.length) return CLOSED[lang];
  return slots.map(([s, e]) => `${hhmm(s)}–${e === 1440 ? '24:00' : hhmm(e)}`).join(', ');
}

// Compact summary of open days, e.g. "ma–vr 11:30–14:00, 17:00–22:00 · za–zo 17:00–23:00"
export function hoursSummary(week, lang) {
  if (!week) return null;
  const short = ORDER.map((d) => DAYS[lang][d]);
  const groups = [];
  for (let i = 0; i < 7; i++) {
    const key = JSON.stringify(week[i]);
    const last = groups[groups.length - 1];
    if (last && last.key === key && last.to === i - 1) last.to = i;
    else groups.push({ key, from: i, to: i, slots: week[i] });
  }
  const open = groups.filter((g) => g.slots.length);
  if (!open.length) return null;
  return open
    .map((g) => {
      const days = g.from === g.to ? short[g.from] : `${short[g.from]}–${short[g.to]}`;
      return `${days} ${formatSlots(g.slots, lang)}`;
    })
    .join(' · ');
}

// schema.org openingHours only accepts the simple "Mo-Fr 10:00-19:00" form.
const SIMPLE = /^(Mo|Tu|We|Th|Fr|Sa|Su)(-(Mo|Tu|We|Th|Fr|Sa|Su))?(,(Mo|Tu|We|Th|Fr|Sa|Su)(-(Mo|Tu|We|Th|Fr|Sa|Su))?)* \d\d:\d\d-\d\d:\d\d(,\d\d:\d\d-\d\d:\d\d)*$/;

export function schemaOpeningHours(oh) {
  if (!oh) return undefined;
  const out = [];
  for (const raw of oh.split(';').map((s) => s.trim()).filter(Boolean)) {
    if (!SIMPLE.test(raw)) return undefined; // anything complex: leave it out rather than emit wrong data
    const [days, times] = raw.split(' ');
    for (const t of times.split(',')) out.push(`${days} ${t}`);
  }
  return out.length ? out : undefined;
}

// Structured alternative, built from the parsed week.
export function schemaOpeningSpecs(week) {
  if (!week) return undefined;
  const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const specs = [];
  week.forEach((slots, d) => {
    for (const [s, e] of slots) {
      specs.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: names[d], opens: hhmm(s), closes: hhmm(e) });
    }
  });
  return specs.length ? specs : undefined;
}

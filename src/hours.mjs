// Helpers for OSM opening_hours strings.
const DAYS = {
  nl: { Mo: 'ma', Tu: 'di', We: 'wo', Th: 'do', Fr: 'vr', Sa: 'za', Su: 'zo', PH: 'feestdagen', off: 'gesloten', closed: 'gesloten' },
  fr: { Mo: 'lu', Tu: 'ma', We: 'me', Th: 'je', Fr: 've', Sa: 'sa', Su: 'di', PH: 'jours fériés', off: 'fermé', closed: 'fermé' },
  en: { Mo: 'Mon', Tu: 'Tue', We: 'Wed', Th: 'Thu', Fr: 'Fri', Sa: 'Sat', Su: 'Sun', PH: 'public holidays', off: 'closed', closed: 'closed' },
};

// Human-readable lines, e.g. ["ma-vr 11:30-14:00, 17:00-22:00", "za-zo 17:00-22:00"]
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

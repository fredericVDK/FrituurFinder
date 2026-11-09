// Texts for the richer shop/town pages (snippets, FAQ, same-town block).
// Merged into T in i18n.mjs; keys here override the older ones there.
const list = (items, and) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;

const cut = (str, max = 160) => {
  const s = str.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const c = s.slice(0, max - 1);
  return c.slice(0, c.lastIndexOf(' ')).replace(/[,;:·–-]$/, '') + '…';
};

export const X = {
  nl: {
    // "Frituur Chris in Veerle – openingsuren & adres"
    shopTitle: (s, t, hasTown) => `${s}${hasTown ? '' : ` in ${t}`} – openingsuren & adres | FrituurFinder`,
    shopDesc: ({ name, addr, summary, phone }) =>
      cut(`${name}, ${addr}. ${summary ? `Open ${summary}.` : ''} ${phone ? `Tel. ${phone}.` : ''} Route en frituren in de buurt.`),
    townDesc: (t, n, names, first) =>
      n === 1
        ? cut(`Frituur in ${t}: ${first.name}${first.street ? ` (${first.street})` : ''}. ${first.summary ? `Open ${first.summary}.` : ''} Adres, openingsuren en telefoon.`)
        : cut(`${n} frituren in ${t}, o.a. ${list(names, 'en')}. Bekijk adressen, openingsuren en wie er nu open is.`),
    hoursWeek: 'Openingsuren',
    hoursNote: 'Volgens OpenStreetMap. Op feestdagen kan het anders zijn.',
    sameTown: (t) => `Andere frituren in ${t}`,
    faqTitle: (s) => `Veelgestelde vragen over ${s}`,
    faq: {
      hoursQ: (s) => `Wat zijn de openingsuren van ${s}?`,
      hoursA: (s, sum) => `${s} is open op ${sum}.`,
      hoursUnknownA: (s, phone) =>
        `De openingsuren van ${s} zijn (nog) niet gekend.${phone ? ` Bel best even op voorhand: ${phone}.` : ''}`,
      dayQ: (s, day) => `Is ${s} open op ${day}?`,
      dayYes: (s, day, slots) => `Ja, op ${day} is ${s} open van ${slots}.`,
      dayNo: (s, day) => `Nee, op ${day} is ${s} gesloten.`,
      whereQ: (s) => `Waar ligt ${s}?`,
      whereA: (s, addr, t, p) => `${s} ligt ${addr ? `op ${addr}, ` : ''}in ${t} (${p}).`,
      cardsQ: (s) => `Kan ik bij ${s} met de kaart betalen?`,
      cardsA: (s, yes) => (yes ? `Ja, bij ${s} kan je met de kaart betalen.` : `Nee, bij ${s} betaal je volgens onze gegevens niet met de kaart.`),
      deliveryQ: (s) => `Levert ${s} aan huis?`,
      deliveryA: (s, yes) => (yes ? `Ja, ${s} levert aan huis.` : `Nee, ${s} levert niet aan huis.`),
      nearQ: (s) => `Welke frituren liggen in de buurt van ${s}?`,
      nearA: (items) => `In de buurt liggen ${list(items, 'en')}.`,
    },
  },
  fr: {
    shopTitle: (s, t, hasTown) => `${s}${hasTown ? '' : ` à ${t}`} – horaires & adresse | FrituurFinder`,
    shopDesc: ({ name, addr, summary, phone }) =>
      cut(`${name}, ${addr}. ${summary ? `Ouvert ${summary}.` : ''} ${phone ? `Tél. ${phone}.` : ''} Itinéraire et friteries à proximité.`),
    townDesc: (t, n, names, first) =>
      n === 1
        ? cut(`Friterie à ${t} : ${first.name}${first.street ? ` (${first.street})` : ''}. ${first.summary ? `Ouvert ${first.summary}.` : ''} Adresse, horaires et téléphone.`)
        : cut(`${n} friteries à ${t}, dont ${list(names, 'et')}. Adresses, horaires et qui est ouvert maintenant.`),
    hoursWeek: "Heures d'ouverture",
    hoursNote: "Selon OpenStreetMap. Les jours fériés, l'horaire peut varier.",
    sameTown: (t) => `Autres friteries à ${t}`,
    faqTitle: (s) => `Questions fréquentes sur ${s}`,
    faq: {
      hoursQ: (s) => `Quels sont les horaires de ${s} ?`,
      hoursA: (s, sum) => `${s} est ouvert ${sum}.`,
      hoursUnknownA: (s, phone) =>
        `Les horaires de ${s} ne sont pas (encore) connus.${phone ? ` Mieux vaut appeler avant : ${phone}.` : ''}`,
      dayQ: (s, day) => `${s} est-il ouvert le ${day} ?`,
      dayYes: (s, day, slots) => `Oui, le ${day}, ${s} est ouvert de ${slots}.`,
      dayNo: (s, day) => `Non, le ${day}, ${s} est fermé.`,
      whereQ: (s) => `Où se trouve ${s} ?`,
      whereA: (s, addr, t, p) => `${s} se trouve ${addr ? `${addr}, ` : ''}à ${t} (${p}).`,
      cardsQ: (s) => `Peut-on payer par carte chez ${s} ?`,
      cardsA: (s, yes) => (yes ? `Oui, chez ${s} vous pouvez payer par carte.` : `Non, selon nos données, ${s} n'accepte pas les cartes.`),
      deliveryQ: (s) => `${s} livre-t-il à domicile ?`,
      deliveryA: (s, yes) => (yes ? `Oui, ${s} livre à domicile.` : `Non, ${s} ne livre pas à domicile.`),
      nearQ: (s) => `Quelles friteries se trouvent près de ${s} ?`,
      nearA: (items) => `À proximité : ${list(items, 'et')}.`,
    },
  },
  en: {
    shopTitle: (s, t, hasTown) => `${s}${hasTown ? '' : `, ${t}`} – opening hours & address | FrituurFinder`,
    shopDesc: ({ name, addr, summary, phone }) =>
      cut(`${name}, ${addr}. ${summary ? `Open ${summary}.` : ''} ${phone ? `Phone ${phone}.` : ''} Directions and nearby fries shops.`),
    townDesc: (t, n, names, first) =>
      n === 1
        ? cut(`Fries shop in ${t}: ${first.name}${first.street ? ` (${first.street})` : ''}. ${first.summary ? `Open ${first.summary}.` : ''} Address, opening hours and phone.`)
        : cut(`${n} fries shops in ${t}, including ${list(names, 'and')}. Addresses, opening hours and who's open now.`),
    hoursWeek: 'Opening hours',
    hoursNote: 'According to OpenStreetMap. Hours may differ on public holidays.',
    sameTown: (t) => `Other fries shops in ${t}`,
    faqTitle: (s) => `Frequently asked questions about ${s}`,
    faq: {
      hoursQ: (s) => `What are the opening hours of ${s}?`,
      hoursA: (s, sum) => `${s} is open ${sum}.`,
      hoursUnknownA: (s, phone) =>
        `The opening hours of ${s} aren't known (yet).${phone ? ` Best to call ahead: ${phone}.` : ''}`,
      dayQ: (s, day) => `Is ${s} open on ${day}?`,
      dayYes: (s, day, slots) => `Yes, on ${day} ${s} is open ${slots}.`,
      dayNo: (s, day) => `No, ${s} is closed on ${day}.`,
      whereQ: (s) => `Where is ${s}?`,
      whereA: (s, addr, t, p) => `${s} is ${addr ? `at ${addr}, ` : ''}in ${t} (${p}).`,
      cardsQ: (s) => `Can I pay by card at ${s}?`,
      cardsA: (s, yes) => (yes ? `Yes, ${s} accepts card payments.` : `No, according to our data ${s} doesn't accept cards.`),
      deliveryQ: (s) => `Does ${s} deliver?`,
      deliveryA: (s, yes) => (yes ? `Yes, ${s} delivers.` : `No, ${s} doesn't deliver.`),
      nearQ: (s) => `Which fries shops are near ${s}?`,
      nearA: (items) => `Nearby you'll find ${list(items, 'and')}.`,
    },
  },
};

# FrituurFinder 🍟

A directory of every frituur (fries shop) in Belgium, in Dutch, French and English. It's built to practice SEO.

It's a static site generator in plain Node with **no dependencies**. The data comes from OpenStreetMap via the Overpass API.

## Deploy to Vercel

**Option A: Vercel CLI**

You need Node 18 or newer. In a terminal, in this folder, run:

```bash
npm run fetch          # optional but recommended: downloads OSM data into data/frituren.json
npx vercel             # first time: log in and link a new project
npx vercel --prod      # deploy to production
```

**Option B: GitHub**

1. Push this folder to a GitHub repo.
2. In Vercel, go to **Add New → Project**, import the repo and deploy. `vercel.json` already sets the build command and the output folder.

If `data/frituren.json` is missing, the build downloads it from OpenStreetMap on its own. Committing the file makes builds faster and more reliable.

### Environment variable

`SITE_URL` sets the canonical domain, for example `https://www.frituurfinder.be`. It's used in canonical tags, hreflang, the sitemap and robots.txt.

You don't need to set it on Vercel: the build falls back to the project's production `*.vercel.app` URL. Set it once you connect your own domain.

## Commands

| Command | What it does |
|---|---|
| `npm run build` | Builds the site into `dist/` (downloads the data first if it's missing) |
| `npm run fetch` | Downloads fresh OSM data into `data/frituren.json` |
| `npm run refresh` | Runs fetch and then build |
| `npm run preview` | Serves `dist/` at http://localhost:3000 |

## URL structure

```
/                                   language chooser (x-default)
/nl/  /fr/  /en/                    home per language
/nl/oost-vlaanderen/                province
/nl/oost-vlaanderen/gent/           town      (fr: /fr/flandre-orientale/gand/)
/nl/oost-vlaanderen/gent/<frituur>/ shop page
/sitemap.xml  /robots.txt  /404.html
```

## SEO features already built in

- **Unique titles and meta descriptions** for every page and language, generated from templates in `src/i18n.mjs`.
- **hreflang links** between nl-BE, fr-BE and en, plus x-default. They're in each page's `<head>` and in the sitemap.
- **Localized slugs**: Gent, Gand and Ghent; Oost-Vlaanderen, Flandre-Orientale and East Flanders.
- **Canonical URLs** with consistent trailing slashes.
- **Structured data (JSON-LD)**: `FastFoodRestaurant` with address, geo coordinates, phone and opening hours; `BreadcrumbList`; `ItemList` on town pages; `WebSite` on the home pages.
- **Internal linking**: home → province → town → shop, with nearby towns and nearby shops on every page.
- **Fast pages**: static HTML, one small CSS file and no framework. The maps (Leaflet) load deferred.
- An **"Edit on OpenStreetMap"** link on every shop page, so the data can be corrected at the source.

## Experiments to try

1. Submit the sitemap in Google Search Console and watch the "Pages" indexing report.
2. Rewrite the town title templates in `src/i18n.mjs`, then compare click-through rates in Search Console after 2–4 weeks.
3. Towns with only one frituur are thin pages. Test adding `noindex` to them (the `layout()` function supports `noindex`) and compare.
4. Write a hand-made guide for the 5 biggest cities. Unique content should beat templated content.
5. Add shop photos or reviews to the most-searched shops.
6. Build a linkable piece (for example "The frituur map of Belgium" or a statistics page) and pitch it to local blogs.

## Files

```
scripts/fetch-osm.mjs   Overpass query + data cleaning (towns, provinces from postcodes)
scripts/build.mjs       page templates, sitemap, robots.txt
src/i18n.mjs            all text per language (titles, descriptions, labels)
src/geo.mjs             provinces, bilingual town names (Brussel/Bruxelles, Luik/Liège…)
src/hours.mjs           opening hours formatting + schema.org conversion
static/                 CSS, JS (map + search), favicon, copied to dist/
```

The data is © OpenStreetMap contributors and licensed under the ODbL. Keep the attribution in the footer.

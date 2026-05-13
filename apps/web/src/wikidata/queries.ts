/**
 * SPARQL queries per top-level category. Each query returns rows shaped as:
 *   ?item ?itemLabel ?year ?article
 *
 * Filter on `wikibase:sitelinks` (count of language editions) as a proxy for
 * notability — higher = more famous, lower = wider variety.
 */

import type { CategoryId } from "@/game/types";

const COMMON_TAIL = `
  ?article schema:about ?item ;
           schema:isPartOf <https://en.wikipedia.org/> .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
`;

/** Films — publication date (P577), instance of film (Q11424). */
const FILMS_QUERY = `
SELECT DISTINCT ?item ?itemLabel ?year ?article WHERE {
  ?item wdt:P31/wdt:P279* wd:Q11424 ;
        wdt:P577 ?date ;
        wikibase:sitelinks ?sl .
  FILTER(?sl >= 40)
  BIND(YEAR(?date) AS ?year)
  FILTER(?year >= 1900 && ?year <= YEAR(NOW()))
  ${COMMON_TAIL}
}
ORDER BY DESC(?sl)
LIMIT 300
`;

/** Books — literary works (Q571 book / Q47461344 written work) with publication date. */
const BOOKS_QUERY = `
SELECT DISTINCT ?item ?itemLabel ?year ?article WHERE {
  { ?item wdt:P31/wdt:P279* wd:Q571 . }
    UNION { ?item wdt:P31/wdt:P279* wd:Q47461344 . }
    UNION { ?item wdt:P31/wdt:P279* wd:Q8261 . }
  ?item wdt:P577 ?date ;
        wikibase:sitelinks ?sl .
  FILTER(?sl >= 30)
  BIND(YEAR(?date) AS ?year)
  FILTER(?year >= 1500 && ?year <= YEAR(NOW()))
  ${COMMON_TAIL}
}
ORDER BY DESC(?sl)
LIMIT 250
`;

/** Music albums (Q482994) with publication date. */
const MUSIC_QUERY = `
SELECT DISTINCT ?item ?itemLabel ?year ?article WHERE {
  ?item wdt:P31/wdt:P279* wd:Q482994 ;
        wdt:P577 ?date ;
        wikibase:sitelinks ?sl .
  FILTER(?sl >= 30)
  BIND(YEAR(?date) AS ?year)
  FILTER(?year >= 1950 && ?year <= YEAR(NOW()))
  ${COMMON_TAIL}
}
ORDER BY DESC(?sl)
LIMIT 250
`;

/** Wars & events: battles (Q178561), wars (Q198), events (Q1190554). Use start time P580. */
const WARS_QUERY = `
SELECT DISTINCT ?item ?itemLabel ?year ?article WHERE {
  { ?item wdt:P31/wdt:P279* wd:Q198 . }
    UNION { ?item wdt:P31/wdt:P279* wd:Q178561 . }
  ?item (wdt:P580 | wdt:P585) ?date ;
        wikibase:sitelinks ?sl .
  FILTER(?sl >= 50)
  BIND(YEAR(?date) AS ?year)
  FILTER(?year >= -3000 && ?year <= YEAR(NOW()))
  ${COMMON_TAIL}
}
ORDER BY DESC(?sl)
LIMIT 200
`;

/** Inventions / discoveries — use inception date P571 on technology/invention types. */
const INVENTIONS_QUERY = `
SELECT DISTINCT ?item ?itemLabel ?year ?article WHERE {
  { ?item wdt:P31/wdt:P279* wd:Q11410 . }
    UNION { ?item wdt:P31/wdt:P279* wd:Q12772819 . }
  ?item wdt:P571 ?date ;
        wikibase:sitelinks ?sl .
  FILTER(?sl >= 30)
  BIND(YEAR(?date) AS ?year)
  FILTER(?year >= -3000 && ?year <= YEAR(NOW()))
  ${COMMON_TAIL}
}
ORDER BY DESC(?sl)
LIMIT 200
`;

/** Paintings — instance of painting (Q3305213). */
const ART_QUERY = `
SELECT DISTINCT ?item ?itemLabel ?year ?article WHERE {
  ?item wdt:P31/wdt:P279* wd:Q3305213 ;
        (wdt:P571 | wdt:P577) ?date ;
        wikibase:sitelinks ?sl .
  FILTER(?sl >= 30)
  BIND(YEAR(?date) AS ?year)
  FILTER(?year >= 1000 && ?year <= YEAR(NOW()))
  ${COMMON_TAIL}
}
ORDER BY DESC(?sl)
LIMIT 200
`;

/** Architectural works — instance of building (Q41176 or subclass). */
const ARCH_QUERY = `
SELECT DISTINCT ?item ?itemLabel ?year ?article WHERE {
  ?item wdt:P31/wdt:P279* wd:Q41176 ;
        wdt:P571 ?date ;
        wikibase:sitelinks ?sl .
  FILTER(?sl >= 40)
  BIND(YEAR(?date) AS ?year)
  FILTER(?year >= -3000 && ?year <= YEAR(NOW()))
  ${COMMON_TAIL}
}
ORDER BY DESC(?sl)
LIMIT 200
`;

/** Video games — instance of video game (Q7889). */
const GAMES_QUERY = `
SELECT DISTINCT ?item ?itemLabel ?year ?article WHERE {
  ?item wdt:P31/wdt:P279* wd:Q7889 ;
        wdt:P577 ?date ;
        wikibase:sitelinks ?sl .
  FILTER(?sl >= 25)
  BIND(YEAR(?date) AS ?year)
  FILTER(?year >= 1970 && ?year <= YEAR(NOW()))
  ${COMMON_TAIL}
}
ORDER BY DESC(?sl)
LIMIT 200
`;

/** Sport editions (Olympic Games, FIFA World Cups, etc.) */
const SPORTS_QUERY = `
SELECT DISTINCT ?item ?itemLabel ?year ?article WHERE {
  { ?item wdt:P31/wdt:P279* wd:Q179875 . }                # Olympics
    UNION { ?item wdt:P31/wdt:P279* wd:Q500834 . }        # FIFA World Cup
    UNION { ?item wdt:P31/wdt:P279* wd:Q13406554 . }      # sport competition
  ?item wdt:P585 ?date ;
        wikibase:sitelinks ?sl .
  FILTER(?sl >= 30)
  BIND(YEAR(?date) AS ?year)
  FILTER(?year >= 1800 && ?year <= YEAR(NOW()))
  ${COMMON_TAIL}
}
ORDER BY DESC(?sl)
LIMIT 200
`;

/** Scientific discoveries / theories. */
const SCIENCE_QUERY = `
SELECT DISTINCT ?item ?itemLabel ?year ?article WHERE {
  { ?item wdt:P31/wdt:P279* wd:Q12772819 . }              # discovery
    UNION { ?item wdt:P31/wdt:P279* wd:Q17737 . }         # scientific theory
  ?item (wdt:P575 | wdt:P571) ?date ;
        wikibase:sitelinks ?sl .
  FILTER(?sl >= 25)
  BIND(YEAR(?date) AS ?year)
  FILTER(?year >= -3000 && ?year <= YEAR(NOW()))
  ${COMMON_TAIL}
}
ORDER BY DESC(?sl)
LIMIT 200
`;

export const CATEGORY_QUERIES: Record<CategoryId, string> = {
  films: FILMS_QUERY,
  books: BOOKS_QUERY,
  music: MUSIC_QUERY,
  wars: WARS_QUERY,
  inventions: INVENTIONS_QUERY,
  art: ART_QUERY,
  architecture: ARCH_QUERY,
  games: GAMES_QUERY,
  sports: SPORTS_QUERY,
  science: SCIENCE_QUERY,
};

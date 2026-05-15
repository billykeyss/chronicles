/**
 * Famous-event anchors used by the `anchor` hint in timeline mode.
 * Curated for breadth + global recognisability. The hint picks the anchor
 * whose year is closest to the target so the older/newer answer narrows the
 * search by roughly half.
 */
export type Anchor = {
  name: string;
  year: number;
};

export const FAMOUS_ANCHORS: Anchor[] = [
  { name: "the founding of Rome", year: -753 },
  { name: "the death of Socrates", year: -399 },
  { name: "the assassination of Julius Caesar", year: -44 },
  { name: "the eruption of Mount Vesuvius at Pompeii", year: 79 },
  { name: "the fall of the Western Roman Empire", year: 476 },
  { name: "Charlemagne's coronation", year: 800 },
  { name: "the Battle of Hastings", year: 1066 },
  { name: "the signing of the Magna Carta", year: 1215 },
  { name: "the Black Death's peak in Europe", year: 1348 },
  { name: "the fall of Constantinople", year: 1453 },
  { name: "Columbus reaching the Americas", year: 1492 },
  { name: "Luther's 95 Theses", year: 1517 },
  { name: "Shakespeare's birth", year: 1564 },
  { name: "the Mayflower landing", year: 1620 },
  { name: "Newton's Principia", year: 1687 },
  { name: "the start of the French Revolution", year: 1789 },
  { name: "the end of the Napoleonic Wars", year: 1815 },
  { name: "the end of the American Civil War", year: 1865 },
  { name: "Edison's electric lightbulb", year: 1879 },
  { name: "the Wright brothers' first flight", year: 1903 },
  { name: "the end of World War I", year: 1918 },
  { name: "the Wall Street Crash", year: 1929 },
  { name: "the end of World War II", year: 1945 },
  { name: "the Apollo 11 moon landing", year: 1969 },
  { name: "the fall of the Berlin Wall", year: 1989 },
  { name: "the September 11 attacks", year: 2001 },
  { name: "the start of the COVID-19 pandemic", year: 2020 },
];

/** Pick the anchor whose year is closest to `targetYear`, excluding exact matches. */
export function pickClosestAnchor(targetYear: number): Anchor | null {
  let best: Anchor | null = null;
  let bestDist = Infinity;
  for (const a of FAMOUS_ANCHORS) {
    if (a.year === targetYear) continue;
    const d = Math.abs(a.year - targetYear);
    if (d < bestDist) {
      best = a;
      bestDist = d;
    }
  }
  return best;
}

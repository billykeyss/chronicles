/**
 * Centralised font config. Every component reads fonts through the
 * CSS variables `--font-display` and `--font-mono` (set on <html> by
 * layout.tsx), so swapping a font here propagates everywhere.
 *
 * To try a different font:
 *   1. Pick an import from one of the catalogues below
 *   2. Replace `displayFont` (or `monoFont`) with the new loader call
 *   3. Save — that's it.
 *
 * ─── Display fonts (used for body, titles, year tags) ─────────────
 *   Fraunces           — characterful serif w/ opsz + SOFT axes (current baseline)
 *   Young_Serif        — playful, slightly off-kilter chiseled serif
 *   Instrument_Serif   — elegant classic serif, distinctive "1" + "9"
 *   Bodoni_Moda        — high-contrast Italian luxury display
 *   DM_Serif_Display   — clean modern display serif
 *   Bagel_Fat_One      — chunky retro display, big personality
 *   Bungee             — vertical/horizontal signage display
 *   Pirata_One         — gothic blackletter — chronicles-meets-medieval
 *   Major_Mono_Display — futuristic monospace caps
 *   Press_Start_2P     — 8-bit arcade pixel font (very fun, low legibility for body)
 *   Rubik_Mono_One     — retro mono, heavy weight
 *   Silkscreen         — pixel bitmap font
 *   VT323              — green-phosphor terminal vibe
 *
 * ─── Mono fonts (used for labels, buttons, captions) ──────────────
 *   JetBrains_Mono     — clean, ligatures, technical (current baseline)
 *   IBM_Plex_Mono      — softer, editorial
 *   Space_Mono         — retro-futuristic
 *   Fira_Code          — coding ligatures
 *   DM_Mono            — quirky, narrow
 */
import { Fraunces, JetBrains_Mono } from "next/font/google";

/** Display font — drives body text, headings, year tags. */
export const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

/** Mono font — drives labels, buttons, captions. */
export const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/** Convenience — apply both font CSS variables to <html>. */
export const fontClassNames = `${displayFont.variable} ${monoFont.variable}`;

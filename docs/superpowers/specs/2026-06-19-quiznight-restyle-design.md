# Quiz Night Scoreboard — Look & Feel Restyle

**Date:** 2026-06-19
**Status:** Approved (design), pending implementation
**Scope:** Visual restyle only. No changes to scoring/persistence logic (that was fixed
separately and is covered by `test/scoreStore.test.js`).

## Goal

Make the scoreboard look like a slide from the host's existing quiz deck, so the screen the
crowd watches feels like one cohesive brand. Bright, playful, high-contrast, readable from across
a pub.

## Brand language (extracted from the host's quiz slides)

| Token            | Value      | Use                                              |
| ---------------- | ---------- | ------------------------------------------------ |
| `--qn-navy`      | `#2E2E86`  | Page / stage background                          |
| `--qn-navy-deep` | `#24246b`  | Top bar, circle badges, blob depth               |
| `--qn-pink`      | `#f13468`  | Header pill, primary buttons (already `$primary`)|
| `--qn-coral`     | `#f37b98`  | Corner background blobs                           |
| `--qn-gold`      | `#ffd24a`  | 1st-place row                                     |
| `--qn-gold-deep` | `#b8860b`  | 1st-place rank badge                              |
| `--qn-silver`    | `#e3e7ef`  | 2nd-place row                                     |
| `--qn-silver-deep`|`#8a93a6`  | 2nd-place rank badge                              |
| white            | `#ffffff`  | Pill outlines (3px) and text on navy/pink        |
| green            | `#1f9d57`  | Active joker / doubled-cell figure (bonus read)  |

Signature elements: pink rounded **pill panels** with thick white outlines; **navy circle
badges** with white rings (the round-number / rank motif); organic **coral blobs** + subtle
texture confined to the edges; heavy **UPPERCASE** headings.

## Typography

- Self-host **Montserrat** via `@fontsource/montserrat` (weights 400, 600, 800, 900) so it works
  offline at the venue — no runtime call to Google Fonts.
- Display / headings / team names / totals: Montserrat 800–900, UPPERCASE for headings & team
  names, letter-spacing tuned for impact.
- Body / inputs / score figures: Montserrat 400–600, normal case.
- Register the font in the boot layer (or `app.scss` import) and set it as the app's base family.

## Screen-by-screen

### Global (theme + layout)
- Define the palette as CSS custom properties in `src/css/app.scss`; keep `$primary` as the pink.
- `MainLayout`: navy `--qn-navy` page background. Top bar `--qn-navy-deep` with UPPERCASE
  "SCORE BOARD" title. Nav buttons become pills — "Teams" white-outline pill, active route filled
  pink. Add corner coral blobs as a fixed, low-opacity decorative layer behind the router view
  (pointer-events: none, edges only, never behind the central data area density).

### Board (`ScoreBoard.vue`)
- Container transparent over the navy stage.
- Sticky header: pink pill, white outline; "TEAM" / round numbers as navy circle badges /
  "TOTAL".
- Team rows: white pill, white 3px outline, chunky offset shadow. Team name UPPERCASE navy.
- Score cells: cleaner boxed inputs; joker stays the existing card icon. Active joker → green;
  doubled cell shows the doubled figure in bold green (unchanged behaviour — store keeps the raw
  value; cell read-only while jokered).
- Ranking (after sort): each row gets a navy circle **rank badge**; #1 row gold, #2 row silver,
  with gold/silver-deep badges. Totals reveal on sort (existing behaviour).
- Sort button: pink "RANK!" pill with white outline.
- Motion: replace the linear 2s reorder with a **bouncy spring** (overshoot cubic-bezier, ~0.6s).
  Totals keep the fade-in.

### Teams (`AddTeamForm.vue`)
- Form on the navy stage. Team-name input as a white pill. "ADD TEAM" pink pill button;
  "RESET ALL TEAMS" as an outline/negative pill.
- Current-teams list: each team a white pill row with a circle badge and a round delete button.
  Restyle the existing even/odd rows to the pill treatment.

## Optional flourish
- **Confetti burst** on pressing RANK!. Hand-rolled lightweight CSS/canvas (no heavy dependency)
  so the app stays self-contained and offline-friendly. Approved as a nice-to-have; can be cut
  without affecting the rest.

## Out of scope
- Scoring, joker, persistence, and reactivity logic — already fixed and tested. This work must not
  regress those; `npm test`, `npm run lint`, and `npm run build` must stay green.
- Number of rounds (still 10), routing, and store API are unchanged.

## Success criteria
- The Board and Teams screens visually match the approved mockup and read as the same brand as the
  quiz slides.
- Legible from a distance: high contrast, large totals, texture kept to the edges.
- `npm run lint`, `npm test`, `npm run build` all pass.

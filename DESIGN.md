---
name: Biznis Arena 2026 Live Vote
description: Election-night results studio for a business stage; phones are polling stations.
colors:
  studio-navy: "#0b1736"
  navy-950: "#060e24"
  slab-navy: "#0f1f45"
  slab-leader: "#142852"
  navy-700: "#172b5c"
  live-blue: "#0ea5ff"
  live-blue-deep: "#0284d4"
  call-gold: "#d4af37"
  gold-300: "#e9cf76"
  lower-third-paper: "#f4f6fa"
  ink-2: "#c3cddd"
  muted: "#94a3b8"
  danger: "#f87171"
  team-yova: "#ef6f5e"
  team-bubu: "#b98cf5"
  team-seed: "#3ccb8c"
typography:
  display:
    fontFamily: "Fira Sans Condensed, Golos Text, ui-sans-serif, sans-serif"
    fontSize: "clamp(28px, 8.6vw, 38px)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.005em"
  numeral:
    fontFamily: "Fira Sans Condensed, Golos Text, sans-serif"
    fontSize: "calc(var(--u) * 5.6)"
    fontWeight: 700
    lineHeight: 0.9
    fontFeature: "tnum"
  headline:
    fontFamily: "Fira Sans Condensed, Golos Text, sans-serif"
    fontSize: "clamp(32px, 9.6vw, 40px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Fira Sans Condensed, Golos Text, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    letterSpacing: "0.12em"
  body:
    fontFamily: "Golos Text, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.375
rounded:
  none: "0px"
  slab: "3px"
spacing:
  u: "min(1vw, calc(100vh * 16 / 9 / 100))"
  slab-gap: "12px"
  page-x: "20px"
components:
  ballot-slab:
    backgroundColor: "{colors.slab-navy}"
    textColor: "#ffffff"
    typography: "{typography.display}"
    rounded: "{rounded.none}"
    height: "96px"
  ballot-slab-hover:
    backgroundColor: "{colors.navy-700}"
  button-primary:
    backgroundColor: "{colors.live-blue}"
    textColor: "{colors.studio-navy}"
    rounded: "{rounded.slab}"
    height: "60px"
  button-paper:
    backgroundColor: "{colors.lower-third-paper}"
    textColor: "{colors.studio-navy}"
    rounded: "{rounded.slab}"
    height: "56px"
  live-bug:
    backgroundColor: "{colors.live-blue}"
    textColor: "{colors.studio-navy}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "28px"
  leader-flag:
    backgroundColor: "{colors.call-gold}"
    textColor: "{colors.studio-navy}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
  lower-third:
    backgroundColor: "{colors.lower-third-paper}"
    textColor: "{colors.studio-navy}"
    rounded: "{rounded.none}"
    height: "calc(var(--u) * 5)"
  language-switcher:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.slab}"
    height: "40px"
---

# Design System: Biznis Arena 2026 Live Vote

## Overview

**Creative North Star: "The Results Studio"**

The LED is an election-night results studio built for a business stage, and every phone is a polling station: ballot, confirmation, receipt. The system is a broadcast graphics package laid over a deep navy studio ground lit by one soft key light from above. Information arrives as sharp slabs with a single chamfered leading corner, white lower-third panels carrying navy type, and solid team colour tabs that identify each contestant without logos.

Colour is assigned by meaning, not decoration. Electric blue means "live" or "your active choice"; gold means "leading" or "declared winner"; the three team hues mean identity and nothing else. Type is condensed and heavy for names and numerals so they read from the back row, with a sturdy text face for running copy across Cyrillic and Latin scripts. Motion is broadcast grammar: horizontal clip-path wipes and numeric rolls on an expo-out curve, all optional under reduced motion.

The system refuses the live-poll dashboard: no rounded glowing cards, no neon bars, no gradient fills on data.

**Key Characteristics:**
- Navy studio ground with a single radial key light at the top.
- Sharp slabs (radius 0 to 3px) with one chamfered top-left corner.
- White lower-third panels with navy type.
- Team identity as a solid vertical colour tab, never a fill on the whole slab.
- Blue for LIVE and active choice only; gold for leader and winner only.
- Condensed uppercase names, tabular numerals.
- Wipes and numeric rolls, not fades and bounces.

## Colors

A navy studio with three signal colours, each holding exactly one meaning.

### Primary
- **Live Blue** (live-blue): the LIVE bug, the live status dot, the "+N" vote delta, the confirm-vote button, the active ballot arrow on hover/press, the QR panel's base strip, focus rings and text selection. It always means "happening now" or "this is your choice".
- **Live Blue Deep** (live-blue-deep): pressed/darker partner of Live Blue in the organizer console.

### Secondary
- **Call Gold** (call-gold): the leader flag on the LED row, the FINAL RESULTS bug, the CONGRATULATIONS band, the winner's stats line, the rank-1 marker, and the top rule of the phone's closed-round slab. Gold is the verdict colour.
- **Pale Gold** (gold-300): winner figures set on navy on the phone, where full gold would be too heavy at small sizes.

### Tertiary (team identity)
- **Coral** (team-yova), **Lilac** (team-bubu), **Mint** (team-seed): one party-colour family, defined in `src/config/contestants.ts`. They colour the team tab, the result bar fill, and the confirm sheet's top strip. A team's hue is stable and never changes with rank. The family deliberately avoids blue and gold.

### Neutral
- **Studio Navy** (studio-navy): the page ground everywhere on stage and phone, and the type colour on every paper or signal surface.
- **Deep Navy** (navy-950): the scrim behind the confirm sheet (at 80%).
- **Slab Navy** (slab-navy): result rows and ballot slabs at rest.
- **Leader Slab** (slab-leader): the current leader's row on the LED, a half-step lighter than its peers.
- **Lifted Navy** (navy-700): ballot slab hover/press and button hover on dark.
- **Lower-third Paper** (lower-third-paper): the ticker, QR panel, confirm sheet, receipt slab, language menu, and the organizer console ground.
- **Ink 2** (ink-2): secondary text on navy (percentages, sub-lines, switcher label).
- **Muted** (muted): tertiary text on navy (idle status, footnotes).
- **Danger** (danger): error borders and error states.

### Named Rules
**The One Meaning Rule.** Blue is live/active, gold is leader/winner, team hues are identity. A colour never borrows another's meaning; if an element is neither live nor winning nor a team, it is navy, paper, or white.

**The Equal Ground Rule.** Until votes decide, the three contestants get identical slabs, identical type and identical tab widths. Only the leader flag, the leader slab tone, and the gold call may single one out.

## Typography

**Display Font:** Fira Sans Condensed (with Golos Text, ui-sans-serif)
**Body Font:** Golos Text (with ui-sans-serif, system-ui)

**Character:** A broadcast pairing: a condensed, heavy face that packs long uppercase team names and big numerals into slab widths, with a sturdy, humanist text face for instructions and status. Both cover Cyrillic plus Turkish, Albanian and Swedish Latin.

On the LED all sizes are in `u`, one hundredth of a fitted 16:9 stage (19.2px at 1920×1080).

### Hierarchy
- **Display** (800, 4.1u LED row name / clamp(28px, 8.6vw, 38px) ballot name, 0.95): contestant names, always uppercase. The winner name on the call scales to fit an 84u measure (capped at 12u) at 0.92 line-height.
- **Numeral** (700, 5.6u, 0.9, tabular): live vote counts. Percentages drop to 600 at 1.9u in Ink 2; ticker total is 800 at 3.6u.
- **Headline** (800, clamp(32px, 9.6vw, 40px), 0.98, -0.01em): phone screen headings, uppercase, balanced. The LED title is 600 at 2.3u, 0.05em tracking.
- **Label** (700, 13px phone / 1.2 to 1.6u LED, 0.08em to 0.14em tracking, uppercase, condensed face): status bugs, flags, ticker label, language code, organizer section headings. Labels sit on or inside the element they name.
- **Body** (400 to 600, 15 to 20px, ~1.375): instructions, confirmation question, finality note, receipt time. Measure capped near 34ch on the phone.

### Named Rules
**The Tabular Rule.** Every number that changes live (counts, totals, percentages, receipt times) is set tabular so columns do not jitter as votes arrive.

**The Condensed Name Rule.** Team names are always the condensed face, uppercase, 800. Never set a contestant name in the text face.

## Layout

The LED is a fixed 16:9 stage that scales as a single unit: `--u = min(1vw, 100vh·16/9/100)`, so nothing scrolls on any widescreen output. Safe margins are 2.6u top, 3.6u sides, 2.4u bottom. The stage stacks a 4.6u top bar (logo, rule, status bug, title, rehearsal badge right), a main grid of results (fluid) beside a 24u QR column with a 3.4u gutter, and a full-width 5u lower-third. Result rows are a three-column grid: 1.5u colour tab, body (name line over 2.2u bar track), and a 15u figures column split by a hairline.

Every surface is a product, not a page: it fills a fixed viewport and the document never scrolls (`.app-surface`: no rubber-band, no text selection or long-press callouts on controls, no double-tap zoom delay). Only inner panels scroll when content truly overflows.

The phone is an app shell. On phones it is full-bleed and safe-area aware (top and bottom); on anything wider it renders as a 420px device frame (28px radius, 1px white/10 ring, deep shadow) centred on navy-950, so the voting app never stretches into a web page. Inside: app bar (logo, status bug, language switcher), heading, then ballot slabs that flex to fill the remaining height with 12px gaps and a 96px minimum each. Views (launch splash, waiting, ballot, receipt, closed) change with a horizontal push (x ±28px, 320ms, broadcast ease); the confirm sheet rises inside the frame. It installs to the home screen as a standalone app (`/manifest.webmanifest`, apple web-app meta, event-mark icons).

The organizer console is a full-viewport control room on navy-950 (stacks and scrolls only below `lg`): a 64px app bar (logo, "Контролна соба", connection, account), a stage column with the round status, title and total, three live result slabs and one full-width primary action pinned at the bottom (blue to open, gold to close, paper CSV once closed), and a 380px navy rail that scrolls internally (LED screen links and language, QR, new round, history).

## Elevation & Depth

Depth comes from tone and light, not stacked shadows. The studio ground carries one radial key light (`radial-gradient(ellipse 70% 60% at 50% -10%, #17295a, navy 62%)`); slabs sit flat on it and separate by tone steps (slab, leader slab, lifted). Soft, dark, diffuse shadows appear only under paper surfaces that float over navy.

### Shadow Vocabulary
- **Panel float** (`box-shadow: 0 0.8u 2.4u rgba(2,6,20,0.45)`): the white QR panel on the LED.
- **Sheet rise** (`box-shadow: 0 -16px 48px rgba(3,8,22,0.5)`): the confirm sheet over the scrim.
- **Menu drop** (`box-shadow: 0 12px 32px rgba(3,8,22,0.45)`): the language menu.
- **Device float** (`box-shadow: 0 30px 80px rgba(0,0,0,0.55)`): the phone app frame and the login slab on wide screens.

### Named Rules
**The Flat Slab Rule.** Navy slabs never carry shadows or glows; they are separated by tone and gap alone. Only paper surfaces floating over navy get a soft, dark shadow.

## Shapes

Sharp, cut, broadcast geometry. Corners are square or at most 3px; the signature is a single 45° chamfer on the top-left (leading) corner of a slab: 14px on phone slabs, 1.4 to 1.5u on LED rows and the lower-third, 1u on the ticker label inset. Status bugs and the leader flag end in a right-pointing arrow chamfer (0.6 to 0.9u, or 0.7em). Team tabs are full-height vertical bars on the slab's leading edge (14px on phone, 1.5u on LED) that widen on hover/press on the ballot. Dots (live dot, status dot) are the only circles.

**The One Cut Rule.** A slab gets one chamfered corner, the leading top-left. Never chamfer all corners, never round a slab beyond 3px.

## Components

### Buttons
Decisive, square, uppercase.
- **Shape:** near-square (3px).
- **Primary (confirm vote):** Live Blue fill, navy condensed 21px 700 uppercase, 0.04em tracking, 60px tall, full width. Hover brightens 5%, press darkens 5%; a navy spinner replaces nothing but joins the label while submitting.
- **Paper (retry):** Lower-third Paper fill, navy condensed 20px 700 uppercase, 56px tall.
- **Text back:** navy at 75%, 16px 600, underline on hover, 48px tall.
- **Console:** 48px, 3px radius, blue (open), navy (close), or 1px slate outline for secondary actions.
- **Focus:** global 3px Live Blue outline, 3px offset.

### Chips (status bugs and flags)
- **Live bug:** Live Blue with navy uppercase condensed label and a pulsing navy dot (1.4s), arrow chamfer on the right.
- **Final bug:** same form in Call Gold. **Soon bug:** Ink 2 at 16% with Ink 2 text. Phone idle state: 1px white/15 ring, Muted label.
- **Leader flag:** Call Gold, navy 800 label, 0.14em tracking, arrow chamfer. **Tie flag:** transparent with a 2px inset gold outline and gold text, no chamfer.
- **Rehearsal badge:** 2px white/70 outline (LED) or white/25 top and bottom rules (phone), widely tracked uppercase.

### Cards / Containers
- **Result row (LED):** Slab Navy, top-left chamfer, colour tab, name line, bar track (white at 7%) with solid team-colour fill, figures column behind a white/8% hairline. Leader row steps to Leader Slab.
- **Lower-third ticker:** full-width paper, chamfered left, navy inset label slab with its own chamfer, tabular total, quiet status at navy 62% with a blue dot. After close it becomes three equal final cells with a team tab, gold rank-1 marker and tabular figures.
- **QR panel:** paper, 3px radius, condensed 800 uppercase head, QR, URL, a 0.5u Live Blue base strip, Panel float shadow.
- **Receipt:** paper slab with chamfer, team tab and condensed name, then hairline-separated finality note (lock icon) and tabular timestamp.

### Inputs / Fields
- **Style (console):** 44px, 3px radius, 1px slate border on white.
- **Focus:** border turns Live Blue plus a 4px Live Blue/20 ring.

### Navigation
- **Language switcher:** 40px, 3px radius, 1px white/15 ring, globe icon, uppercase locale code in Ink 2 at 0.08em tracking, chevron that flips when open; hover lifts to white text on white/5. The menu is a paper list (3px, Menu drop shadow) of native language names with the code in navy/50.

### Ballot Slab (signature)
A full-width Slab Navy slab with the top-left chamfer, a 14px team tab that widens to 20px on hover and 24px on press (300ms, broadcast ease), the condensed 800 uppercase name, and a 48px square arrow well (white at 7%) that flips to Live Blue with navy arrow on hover/press. Slabs enter with a staggered left-to-right wipe (0.6s, 80ms stagger).

### Confirm Sheet (signature)
A paper sheet rising from the bottom (0.42s, broadcast ease) over an 80% Deep Navy scrim, topped by an 8px strip in the chosen team colour, then the condensed team name, the question, the lock-icon finality note, the Live Blue primary, and the text back action.

### The Call (signature)
On close, a full-width Call Gold band wipes in left to right carrying "CONGRATULATIONS!" (always English) in navy condensed 800, followed by the fitted winner name in white, a sub-line in Ink 2, and gold tabular stats. A tie uses a gold-outlined badge and lists the tied names; zero votes uses a quiet Leader Slab band.

### Motion
- **Broadcast ease** (`cubic-bezier(0.16, 1, 0.3, 1)`): every wipe, reorder and sheet.
- **Wipe** (`clip-path: inset(0 100% 0 0)` to `inset(0)`, 0.6 to 0.8s): entrances and the call. Content is visible by default; the wipe plays only under `prefers-reduced-motion: no-preference`.
- **Numeric roll** (0.6s): counts and totals. **Row reorder** (0.7s layout). **Bar fill** (0.9s).
- **Live pulse** (1.4s opacity): the live dot only. Disabled, with the delta, under reduced motion.

### Icons
An authored set on a 24px grid with 2.2px square-capped strokes (arrow, check, lock, globe, chevron, expand), inline SVG in `currentColor`.

## Do's and Don'ts

### Do:
- **Do** size every LED element in `u` so the stage scales as one 16:9 unit with no scrolling.
- **Do** give each slab exactly one chamfered top-left corner and keep corners at or under 3px.
- **Do** mark a team with a solid vertical colour tab and a solid bar fill in its fixed hue.
- **Do** set every changing number tabular in Fira Sans Condensed.
- **Do** put navy type on paper lower-thirds and white type on navy slabs.
- **Do** move with clip-path wipes and numeric rolls on the broadcast ease, and leave content visible when motion is reduced.

### Don't:
- **Don't** use Live Blue for anything that is not live state or the active choice, or gold for anything that is not leader or winner.
- **Don't** build rounded glowing cards, neon or gradient bars, or glows on navy slabs.
- **Don't** give one contestant more size, colour or position emphasis than the others before votes decide.
- **Don't** invent contestant logos, photos, descriptions or statistics; the colour tab and name are the whole identity.
- **Don't** set contestant names in the text face or in mixed case.

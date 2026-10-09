---
version: 1
slug: "src-app-screen-screenapp-tsx"
primary_target: "src/app/screen/ScreenApp.tsx"
related_targets: ["src/app/vote/VoteApp.tsx","src/app/admin/AdminConsole.tsx"]
---

# Surface brief: live vote (LED /screen, phone /vote, organizer /admin)

Scope: the three routes of the live vote. Modes: /screen Experience (the room watches), /vote and /admin Operate.
Audience/job: guests vote once in <10 s on their phone; the room watches results; organizers run the round.
Constraints: event brand colors (navy, electric blue, gold), 5 languages (mk, en, sv, sq, tr), LED language chosen in /admin, "CONGRATULATIONS!" stays English, no invented contestant material.
Memorable moment: the "call" — when voting closes a gold broadcast wipe declares the winner.

## Direction contract

THESIS: The LED is an election-night results studio for a business stage; phones are polling stations (ballot, confirmation, receipt). Refuses the live-poll dashboard of rounded glowing cards and neon bars.

OWN-WORLD: Deep navy studio ground with one soft key light; a broadcast graphics package of sharp slabs (radius ≤ 3px) with one chamfered leading edge; white lower-third panels with navy type; team identity as solid color tabs; electric blue reserved for LIVE state and the active choice; gold reserved for the declared winner and the leader flag. Fira Sans Condensed for names and numerals (tabular), Golos Text for running UI text.

STORY: Guest sees three equal ballot slabs, taps one, a confirmation sheet asks to confirm a final vote, the receipt shows the accepted choice and time. The room sees bars and counts tick with real votes, a "+N" delta on the row that moved, a lower-third ticker with total and the QR call to action. On close, a gold wipe calls the winner.

FIRST VIEWPORT: LED 1920×1080: top bar = logo, blue LIVE bug, title; left 64% = three result rows (color tab, name ~5u condensed 800, bar, count ~6u tabular, percent); right = white QR panel "scan & vote" + URL; bottom = full-width white lower-third ticker with chamfered left edge carrying total votes and status. Phone 390×844: header strip (logo, status, language switcher), heading, three tall ballot slabs filling the screen; primary action lives in the confirmation sheet.

FORM: Election Night Broadcast, my grounded list position 1 (taken as IMPECCABLE'S PICK over roll position 6), seed key a90c683e. Signature interaction: the closing "call" wipe; motion grammar = broadcast wipes (clip-path, expo-out) and numeric rolls.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

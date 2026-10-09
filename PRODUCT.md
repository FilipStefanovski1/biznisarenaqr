# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Guests** at Biznis Arena 2026 (a business conference in North Macedonia). They scan a QR code on the LED screen with their own phone, often in a dim hall on shared venue Wi-Fi, and cast one vote in under ten seconds. Many speak Macedonian; international attendees speak English, Swedish, Albanian or Turkish.
- **The room**: hundreds of people watching the LED screen together while votes arrive, then the winner reveal.
- **Organizers / AV team**: open and close voting from /admin on a laptop or phone, run /screen fullscreen on the AV laptop.

## Product Purpose
Live audience vote between exactly three contestants (YOVA, BUBU KOSMETIK, SEED OF LIFE). Every accepted vote moves the live scoreboard; ending the vote reveals the correct winner. Success = every real vote counted once, the room sees it happen, and the reveal is a credible stage moment.

## Positioning
A stage moment for a business conference, not a consumer poll: trustworthy (one final vote, server-confirmed), fast on any phone, and presentable on a large LED screen.

## Operating Context
- Lifecycle per round: waiting → open → closed. Fresh rounds keep previous results; rehearsal rounds are clearly labeled and isolated.
- Guest flow (confirmed): three large, equally prominent team buttons → tapping one opens a confirmation sheet ("are you sure, this vote is final") → Yes casts the vote → success. A vote cannot be changed or resubmitted.
- Languages (confirmed): Macedonian, English, Swedish, Albanian, Turkish. Phones auto-detect the device language (fallback Macedonian) with an always-visible switcher that remembers the choice. The LED screen language is chosen by the organizer in /admin (default Macedonian) and switches live. "CONGRATULATIONS!" stays in English on the screen.
- Hosted on Vercel at a public website; code in github.com/FilipStefanovski1/biznisarenaqr.

## Capabilities and Constraints
- Next.js + Supabase (Postgres source of truth, Realtime, Auth). One vote per voter identity per round enforced by the database; anonymous identity via signed cookie (cannot guarantee one human across browsers).
- Contestant names are fixed and kept in src/config/contestants.ts. No logos or descriptions exist for contestants; none may be invented.

## Brand Commitments
- Biznis Arena 2026 event logo (public/brand), event colors: deep navy #0B1736, electric blue #0EA5FF, gold #D4AF37, white, light #F4F6FA, muted #94A3B8. Navy stage, blue for voting activity, gold for the winner.
- Must read as business-professional, not AI-generated. Tasteful, professional motion is welcome.

## Evidence on Hand
- Event logo (white and navy variants) in public/brand. No contestant logos, photos, descriptions, sponsors or statistics; do not fabricate them.

## Product Principles
1. A vote is a commitment: make it deliberate (confirm), then final and unmistakably confirmed.
2. The room is the audience: the LED must be legible from the back row and every change must be visible.
3. Never fake activity: everything on screen reflects real, accepted votes.
4. Equal treatment: the three contestants are presented with equal prominence until votes decide.

## Accessibility & Inclusion
Five languages incl. Latin and Cyrillic scripts (Turkish and Albanian diacritics, Swedish å/ä/ö). Large touch targets, high contrast in dark venues, reduced-motion respected.

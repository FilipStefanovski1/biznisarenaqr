# Biznis Arena 2026 — live audience voting

Guests scan a QR code on the LED screen, vote for one of three contestants on their phone,
and every accepted vote moves the live scoreboard. When the organizer ends voting, voting
closes atomically in the database and the screen reveals the winner.

| Route     | Who                         | What                                                                |
| --------- | --------------------------- | ------------------------------------------------------------------- |
| `/vote`   | Guests' phones (QR target)  | Three big team buttons → "are you sure?" sheet → one final vote      |
| `/screen` | LED screen / AV laptop      | QR code, live results, totals, leader, winner "call" (1920×1080)     |
| `/admin`  | Organizers (login required) | Start / end voting, new rounds, LED language, QR, CSV, history       |

Contestants are configured once in [`src/config/contestants.ts`](src/config/contestants.ts)
(YOVA, BUBU KOSMETIK, SEED OF LIFE). The database migration holds the same ids. A unit
test fails if the two ever differ.

**Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Motion (animations),
Supabase Postgres + Realtime + Auth.

### One final vote per guest

Tapping a team opens a confirmation sheet ("Гласаш за YOVA? Гласот е конечен…") with
**Да, гласај** / **Назад**. Only **Да** sends the vote; **Назад** changes nothing. Once the
server accepts the vote the phone shows a receipt and never shows the ballot again for that
round. The database enforces this (`unique (round_id, voter_id)`), so retries, double taps
or a second request for another team return the original vote instead of adding one.

### Feels like an app, not a website

All three surfaces fill a fixed screen and never scroll like a page. On phones `/vote` is
full-screen and can be installed to the home screen ("Add to Home Screen" → opens without
a browser bar, event icon); on a laptop it shows as a phone-sized app frame. `/admin` is a
one-screen control room. `/screen` is a kiosk display (cursor hides after 2.5 s).

### Voting timer and sound

- In `/admin` pick **Тајмер** (1:00, 2:00 default, 3:00, 5:00 or **Без** = no timer) and press
  **Започни гласање**. The deadline is stored in the database: votes after zero are refused
  by the server even if a phone still shows the ballot, and the round closes itself at zero
  (the LED screen and control room trigger it; the database only allows it once the deadline
  has passed). The winner is then revealed automatically. **+30 сек** adds time;
  **Заврши веднаш** ends early.
- Countdowns on the LED, admin and phones use the database clock, so a wrong laptop or phone
  clock does not matter.
- The LED screen plays original game-show style music while voting is open (synthesised in
  the browser, no audio files), builds up in the last 30 s, ticks through the last 10 s, then
  plays a "time's up" hit and a fanfare on the winner reveal. Browsers only allow sound after
  a click: click anywhere on `/screen` (e.g. **Цел екран**) once. **Звук вклучен / исклучен**
  (top right, hidden in fullscreen) mutes it; the choice is remembered on that laptop.

### Languages

Public UI ships in **Macedonian, English, Swedish, Albanian and Turkish**
(`src/i18n/messages.ts`; contestant names are never translated).
- Phones pick the device language when it is one of these, otherwise Macedonian, and show
  a language switcher in the header; the choice is remembered on that phone.
- The LED language is chosen in `/admin` → *Јазик на LED екранот* and switches live on every
  screen (stored in the database, versioned like votes). `CONGRATULATIONS!` stays English.
- The admin console itself is in Macedonian.

### Visual direction

"Election-night results studio" for a business stage: navy studio ground, sharp broadcast
slabs with one chamfered corner, white lower-third ticker, team identity as solid colour
tabs (YOVA coral, BUBU KOSMETIK violet, SEED OF LIFE green — set in
`src/config/contestants.ts`), electric blue reserved for LIVE / your active choice, gold
reserved for the leader and the winner. Type: Fira Sans Condensed (names, numerals) and
Golos Text (UI copy), both with Cyrillic. Product notes for future design work live in
`PRODUCT.md` and `.impeccable/`.

---

## How it works

```
phone ──GET /api/vote──► Next.js ──(secret key) rpc get_voter_state──► Postgres
      ──POST /api/vote─► verifies signed cookie ──rpc cast_vote──────► lock round row,
                                                                      insert vote,
                                                                      bump version,
                                                                      realtime.send(snapshot)
/screen, /admin ◄── Supabase Realtime (private topic "scoreboard", aggregates only)
                ◄── GET /api/state?fresh=1 on (re)connect, focus, every 20 s, and every 3 s
                    while Realtime is down
```

### Vote integrity

- **Postgres is the source of truth.** Totals are always `count(*)` over recorded votes.
  There are no counters to drift and no in-memory state.
- **One vote per voter per round:** `unique (round_id, voter_id)`.
- **Locking:** `cast_vote` and the open/close/create functions all take `SELECT … FOR UPDATE`
  on the round row. A vote racing with closure either commits first and appears in the
  final totals, or runs after and sees `closed`. A trigger re-checks `status = 'open'` on
  every insert as a second line of defence.
- **Idempotent retries:** `cast_vote` checks for an existing vote first. A retry after a lost
  response returns `already_voted` with the original choice, even if voting has closed in
  the meantime. Nothing is added.
- **Server-side validation:** the contestant must exist, the round must exist, be the
  active round and be open. The client also sends the round id, so a stale phone can
  never vote into a different round.
- **Immutability:** closed rounds cannot be updated, rounds cannot be deleted, and votes are
  append-only. Triggers enforce this for every role.
- **Ordering:** every change takes a value from one global sequence (`version`). Clients
  apply a snapshot only if its version is higher, so stale or out-of-order Realtime messages
  and old poll responses can't overwrite newer data, including across rounds.

### Security boundaries

- Tables live in the private `voting` schema, which the Supabase Data API does not expose.
  RLS is enabled on every table with no policies.
- `anon` can only execute `get_public_state()`, which returns round metadata plus
  per-contestant counts. There are no voter ids and no raw votes.
- `cast_vote` and `get_voter_state` can only be executed by `service_role`. The Next.js
  server calls them only after verifying the HMAC-signed voter cookie.
- `admin_*` functions run with the admin's own JWT and re-check the `voting.admin_users`
  allowlist against `auth.uid()` inside the database. The API routes check the session
  (`auth.getUser()`) and allowlist first, and reject cross-origin requests (CSRF).
- Public sign-up is disabled. Admins are created only via `npm run admin:provision` using
  the secret key.
- Realtime: the `scoreboard` topic is a **private** channel. An RLS policy on
  `realtime.messages` lets anyone **receive** it, and there is no insert policy, so clients
  cannot send or spoof messages. Only the database (`realtime.send`) publishes. This is
  covered by an automated test.
- The secret key and cookie secret are server-only env vars (no `NEXT_PUBLIC_` prefix).

### Guest identity (important limitation)

Each phone gets a random voter id in an **httpOnly, HMAC-signed cookie**. It survives
refreshes and the app restores the accepted vote from the backend. This prevents ordinary
repeat voting from the same browser. It **cannot** guarantee one human = one vote: a
person who uses a second browser, a private window or clears site data gets a new identity.
Nothing short of accounts or ticket codes can prevent that.

Supabase *anonymous sign-in* was deliberately not used. Supabase rate-limits anonymous
sign-ins per IP (30/hour by default), and a whole venue on shared Wi-Fi usually appears as
one IP. The signed cookie gives the same stable anonymous identity without that failure mode.

Abuse protection that does not block a shared-Wi-Fi audience:
- Generous per-network limit: `VOTE_RATE_LIMIT_PER_MINUTE` (default 1500 new votes per
  minute per public IP, stored in Postgres). Retries of accepted votes are never limited.
- A cookie must be issued by `GET /api/vote` before a vote is accepted.
- Same-origin check, strict body validation and size limit.
- Votes keep a salted hash of the client IP (never exposed) for post-event auditing.

### Realtime capacity notes

Phones do **not** open Realtime connections. They poll `GET /api/state`, which is
CDN-cacheable for 1 s, every 3–8 s, so hundreds of phones collapse into a few database
reads. Only `/screen` and `/admin` subscribe. This keeps the event far below Supabase's
concurrent-connection limits. Each vote produces one broadcast. If a plan's
messages-per-second limit drops messages during a burst, the screen confirms the final
totals from the server 1.5 s after the burst and polls whenever Realtime is down.

---

## Local development

Requirements: Node 20.9+ (tested on 24), Docker (Docker Desktop, OrbStack or Colima), the
Supabase CLI.

```bash
npm install
cp .env.example .env.local          # then fill in the values printed by db:start
npm run db:start                    # local Supabase (Postgres, Auth, Realtime, REST)
npm run db:reset                    # apply migrations + seed (wipes local data)
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-local-password' npm run admin:provision
npm run dev                         # http://localhost:3000/vote | /screen | /admin
```

`npm run db:start` prints the local `API_URL`, `PUBLISHABLE_KEY` and `SECRET_KEY` for
`.env.local`. Use `PUBLIC_SITE_URL=http://localhost:3000`. To test with real phones on the
same Wi-Fi, use your LAN IP (e.g. `http://192.168.1.20:3000`). The admin page warns that
this is a local URL.

### Database & migrations

- Schema, constraints, triggers, RLS, grants, Realtime policy, contestants and the initial
  production round are all in `supabase/migrations/20261008170000_voting_schema.sql`.
- `supabase/seed.sql` intentionally adds no votes. Production always starts at zero.
- New migration: `supabase migration new <name>`. Apply locally: `npm run db:reset`.
  Apply to the linked cloud project: `npm run db:push`.

### Admin provisioning

```bash
ADMIN_EMAIL=organizer@example.com ADMIN_PASSWORD='long-random-password' \
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SECRET_KEY=sb_secret_… \
npm run admin:provision
```

This creates (or resets the password of) the Supabase Auth user and adds it to
`voting.admin_users`. To revoke access, call `select public.revoke_admin('<user id>');` in
the SQL editor, or delete the user in Supabase Auth.

---

## Deployment (Supabase Cloud + Vercel)

1. **Create a Supabase project.** Frankfurt (eu-central-1) is closest to North Macedonia.
   Use the Pro plan for the event night (higher Realtime limits, no auto-pausing).
2. **Apply the schema:**
   ```bash
   supabase login
   supabase link --project-ref <project-ref>
   npm run db:push
   ```
3. **Auth settings** (Dashboard → Authentication):
   - Sign In / Providers → **disable "Allow new users to sign up"**. Keep the *Email*
     provider enabled, because admins log in with email + password.
   - URL Configuration → Site URL = your public domain.
4. **Realtime settings** (Dashboard → Realtime → Settings): turn **off "Allow public access"**
   so only private channels with RLS are allowed. The app only uses the private
   `scoreboard` channel.
5. **API keys** (Project Settings → API Keys): copy the publishable key and a secret key.
6. **Provision admins** with `npm run admin:provision` (above) against the cloud project.
7. **Deploy the app to Vercel** (`vercel.json` pins functions to `fra1`, next to the database):
   ```bash
   vercel link
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
   vercel env add SUPABASE_SECRET_KEY production
   vercel env add VOTER_COOKIE_SECRET production        # openssl rand -hex 32
   vercel env add PUBLIC_SITE_URL production            # e.g. https://glasaj.biznisarena.mk
   vercel env add VOTE_RATE_LIMIT_PER_MINUTE production # 1500
   vercel deploy --prod
   ```
   Attach the custom domain in Vercel and make sure `PUBLIC_SITE_URL` is exactly that HTTPS
   domain, then redeploy. Any Node host that runs `next build && next start` behind HTTPS
   also works. Set `APP_ENV=production` there.
8. **Verify:** `npm run check:env -- --production` with the production values, open
   `/admin`, download the QR and scan it with a phone.

### Environment variables

| Name                                   | Where       | Purpose                                                   |
| -------------------------------------- | ----------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | public      | Supabase project URL                                      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public      | Publishable/anon key (public reads + Realtime receive)    |
| `SUPABASE_SECRET_KEY`                  | server only | Records votes after cookie verification                   |
| `PUBLIC_SITE_URL`                      | server      | Public HTTPS origin; the QR code encodes `…/vote`         |
| `VOTER_COOKIE_SECRET`                  | server only | ≥32 chars; signs voter cookies, hashes IPs                |
| `VOTE_RATE_LIMIT_PER_MINUTE`           | server      | New votes per public IP per minute (default 1500)         |
| `APP_ENV`                              | server      | `production` on non-Vercel hosts (strict URL checks)      |

In production, a localhost, private-IP or non-HTTPS `PUBLIC_SITE_URL` is **rejected**. The
QR endpoint returns 503, `/screen` shows a red error instead of a QR code, and `/admin`
shows a warning.

---

## Organizer guide (event night)

1. **AV laptop:** open `https://<domain>/screen` in Chrome, click **Цел екран**
   (bottom-right; it disappears in fullscreen). Check that the status chip reads
   *НАСКОРО ЗАПОЧНУВА*, the footer reads *Резултатите се ажурираат во живо*, and **no
   ПРОБА badge** is visible.
2. **Test the QR:** from the back of the hall, scan the QR on the LED with 2–3 different
   phones (iPhone + Android). The voting page should load and say
   *Гласањето наскоро започнува*.
3. **Organizer laptop/phone:** open `https://<domain>/admin` and log in. Confirm that the
   active round is **ПРОДУКЦИЈА** with 0 votes and the connection pill is green.
4. **Open voting:** check the timer (2:00 by default), then click **Започни гласање**. Phones switch to the ballot within a few
   seconds; new scans see it immediately. Set the LED language under
   *Јазик на LED екранот* if the audience is international.
5. **During voting:** bars, numbers and positions update on their own. Never refresh.
   If the screen shows *Повторно поврзување…*, it keeps the last results and recovers by
   itself. Refreshing is also safe.
6. **Close voting:** click **Заврши гласање и прикажи победник** → confirm. Voting closes in
   the database and the LED switches to **CONGRATULATIONS!** with the winner (a tie shows
   all tied names labeled **НЕРЕШЕНО**; zero votes shows *Нема регистрирани гласови*).
7. **Verify:** the admin totals match the screen. Click **Преземи CSV** to archive. The
   winner stays on screen, even after a refresh, until you create a new round.
8. **Another round (optional):** enter a name under **Нова рунда** → **Креирај** → confirm,
   then **Започни гласање**. Previous results stay in *Историја на рунди*, and every guest
   can vote once again.

## Venue rehearsal checklist

- [ ] In `/admin`, create a round with **Пробна рунда** ticked. The LED and phones show
      **ПРОБА**.
- [ ] Open `/screen` on the actual AV laptop and output (LED processor / projector). Check
      the resolution and that nothing is cut off at the edges, and that the browser is in
      fullscreen.
- [ ] Readability: from the farthest seat, check that names, numbers and percentages are
      legible. Scan the QR from the back rows and from an angle.
- [ ] Phones: test iPhone (Safari) + Android (Chrome), on venue Wi-Fi **and** mobile data.
      Vote, refresh (it should still say the vote is registered), and try voting again
      (it is not counted).
- [ ] Shared Wi-Fi: have 10+ people vote at once on the venue Wi-Fi. None should be
      blocked. If the admin shows rate-limit errors, raise `VOTE_RATE_LIMIT_PER_MINUTE`.
- [ ] Animation: use **+10 / +50** (rehearsal-only simulated votes) to watch bars grow and
      positions swap.
- [ ] Reconnect: unplug the AV laptop's network or turn its Wi-Fi off for 30 s while votes
      come in. The screen keeps the last numbers and shows *Повторно поврзување…*. Reconnect;
      the totals must match `/admin`.
- [ ] Close the rehearsal round and check the winner reveal, the tie wording if relevant,
      and the CSV.
- [ ] **Before doors open:** create the real round with **Пробна рунда unticked**. It
      starts at 0. Confirm **ПРОДУКЦИЈА** in `/admin` and no ПРОБА badge on the LED.
- [ ] Optional load test against a staging deployment with a rehearsal round (see below).

---

## Testing

```bash
npm run lint && npm run typecheck
npm run test            # unit + database integration tests (needs local Supabase running)
npm run test:e2e        # Playwright: builds, runs `next start` on :3100 against local Supabase
npm run loadtest -- --create-round   # needs the app running on :3100 (see below)
```

- **Unit** (`tests/unit`): ranking, ties and zero votes, number formatting, snapshot
  ordering and validation, site URL rules, cookie signing, CSV and formula-injection
  protection, config ↔ migration parity.
- **Database** (`tests/db`, local only; refuses non-local hosts): concurrent duplicate
  votes, idempotent retries, invalid contestant/round, waiting/closed rejection, a
  300-vote burst racing with closure, global versioning, new round preserves old results,
  immutability triggers, rehearsal-only simulation, rate limit, grants via PostgREST
  (anon/non-admin refused, no table access, sign-up disabled), Realtime delivery and
  spoofing rejection.
- **E2E** (`tests/e2e`, creates rehearsal rounds only): multiple phones voting while
  `/screen` updates without reload, double taps and concurrent duplicates, refresh keeps
  state, invalid/unauthorized/CSRF requests, waiting/closed, concurrent close over HTTP,
  admin confirm → winner reveal → survives refresh, CSV, tie and zero-vote reveal, new
  round, offline/reconnect, layout at 1920×1080 / 1280×720 / 2560×1440 / 1920×1200 and
  three phone sizes with no scrolling or clipping, and the QR (PNG + on-screen) decoding
  to the configured URL.
- **Load test** (`scripts/load-test.ts`): 500 guests (identity + vote, 50 concurrent), then
  100 simultaneous submissions, then 50 retries. It checks exact totals and Realtime
  delivery. It aborts unless the active round is an open **rehearsal** round, and it
  refuses non-local targets unless `LOADTEST_ALLOW_REMOTE=1`. To run it:
  ```bash
  npm run build && PUBLIC_SITE_URL=http://localhost:3100 npx next start -p 3100 &
  npm run loadtest -- --create-round
  ```
  Results from a single laptop running everything locally say nothing about venue Wi-Fi or
  cloud latency. Run it against a staging deployment with a rehearsal round for real
  numbers.

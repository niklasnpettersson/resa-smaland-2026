# Supabase Setup (gratis)

Det här räcker för er resa. Ingen betalplan behövs.

## Gratisnivå — räcker gott

| Tjänst | Gratis | Er resa |
|--------|--------|---------|
| Supabase Storage | 1 GB | Tusentals komprimerade foton |
| Bandbredd | 2 GB/månad | Mer än nog för 2 telefoner |
| Auth (inloggning) | 50 000 MAU | Ni är 2 personer |
| Vercel hosting | Hobby gratis | Redan igång |

Bilderna komprimeras i appen (~200–400 KB/st) så ni håller er långt under gränsen.

## Steg 1 — Skapa Supabase-projekt (gratis)

1. Gå till [supabase.com](https://supabase.com) → **Start your project**
2. Välj **Free** plan
3. Region: **EU (Frankfurt)** eller närmast Sverige
4. Projektnamn: t.ex. `resa-smaland-2026`

## Steg 2 — Kör SQL

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Klistra in allt från `supabase/setup.sql`
3. Klicka **Run**

Det skapar bucket `trip-photos` och tabellen `trip_photos` med säkerhet (RLS).

## Steg 3 — Skapa inloggning (en eller två personer)

Ni kan välja **ett gemensamt konto** eller **ett konto var** — båda fungerar.

### Alternativ A — Eget konto till varje person (rekommenderat)

1. **Authentication** → **Users** → **Add user** → skapa konto för person 1
2. Upprepa **Add user** → skapa konto för person 2 (t.ex. tjejens e-post)
3. Kryssa i **Auto Confirm User** så ni slipper e-postbekräftelse
4. Var och en loggar in på fliken **Bilder** med sin egen e-post

Båda ser samma bilder i molnet (alla inloggade får läsa/skriva enligt `setup.sql`).

### Alternativ B — Ett gemensamt resekonto

1. **Authentication** → **Users** → **Add user**
2. Samma e-post + lösenord på båda telefonerna

Under **Providers** → **Email**: låt **Confirm email** vara av om ni vill slippa e-postbekräftelse.

## Steg 4 — Hämta nycklar

**Project Settings** → **API**:

- **Project URL** → `SUPABASE_URL`
- **anon public** key → `SUPABASE_ANON_KEY`

## Steg 5 — Lägg in på Vercel (gratis)

Vercel → projektet `resa-smaland-2026` → **Settings** → **Environment Variables**:

| Namn | Värde |
|------|--------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJ...` |

Spara → **Redeploy** (Deployments → tre prickar → Redeploy).

## Steg 6 — Testa

1. Öppna https://resa-smaland-2026.vercel.app
2. Fliken **Bilder**
3. Logga in med ert Supabase-konto
4. Ladda upp en bild på telefon 1
5. Öppna samma sida på telefon 2 (inloggad) — bilden ska synas

## Lokalt (valfritt)

```bash
set SUPABASE_URL=https://xxxxx.supabase.co
set SUPABASE_ANON_KEY=eyJ...
npm run build
npm start
```

Utan nycklar fungerar appen fortfarande — då sparas bilder bara lokalt i telefonen.

## Säkerhet

- Använd **aldrig** `service_role` i webbläsaren
- `anon` + RLS räcker
- Ett gemensamt lösenord för resan är OK; stäng av öppen registrering under **Authentication → Providers** om ni vill

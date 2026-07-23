# Implementation Log

## 2026-07-23

- Added mobile-first travel website in `web/` with trip plan content from `create-travel-doc.js`.
- Notes: auto-save to `localStorage`, list/edit/delete, export as `.txt` or `.json`.
- Photos: IndexedDB locally, or Supabase Storage (free tier) when configured + signed in.
- GPS: browser Geolocation API, shows nearest trip destination and today's plan.
- Pre-trip checklist persists in `localStorage`.
- Added `npm start` to serve the site locally.
- Hero header: couple photo (`web/images/couple-hero.png`) with green overlay; subtitle "Niklas & Elin".
- Photo gallery: clearer errors, refresh after auth, "Uppdatera galleri" button (local, not deployed yet).
- Trip music: `web/music.js` + floating play/pause; autoplay with gesture fallback; track `web/audio/resa-theme.mp3` ("Dans över logen").

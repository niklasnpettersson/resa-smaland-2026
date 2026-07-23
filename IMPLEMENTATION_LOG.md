# Implementation Log

## 2026-07-23

- Added mobile-first travel website in `web/` with trip plan content from `create-travel-doc.js`.
- Notes: auto-save to `localStorage`, list/edit/delete, export as `.txt` or `.json`.
- Photos: IndexedDB locally, or Supabase Storage (free tier) when configured + signed in.
- GPS: browser Geolocation API, shows nearest trip destination and today's plan.
- Pre-trip checklist persists in `localStorage`.
- Added `npm start` to serve the site locally.

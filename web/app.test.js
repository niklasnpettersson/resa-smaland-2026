const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const dir = __dirname;
const appSource = readFileSync(join(dir, "app.js"), "utf8");
const dataSource = readFileSync(join(dir, "data.js"), "utf8");

test("trip data includes six travel days", () => {
  const dayCount = (dataSource.match(/id:\s*"2026-07-/g) ?? []).length;
  assert.equal(dayCount, 6);
});

test("app uses localStorage keys for notes and checklist", () => {
  assert.match(appSource, /resa-smaland-notes-v1/);
  assert.match(appSource, /resa-smaland-checklist-v1/);
});

test("app supports geolocation and photo storage", () => {
  assert.match(appSource, /geolocation/);
  assert.match(appSource, /haversineKm/);
  assert.match(appSource, /PhotoStore/);
});

test("app supports swiping between days", () => {
  assert.match(appSource, /initDaySwipe/);
  assert.match(appSource, /selectAdjacentDay/);
});

test("trip data includes per-person packing lists with essentials", () => {
  assert.match(dataSource, /packing/);
  assert.match(dataSource, /Sertraline/);
  assert.match(dataSource, /Fragmin/);
  assert.match(dataSource, /Stödstrumpor/);
  assert.match(appSource, /renderPacking/);
  assert.match(appSource, /resa-smaland-packing-v1/);
});

test("photos support cloud storage facade", () => {
  const photosSource = readFileSync(join(dir, "photos.js"), "utf8");
  assert.match(photosSource, /CloudStore/);
  assert.match(photosSource, /storageMode/);
});

test("supabase setup sql exists", () => {
  const sql = readFileSync(join(dir, "..", "supabase", "setup.sql"), "utf8");
  assert.match(sql, /trip-photos/);
  assert.match(sql, /trip_photos/);
});

test("app supports trip music player", () => {
  const musicSource = readFileSync(join(dir, "music.js"), "utf8");
  assert.match(musicSource, /TripMusic/);
  assert.match(musicSource, /initMusic/);
  assert.match(appSource, /TripMusic/);
});

test("app shows a random Småland quote", () => {
  assert.match(dataSource, /smalandQuotes/);
  assert.match(appSource, /renderQuote/);
});

test("guests can view photos but only signed-in users upload", () => {
  const photosSource = readFileSync(join(dir, "photos.js"), "utf8");
  assert.match(photosSource, /cloud-read/);
  assert.match(photosSource, /publicUrl/);
  const sql = readFileSync(join(dir, "..", "supabase", "setup.sql"), "utf8");
  assert.match(sql, /for select to anon, authenticated/);
  assert.match(sql, /for insert to authenticated/);
});

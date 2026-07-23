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

test("trip data includes must-bring essentials", () => {
  assert.match(dataSource, /mustBring/);
  assert.match(dataSource, /Sertraline/);
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

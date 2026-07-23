const fs = require("fs");
const path = require("path");

const url = process.env.SUPABASE_URL || "";
const anonKey = process.env.SUPABASE_ANON_KEY || "";

const content = `window.SUPABASE_CONFIG = ${JSON.stringify({ url, anonKey }, null, 2)};\n`;

const outPath = path.join(__dirname, "..", "web", "supabase-config.js");
fs.writeFileSync(outPath, content, "utf8");
console.log(`Wrote ${outPath} (configured: ${Boolean(url && anonKey)})`);

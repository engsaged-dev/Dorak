// احجز دورك (Dorak) — daily backup (v6.0), run on the admin's computer (free: no Firebase Blaze plan needed).
// Saves every collection (users, admins, shops + their slots and photos, bookings, reviews, feedback, settings, offers)
// into backups\dorak-backup-YYYY-MM-DD.json in this folder, and keeps the last 30 days.
// Usage:  node backup.js        (or double-click backup.bat). To run it every day by itself see BACKUP-SETUP.md.
// Needs serviceAccount.json in this folder (the same key reset.js uses). KEEP IT SECRET.
"use strict";
const fs = require("fs");
const path = require("path");

const KEY = path.join(__dirname, "serviceAccount.json");
const DIR = path.join(__dirname, "backups");
const KEEP_DAYS = 30;

function plain(v) {            // Firestore values -> JSON (timestamps become ISO text)
  if (v === null || v === undefined) return v;
  if (typeof v.toDate === "function") return { _ts: v.toDate().toISOString() };
  if (Array.isArray(v)) return v.map(plain);
  if (typeof v === "object") { const o = {}; for (const k of Object.keys(v)) o[k] = plain(v[k]); return o; }
  return v;
}
async function dumpCollection(ref) {
  const snap = await ref.get(), out = [];
  for (const d of snap.docs) {
    const row = { _id: d.id, ...plain(d.data()) };
    const subs = await d.ref.listCollections();
    for (const c of subs) row["_" + c.id] = await dumpCollection(c);   // shops/{id}/slots and /photos
    out.push(row);
  }
  return out;
}
async function main() {
  if (!fs.existsSync(KEY)) { console.log("\nserviceAccount.json is missing from this folder. See SETUP.md, step 3.\n"); process.exit(1); }
  let initializeApp, cert, getFirestore;
  try { ({ initializeApp, cert } = require("firebase-admin/app")); ({ getFirestore } = require("firebase-admin/firestore")); }
  catch (e) { console.log("\nfirebase-admin is not installed. Run:  npm install firebase-admin   (SETUP.md, step 2)\n"); process.exit(1); }
  initializeApp({ credential: cert(require(KEY)) });
  const db = getFirestore();
  const now = new Date(), day = now.toISOString().slice(0, 10);
  const out = { app: "Dorak", at: now.toISOString(), collections: {} };
  let count = 0;
  for (const c of await db.listCollections()) { out.collections[c.id] = await dumpCollection(c); count += out.collections[c.id].length; }
  fs.mkdirSync(DIR, { recursive: true });
  const file = path.join(DIR, `dorak-backup-${day}.json`);
  fs.writeFileSync(file, JSON.stringify(out));
  // keep the last 30 days only
  const old = fs.readdirSync(DIR).filter(f => /^dorak-backup-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse().slice(KEEP_DAYS);
  old.forEach(f => fs.unlinkSync(path.join(DIR, f)));
  const kb = Math.round(fs.statSync(file).size / 1024);
  console.log(`\nBackup saved: ${file}\n  ${count} documents (top level) · ${kb} KB${old.length ? ` · removed ${old.length} old file(s)` : ""}\n`);
  fs.appendFileSync(path.join(DIR, "backup-log.txt"), `${now.toISOString()}  OK  ${kb} KB\n`);
}
main().then(() => process.exit(0)).catch(e => {
  console.error("\nBackup FAILED:", e.message || e, "\n");
  try { fs.mkdirSync(DIR, { recursive: true }); fs.appendFileSync(path.join(DIR, "backup-log.txt"), `${new Date().toISOString()}  FAILED  ${e.message || e}\n`); } catch (x) {}
  process.exit(1);
});

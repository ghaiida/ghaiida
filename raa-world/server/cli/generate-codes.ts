// Generates activation codes for selling access (e.g. as digital codes in a Salla store).
// Usage: npm run codes:generate -- 50 "Salla batch Oct"
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { openDb, nowIso } from '../db.ts';

const count = Math.min(Math.max(Number(process.argv[2] ?? 10) || 10, 1), 5000);
const note = process.argv[3] ?? '';
const dataDir = resolve(process.env.DATA_DIR ?? join(process.cwd(), 'data'));
const db = openDb(join(dataDir, 'raa-world.sqlite'));
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const codes: string[] = [];
const insert = db.prepare('INSERT OR IGNORE INTO licenses (code, note, created_at) VALUES (?, ?, ?)');
while (codes.length < count) {
  const bytes = randomBytes(12);
  const raw = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  const code = `RAA-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
  if (insert.run(code, note, nowIso()).changes) codes.push(code);
}
const file = join(dataDir, `codes-${Date.now()}.csv`);
writeFileSync(file, 'code\n' + codes.join('\n') + '\n');
console.log(`Created ${codes.length} codes → ${file}`);

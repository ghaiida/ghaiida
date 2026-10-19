// Sets a new password for a teacher (support use, until email-based reset is added).
// Usage: npm run admin:reset-password -- teacher@example.com NewPassword123
import { join, resolve } from 'node:path';
import { openDb } from '../db.ts';
import { hashPassword } from '../auth.ts';

const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 8) {
  console.error('Usage: npm run admin:reset-password -- <email> <new-password (8+ chars)>');
  process.exit(1);
}
const dataDir = resolve(process.env.DATA_DIR ?? join(process.cwd(), 'data'));
const db = openDb(join(dataDir, 'raa-world.sqlite'));
const r = db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(await hashPassword(password), email.trim().toLowerCase());
if (!r.changes) {
  console.error('No teacher with that email.');
  process.exit(1);
}
db.prepare('DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = ?)').run(email.trim().toLowerCase());
console.log('Password updated; existing sessions signed out.');

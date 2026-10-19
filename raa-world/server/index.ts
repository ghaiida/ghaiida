// Production entry point. Configuration comes from environment variables (see README).
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './db.ts';
import { createApp } from './app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const dataDir = resolve(process.env.DATA_DIR ?? join(process.cwd(), 'data'));
const db = openDb(join(dataDir, 'raa-world.sqlite'));
const publicDir = resolve(process.env.PUBLIC_DIR ?? join(here, 'public'));
const port = Number(process.env.PORT ?? 8787);

const app = createApp({
  db,
  publicDir,
  requireActivationCode: process.env.REQUIRE_ACTIVATION_CODE === 'true',
  secureCookies: process.env.NODE_ENV === 'production',
});

app.listen(port, () => {
  console.log(`RAA WORLD running on http://localhost:${port} (data: ${dataDir})`);
});

// Builds the trial edition and folds JS + CSS into one HTML page body (for hosting as a single file).
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

execSync('npx vite build --config vite.trial.config.ts', { stdio: 'inherit' });
const dir = 'dist-trial/assets';
const files = readdirSync(dir);
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
const favicon = 'data:image/svg+xml;base64,' + readFileSync('client/public/favicon.svg').toString('base64');
const page = `<title>راء وورلد</title>
<link rel="icon" href="${favicon}">
<style>${css.replace(/<\/style/gi, '<\\/style')}</style>
<div id="root" dir="rtl" lang="ar"></div>
<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>
`;
writeFileSync('dist-trial/raa-world-trial.html', page);
console.log(`dist-trial/raa-world-trial.html  ${(page.length / 1024).toFixed(0)} KB`);

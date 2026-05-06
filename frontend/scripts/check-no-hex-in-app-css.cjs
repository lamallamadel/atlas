/**
 * Vérifie l'absence de couleurs hexadécimales dans les CSS applicatifs (components + pages).
 * Aligné sur la Phase 1.2 du plan DS — voir docs/design-system-backlog-phase-1.2.md
 *
 * Usage :
 *   node scripts/check-no-hex-in-app-css.cjs           # exit 0, affiche les violations
 *   node scripts/check-no-hex-in-app-css.cjs --fail    # exit 1 si violation
 */
const fs = require('fs');
const path = require('path');

const APP_ROOT = path.join(__dirname, '..', 'src', 'app');
const SCAN_SUBDIRS = ['components', 'pages'];

const HEX_PATTERN = /#([0-9a-fA-F]{3,8})\b/g;

/** Chemins relatifs à src/app (/) — aucune exception par défaut (pas de tokens en .css). */
const ALLOW_FILES = new Set([]);

function normalizeRel(filePath) {
  return path.relative(APP_ROOT, filePath).split(path.sep).join('/');
}

function walkCss(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkCss(p, out);
    else if (name.endsWith('.css')) out.push(p);
  }
  return out;
}

function collectFiles() {
  const files = [];
  for (const sub of SCAN_SUBDIRS) {
    const dir = path.join(APP_ROOT, sub);
    walkCss(dir, files);
  }
  return files;
}

function main() {
  const fail = process.argv.includes('--fail');
  const files = collectFiles();
  const violations = [];

  for (const file of files) {
    const rel = normalizeRel(file);
    if (ALLOW_FILES.has(rel)) continue;

    const content = fs.readFileSync(file, 'utf8');
    HEX_PATTERN.lastIndex = 0;
    const matches = [];
    let m;
    while ((m = HEX_PATTERN.exec(content)) !== null) {
      matches.push(m[0]);
    }
    if (matches.length) {
      violations.push({ file: rel, samples: [...new Set(matches)].slice(0, 5) });
    }
  }

  if (violations.length === 0) {
    console.log('check-no-hex-in-app-css: OK (aucun hex dans components/pages *.css).');
    process.exit(0);
  }

  console.error(
    `check-no-hex-in-app-css: ${violations.length} fichier(s) avec couleur hex sous components/ ou pages/.`,
  );
  for (const v of violations.slice(0, 80)) {
    console.error(`  - ${v.file}  (${v.samples.join(', ')})`);
  }
  if (violations.length > 80) {
    console.error(`  … et ${violations.length - 80} autre(s).`);
  }
  console.error(
    '\nRemplacer par var(--ds-*) ou migrer vers .scss. Voir design-system-backlog-phase-1.2.md.\n',
  );

  process.exit(fail ? 1 : 0);
}

main();

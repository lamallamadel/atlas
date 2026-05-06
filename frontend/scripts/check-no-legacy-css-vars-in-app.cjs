/**
 * Interdit var(--at-*) et var(--color-*) hors fichiers de pont DS (compatibilité globale).
 *
 * Usage :
 *   node scripts/check-no-legacy-css-vars-in-app.cjs
 *   node scripts/check-no-legacy-css-vars-in-app.cjs --fail
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src', 'app');
const PATTERN = /var\(--(at-|color-)/g;

const ALLOW_FILES = new Set(['design-system/tokens/_ds-semantic.scss']);

function normalizeRel(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function walk(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

function main() {
  const fail = process.argv.includes('--fail');
  const files = walk(ROOT, ['.scss', '.css', '.html']);
  const violations = [];

  for (const file of files) {
    const rel = normalizeRel(file);
    if (ALLOW_FILES.has(rel)) continue;

    const content = fs.readFileSync(file, 'utf8');
    PATTERN.lastIndex = 0;
    const hits = content.match(PATTERN);
    if (hits && hits.length) {
      violations.push({ file: rel, count: hits.length });
    }
  }

  if (violations.length === 0) {
    console.log(
      'check-no-legacy-css-vars-in-app: OK (aucun var(--at-*|--color-*) hors pont DS).',
    );
    process.exit(0);
  }

  console.error(
    `check-no-legacy-css-vars-in-app: ${violations.length} fichier(s) utilisent encore des variables legacy.`,
  );
  for (const v of violations.slice(0, 60)) {
    console.error(`  - ${v.file} (${v.count})`);
  }
  console.error(
    '\nMigrer avec: node scripts/migrate-legacy-vars-to-ds-in-app-styles.cjs\n',
  );
  process.exit(fail ? 1 : 0);
}

main();

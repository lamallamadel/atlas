/**
 * Vérifie l'absence de couleurs hexadécimales dans les SCSS applicatifs.
 * Les hex restent autorisés uniquement dans la source de tokens DS.
 *
 * Usage :
 *   node scripts/check-no-hex-in-app-scss.cjs           # exit 0, affiche les violations
 *   node scripts/check-no-hex-in-app-scss.cjs --fail    # exit 1 si violation
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src', 'app');
const HEX_PATTERN = /#([0-9a-fA-F]{3,8})\b/g;

/** Chemins relatifs normalisés (/) autorisés à contenir des hex */
const ALLOW_FILES = new Set(['design-system/tokens/_ds-tokens.scss']);

function normalizeRel(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function walkScss(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkScss(p, out);
    else if (name.endsWith('.scss')) out.push(p);
  }
  return out;
}

function main() {
  const fail = process.argv.includes('--fail');
  const files = walkScss(ROOT);
  const violations = [];

  for (const file of files) {
    const rel = normalizeRel(file);
    if (ALLOW_FILES.has(rel)) continue;

    const content = fs.readFileSync(file, 'utf8');
    HEX_PATTERN.lastIndex = 0;
    let m;
    const matches = [];
    while ((m = HEX_PATTERN.exec(content)) !== null) {
      matches.push(m[0]);
    }
    if (matches.length) {
      violations.push({ file: rel, samples: [...new Set(matches)].slice(0, 5) });
    }
  }

  if (violations.length === 0) {
    console.log('check-no-hex-in-app-scss: OK (aucun hex hors tokens DS).');
    process.exit(0);
  }

  console.error(
    `check-no-hex-in-app-scss: ${violations.length} fichier(s) avec couleur hex (hors design-system/tokens/_ds-tokens.scss).`,
  );
  for (const v of violations.slice(0, 80)) {
    console.error(`  - ${v.file}  (${v.samples.join(', ')})`);
  }
  if (violations.length > 80) {
    console.error(`  … et ${violations.length - 80} autre(s).`);
  }
  console.error('\nRemplacer par var(--ds-*) ou alias sémantique. Voir design-system-migration-plan.md.\n');

  process.exit(fail ? 1 : 0);
}

main();

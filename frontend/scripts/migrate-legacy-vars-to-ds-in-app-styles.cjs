/**
 * Remplace var(--at-*) et var(--color-*) par var(--ds-*) / color-mix(...) dans le code applicatif.
 * Ne modifie pas design-system/tokens/_ds-semantic.scss ni _ds-tokens.scss (sources des ponts).
 *
 * Usage : node scripts/migrate-legacy-vars-to-ds-in-app-styles.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src', 'app');

const SKIP_FILES = new Set([
  'design-system/tokens/_ds-semantic.scss',
  'design-system/tokens/_ds-tokens.scss',
]);

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

function buildAtReplacements() {
  const pairs = [
    ['--at-color-primary-highlight', '--ds-primary-hl'],
    ['--at-color-primary-active', '--ds-primary-active'],
    ['--at-color-primary-subtle', '--ds-primary-subtle'],
    ['--at-color-primary-hover', '--ds-primary-hover'],
    ['--at-color-success-highlight', '--ds-success-hl'],
    ['--at-color-error-highlight', '--ds-error-hl'],
    ['--at-color-warning-highlight', '--ds-warning-hl'],
    ['--at-color-marine-highlight', '--ds-marine-hl'],
    ['--at-color-marine-light', '--ds-marine-light'],
    ['--at-color-marine-hover', '--ds-marine-hover'],
    ['--at-color-text-inverse', '--ds-text-inverse'],
    ['--at-color-text-muted', '--ds-text-muted'],
    ['--at-color-text-faint', '--ds-text-faint'],
    ['--at-color-surface-offset', '--ds-surface-offset'],
    ['--at-color-surface-dynamic', '--ds-surface-dynamic'],
    ['--at-color-surface-2', '--ds-surface-2'],
    ['--at-color-primary', '--ds-primary'],
    ['--at-color-divider', '--ds-divider'],
    ['--at-color-border', '--ds-border'],
    ['--at-color-text', '--ds-text'],
    ['--at-color-bg', '--ds-bg'],
    ['--at-color-marine', '--ds-marine'],
    ['--at-color-success', '--ds-success'],
    ['--at-color-error', '--ds-error'],
    ['--at-color-warning', '--ds-warning'],
    ['--at-color-surface', '--ds-surface'],
    ['--at-font-display', '--ds-font-display'],
    ['--at-font-body', '--ds-font-body'],
    ['--at-text-3xl', '--ds-text-3xl'],
    ['--at-text-2xl', '--ds-text-2xl'],
    ['--at-text-xl', '--ds-text-xl'],
    ['--at-text-lg', '--ds-text-lg'],
    ['--at-text-base', '--ds-text-base'],
    ['--at-text-sm', '--ds-text-sm'],
    ['--at-text-xs', '--ds-text-xs'],
    ['--at-content-narrow', '--ds-content-narrow'],
    ['--at-content-default', '--ds-content-default'],
    ['--at-content-wide', '--ds-content-wide'],
    ['--at-content-full', '--ds-content-full'],
    ['--at-space-32', '--ds-space-32'],
    ['--at-space-24', '--ds-space-24'],
    ['--at-space-20', '--ds-space-20'],
    ['--at-space-16', '--ds-space-16'],
    ['--at-space-12', '--ds-space-12'],
    ['--at-space-10', '--ds-space-10'],
    ['--at-space-8', '--ds-space-8'],
    ['--at-space-6', '--ds-space-6'],
    ['--at-space-5', '--ds-space-5'],
    ['--at-space-4', '--ds-space-4'],
    ['--at-space-3', '--ds-space-3'],
    ['--at-space-2', '--ds-space-2'],
    ['--at-space-1', '--ds-space-1'],
    ['--at-radius-2xl', '--ds-radius-2xl'],
    ['--at-radius-full', '--ds-radius-pill'],
    ['--at-radius-xl', '--ds-radius-xl'],
    ['--at-radius-lg', '--ds-radius-lg'],
    ['--at-radius-md', '--ds-radius-md'],
    ['--at-radius-sm', '--ds-radius-sm'],
    ['--at-shadow-xl', '--ds-shadow-xl'],
    ['--at-shadow-lg', '--ds-shadow-lg'],
    ['--at-shadow-md', '--ds-shadow-md'],
    ['--at-shadow-sm', '--ds-shadow-sm'],
    ['--at-shadow-xs', '--ds-shadow-xs'],
    ['--at-transition-med', '--ds-transition-med'],
    ['--at-transition-fast', '--ds-transition-fast'],
  ];
  return pairs.sort((a, b) => b[0].length - a[0].length);
}

function buildColorReplacements() {
  const raw = {};

  const neutral = {
    0: '--ds-surface',
    50: '--ds-surface-2',
    100: '--ds-bg',
    200: '--ds-divider',
    300: '--ds-border',
    400: '--ds-text-faint',
    500: '--ds-text-faint',
    600: '--ds-text-muted',
    700: '--ds-text-muted',
    800: '--ds-text',
    900: '--ds-text',
    1000: '--ds-text',
  };
  for (const [n, ds] of Object.entries(neutral)) {
    raw[`--color-neutral-${n}`] = ds;
  }

  const primaryBlue = {
    50: '--ds-marine-hl',
    100: '--ds-marine-hl',
    200: '--ds-marine-hl',
    300: '--ds-marine-light',
    400: '--ds-marine-light',
    500: '--ds-marine',
    600: '--ds-marine',
    700: '--ds-marine-hover',
    800: '--ds-marine-hover',
    900: '--ds-marine-hover',
  };
  for (const [n, ds] of Object.entries(primaryBlue)) {
    raw[`--color-primary-${n}`] = ds;
  }

  const secondary = {
    50: '--ds-primary-subtle',
    100: '--ds-primary-hl',
    200: '--ds-primary-hl',
    300: '--ds-primary',
    400: '--ds-primary',
    500: '--ds-primary',
    600: '--ds-primary-hover',
    700: '--ds-primary-hover',
    800: '--ds-primary-active',
    900: '--ds-primary-active',
  };
  for (const [n, ds] of Object.entries(secondary)) {
    raw[`--color-secondary-${n}`] = ds;
  }

  for (const [n, ds] of Object.entries({
    50: '--ds-success-hl',
    100: '--ds-success-hl',
    200: '--ds-success-hl',
    300: '--ds-success',
    400: '--ds-success',
    500: '--ds-success',
    600: '--ds-success',
    700: '--ds-success',
    800: '--ds-success',
    900: '--ds-success',
  })) {
    raw[`--color-success-${n}`] = ds;
  }

  for (const [n, ds] of Object.entries({
    50: '--ds-error-hl',
    100: '--ds-error-hl',
    200: '--ds-error-hl',
    300: '--ds-error',
    400: '--ds-error',
    500: '--ds-error',
    600: '--ds-error',
    700: '--ds-error',
    800: '--ds-error',
    900: '--ds-error',
  })) {
    raw[`--color-error-${n}`] = ds;
  }

  for (const [n, ds] of Object.entries({
    50: '--ds-warning-hl',
    100: '--ds-warning-hl',
    200: '--ds-warning-hl',
    300: '--ds-warning',
    400: '--ds-warning',
    500: '--ds-warning',
    600: '--ds-warning',
    700: '--ds-warning',
    800: '--ds-warning',
    900: '--ds-warning',
  })) {
    raw[`--color-warning-${n}`] = ds;
  }

  for (const [n, ds] of Object.entries({
    50: '--ds-marine-hl',
    100: '--ds-marine-hl',
    200: '--ds-marine-hl',
    300: '--ds-marine-light',
    400: '--ds-marine-light',
    500: '--ds-marine',
    600: '--ds-marine',
    700: '--ds-marine-light',
    800: '--ds-marine-hover',
    900: '--ds-marine-hover',
  })) {
    raw[`--color-info-${n}`] = ds;
  }

  for (const pct of [10, 20, 30, 40, 50]) {
    raw[`--color-primary-alpha-${pct}`] = null;
  }
  for (const pct of [10, 20]) {
    raw[`--color-neutral-alpha-${pct}`] = null;
  }

  const entries = Object.entries(raw).filter(([k, v]) => v !== null);
  entries.sort((a, b) => b[0].length - a[0].length);
  return entries;
}

function replaceColorVars(content) {
  let out = content;
  for (const [legacyName, dsName] of buildColorReplacements()) {
    const from = `var(${legacyName})`;
    const to =
      dsName.startsWith('color-mix') ? dsName : dsName.startsWith('--') ? `var(${dsName})` : dsName;
    out = out.split(from).join(to);
  }
  for (const pct of [50, 40, 30, 20, 10]) {
    const from = `var(--color-primary-alpha-${pct})`;
    const to = `color-mix(in oklab, var(--ds-marine) ${pct}%, transparent)`;
    out = out.split(from).join(to);
  }
  for (const pct of [20, 10]) {
    const from = `var(--color-neutral-alpha-${pct})`;
    const to = `color-mix(in oklab, var(--ds-text) ${pct}%, transparent)`;
    out = out.split(from).join(to);
  }
  return out;
}

function simplifyColorDsFallbacks(content) {
  return content.replace(
    /var\(--color-[a-zA-Z0-9-]+,\s*(var\(--ds-[a-zA-Z0-9-]+\))\)/g,
    '$1',
  );
}

function simplifyPrimaryAlphaRgba(content) {
  return content.replace(
    /var\(--color-primary-alpha-(\d+),\s*rgba\([^)]+\)\)/g,
    (_, pct) => `color-mix(in oklab, var(--ds-marine) ${pct}%, transparent)`,
  );
}

function replaceAtVars(content) {
  let out = content;
  for (const [fromTok, toTok] of buildAtReplacements()) {
    out = out.split(`var(${fromTok})`).join(`var(${toTok})`);
  }
  return out;
}

function migrateContent(content) {
  let out = content;
  out = simplifyColorDsFallbacks(out);
  out = simplifyPrimaryAlphaRgba(out);
  out = replaceColorVars(out);
  out = replaceAtVars(out);
  out = simplifyColorDsFallbacks(out);
  return out;
}

function main() {
  const files = [...walk(ROOT, ['.scss', '.css']), ...walk(ROOT, ['.html'])];
  let n = 0;
  for (const file of files) {
    const rel = normalizeRel(file);
    if (SKIP_FILES.has(rel)) continue;
    const before = fs.readFileSync(file, 'utf8');
    const after = migrateContent(before);
    if (after !== before) {
      fs.writeFileSync(file, after, 'utf8');
      n++;
      console.log('updated:', rel);
    }
  }
  console.log(`migrate-legacy-vars-to-ds-in-app-styles: ${n} fichier(s) modifié(s).`);
}

main();

#!/usr/bin/env node
/**
 * Mesure les poids livrables principaux après `ng build --configuration production`.
 * Build i18n : fichiers sous dist/frontend/browser/<locale>/.
 * Usage : npm run build:prod && npm run benchmark:bundle
 */
'use strict';

const { readdirSync, statSync, writeFileSync, mkdirSync, existsSync, readFileSync } = require('fs');
const { join } = require('path');

const distBrowser = join(__dirname, '..', 'dist', 'frontend', 'browser');
const distLegacy = join(__dirname, '..', 'dist', 'frontend');

function human(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

/** Trouve le dossier de livrables (Angular i18n = browser/fr|en|es, sinon racine). */
function resolveLocaleRoot(baseBrowser) {
  if (!existsSync(baseBrowser)) return null;
  const preferred = ['fr', 'en', 'es'];
  for (const loc of preferred) {
    const p = join(baseBrowser, loc);
    if (existsSync(p) && statSync(p).isDirectory()) return { root: p, locale: loc };
  }
  const entries = readdirSync(baseBrowser).filter((n) => statSync(join(baseBrowser, n)).isDirectory());
  if (entries.length) return { root: join(baseBrowser, entries[0]), locale: entries[0] };
  return null;
}

function main() {
  let distRoot;
  let distLabel;
  const resolved = resolveLocaleRoot(distBrowser);
  if (resolved) {
    distRoot = resolved.root;
    distLabel = `dist/frontend/browser/${resolved.locale}`;
  } else if (existsSync(distLegacy)) {
    distRoot = distLegacy;
    distLabel = 'dist/frontend';
  }

  if (!distRoot) {
    console.error(`Dossier introuvable. Lancez : npm run build:prod`);
    process.exit(1);
  }

  const files = readdirSync(distRoot);
  let totalJsCss = 0;
  const stats = {
    generatedAt: new Date().toISOString(),
    dist: distLabel,
    locale: resolved?.locale ?? null,
    assets: [],
    totalBytesAllFiles: 0,
    totalBytesJsCss: 0,
  };

  for (const name of files) {
    const p = join(distRoot, name);
    const st = statSync(p);
    if (!st.isFile()) continue;
    const bytes = st.size;
    stats.totalBytesAllFiles += bytes;
    const row = { file: name, bytes, human: human(bytes) };
    stats.assets.push(row);
    const isMap = name.endsWith('.map');
    const isApp = !isMap && (name.endsWith('.js') || name.endsWith('.css'));
    if (isApp) {
      totalJsCss += bytes;
    }
    if (/^main-.*\.js$/.test(name)) stats.mainJs = row;
    if (/^styles-.*\.css$/.test(name)) stats.stylesCss = row;
    if (/^polyfills-.*\.js$/.test(name)) stats.polyfillsJs = row;
  }

  stats.totalBytesJsCss = totalJsCss;

  stats.assets.sort((a, b) => b.bytes - a.bytes);

  const outDir = join(__dirname, '..', 'benchmarks');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'bundle-stats.json');
  writeFileSync(outPath, JSON.stringify(stats, null, 2), 'utf8');

  const baselinePath = join(outDir, 'bundle-baseline-pre-phase6.json');
  let pct = null;
  let pctStyles = null;
  if (existsSync(baselinePath)) {
    try {
      const prev = JSON.parse(readFileSync(baselinePath, 'utf8'));
      const prevTotal = prev.totalBytesJsCss ?? prev.totalBytesAllFiles;
      if (prevTotal > 0) {
        pct = (((prevTotal - totalJsCss) / prevTotal) * 100).toFixed(1);
      }
      const prevSt = prev.stylesCss?.bytes;
      const curSt = stats.stylesCss?.bytes;
      if (prevSt && curSt) {
        pctStyles = (((prevSt - curSt) / prevSt) * 100).toFixed(1);
      }
    } catch {
      /* ignore */
    }
  }

  console.log(`Bundle benchmark → ${outPath}`);
  console.log(`Locale : ${stats.locale ?? 'default'} | Total JS+CSS (hors .map) : ${human(totalJsCss)}`);
  if (stats.stylesCss) console.log(`styles : ${stats.stylesCss.file} — ${stats.stylesCss.human}`);
  if (stats.mainJs) console.log(`main : ${stats.mainJs.file} — ${stats.mainJs.human}`);
  if (pct !== null) console.log(`Δ total JS+CSS vs baseline : ${pct}% (positif = réduction)`);
  if (pctStyles !== null) console.log(`Δ styles vs baseline : ${pctStyles}%`);
}

main();

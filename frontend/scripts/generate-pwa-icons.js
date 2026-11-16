#!/usr/bin/env node
/**
 * Génère toutes les icônes PNG pour le PWA Atlas Immobilier.
 * Aucune image source requise — les icônes sont construites depuis du SVG.
 *
 * Usage : node scripts/generate-pwa-icons.js
 */

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const OUT = path.join(__dirname, '../src/assets/icons');

// ─────────────────────────────────────────────────────────────────
// SVG — icône principale (maison stylisée Atlas)
// ─────────────────────────────────────────────────────────────────
function appIconSvg(size, padding = 0.13) {
  const bg  = '#2c5aa0';
  const fg  = '#ffffff';
  const p   = size * padding;
  const s   = size - p * 2;        // espace disponible
  const cx  = size / 2;
  const cy  = size / 2;

  // toit
  const roofTopY  = cy - s * 0.33;
  const roofBaseY = cy + s * 0.02;
  const roofLX    = cx - s * 0.43;
  const roofRX    = cx + s * 0.43;

  // corps
  const bodyX = cx - s * 0.30;
  const bodyW = s * 0.60;
  const bodyY = roofBaseY;
  const bodyH = s * 0.38;

  // porte
  const doorW = s * 0.17;
  const doorH = s * 0.22;
  const doorX = cx - doorW / 2;
  const doorY = bodyY + bodyH - doorH;
  const doorR = doorW * 0.25;

  // fenêtres
  const winS  = s * 0.11;
  const winY  = bodyY + s * 0.07;
  const winLX = bodyX + s * 0.05;
  const winRX = bodyX + bodyW - s * 0.05 - winS;
  const winR  = winS * 0.15;

  // cheminée
  const chimX = cx + s * 0.13;
  const chimY = roofTopY - s * 0.10;
  const chimW = s * 0.08;
  const chimH = s * 0.15;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="${bg}"/>
  <polygon points="${roofLX},${roofBaseY} ${cx},${roofTopY} ${roofRX},${roofBaseY}" fill="${fg}"/>
  <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" fill="${fg}"/>
  <rect x="${winLX}" y="${winY}" width="${winS}" height="${winS}" rx="${winR}" fill="${bg}" opacity=".65"/>
  <rect x="${winRX}" y="${winY}" width="${winS}" height="${winS}" rx="${winR}" fill="${bg}" opacity=".65"/>
  <rect x="${doorX}" y="${doorY}" width="${doorW}" height="${doorH}" rx="${doorR}" fill="${bg}" opacity=".65"/>
  <rect x="${chimX}" y="${chimY}" width="${chimW}" height="${chimH}" fill="${fg}" opacity=".85"/>
</svg>`;
}

// ─────────────────────────────────────────────────────────────────
// SVG — icônes de raccourcis
// ─────────────────────────────────────────────────────────────────
function shortcutSvg(type) {
  const n  = 96;
  const bg = '#2c5aa0';
  const fg = '#ffffff';
  const r  = n * 0.18;
  const sw = 5.5;

  const shapes = {
    dossier: `
      <rect x="18" y="30" width="60" height="44" rx="6" fill="${fg}"/>
      <path d="M18 38 L18 32 Q18 30 24 30 L42 30 L50 38 Z" fill="${fg}" opacity=".75"/>
      <line x1="28" y1="47" x2="68" y2="47" stroke="${bg}" stroke-width="${sw*.65}" stroke-linecap="round"/>
      <line x1="28" y1="56" x2="62" y2="56" stroke="${bg}" stroke-width="${sw*.65}" stroke-linecap="round"/>
      <line x1="28" y1="65" x2="55" y2="65" stroke="${bg}" stroke-width="${sw*.65}" stroke-linecap="round"/>`,

    messages: `
      <rect x="14" y="22" width="64" height="46" rx="10" fill="${fg}"/>
      <polygon points="22,68 16,80 36,68" fill="${fg}"/>
      <line x1="26" y1="38" x2="70" y2="38" stroke="${bg}" stroke-width="${sw*.7}" stroke-linecap="round"/>
      <line x1="26" y1="48" x2="64" y2="48" stroke="${bg}" stroke-width="${sw*.7}" stroke-linecap="round"/>
      <line x1="26" y1="58" x2="56" y2="58" stroke="${bg}" stroke-width="${sw*.7}" stroke-linecap="round"/>`,

    search: `
      <circle cx="40" cy="40" r="22" fill="none" stroke="${fg}" stroke-width="${sw}"/>
      <circle cx="40" cy="40" r="13" fill="${fg}" opacity=".22"/>
      <line x1="57" y1="57" x2="76" y2="76" stroke="${fg}" stroke-width="${sw*1.4}" stroke-linecap="round"/>`,

    dashboard: `
      <rect x="12" y="12" width="32" height="32" rx="5" fill="${fg}"/>
      <rect x="52" y="12" width="32" height="32" rx="5" fill="${fg}" opacity=".8"/>
      <rect x="12" y="52" width="32" height="32" rx="5" fill="${fg}" opacity=".8"/>
      <rect x="52" y="52" width="32" height="32" rx="5" fill="${fg}" opacity=".55"/>
      <polyline points="18,38 25,26 32,32 42,18" fill="none" stroke="${bg}" stroke-width="${sw*.7}" stroke-linecap="round" stroke-linejoin="round"/>`,
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}" viewBox="0 0 ${n} ${n}">
  <rect width="${n}" height="${n}" rx="${r}" fill="${bg}"/>
  ${shapes[type]}
</svg>`;
}

// ─────────────────────────────────────────────────────────────────
// Génération
// ─────────────────────────────────────────────────────────────────
async function run() {
  fs.mkdirSync(OUT, { recursive: true });

  // Icônes standard
  for (const size of [72, 96, 128, 152, 192, 384, 512]) {
    const svg  = appIconSvg(size, 0.13);
    const dest = path.join(OUT, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(svg)).png().toFile(dest);
    console.log(`✓  icon-${size}x${size}.png`);
  }

  // Icônes maskable (safe zone plus large)
  for (const size of [192, 512]) {
    const svg  = appIconSvg(size, 0.20);
    const dest = path.join(OUT, `maskable-icon-${size}x${size}.png`);
    await sharp(Buffer.from(svg)).png().toFile(dest);
    console.log(`✓  maskable-icon-${size}x${size}.png`);
  }

  // Raccourcis
  for (const type of ['dossier', 'messages', 'search', 'dashboard']) {
    const svg  = shortcutSvg(type);
    const dest = path.join(OUT, `shortcut-${type}.png`);
    await sharp(Buffer.from(svg)).png().toFile(dest);
    console.log(`✓  shortcut-${type}.png`);
  }

  console.log('\n✅  Toutes les icônes ont été générées dans src/assets/icons/');
}

run().catch(err => { console.error(err); process.exit(1); });

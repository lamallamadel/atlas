/**
 * Remplace les couleurs #hex courantes par var(--ds-*) dans components/pages *.css.
 * Usage : node scripts/migrate-hex-to-ds-in-app-css.cjs
 * (script idempotent : relancer met à jour les restes)
 */
const fs = require('fs');
const path = require('path');

const APP_ROOT = path.join(__dirname, '..', 'src', 'app');
const SCAN_SUBDIRS = ['components', 'pages'];

/** Ordre : remplacer les chaînes les plus longues en premier si chevauchement */
const REPLACEMENTS = [
  // 6 hex
  ['#ffffff', 'var(--ds-surface)'],
  ['#FFFFFF', 'var(--ds-surface)'],
  ['#f5f5f5', 'var(--ds-bg)'],
  ['#F5F5F5', 'var(--ds-bg)'],
  ['#fafafa', 'var(--ds-surface-2)'],
  ['#FAFAFA', 'var(--ds-surface-2)'],
  ['#f9f9f9', 'var(--ds-surface-2)'],
  ['#f0f0f0', 'var(--ds-surface-offset)'],
  ['#e0e0e0', 'var(--ds-divider)'],
  ['#E0E0E0', 'var(--ds-divider)'],
  ['#eeeeee', 'var(--ds-divider)'],
  ['#EEEEEE', 'var(--ds-divider)'],
  ['#ddd', 'var(--ds-divider)'],
  ['#DDD', 'var(--ds-divider)'],
  ['#cccccc', 'var(--ds-border)'],
  ['#ccc', 'var(--ds-border)'],
  ['#CCCCCC', 'var(--ds-border)'],
  ['#bbbbbb', 'var(--ds-border)'],
  ['#bbb', 'var(--ds-border)'],
  ['#333333', 'var(--ds-text)'],
  ['#333', 'var(--ds-text)'],
  ['#212121', 'var(--ds-text)'],
  ['#1a202c', 'var(--ds-text)'],
  ['#2d3748', 'var(--ds-text)'],
  ['#2c3e50', 'var(--ds-text)'],
  ['#424242', 'var(--ds-text-muted)'],
  ['#666666', 'var(--ds-text-muted)'],
  ['#666', 'var(--ds-text-muted)'],
  ['#757575', 'var(--ds-text-muted)'],
  ['#616161', 'var(--ds-text-muted)'],
  ['#718096', 'var(--ds-text-muted)'],
  ['#4a5568', 'var(--ds-text-muted)'],
  ['#667781', 'var(--ds-text-muted)'],
  ['#555555', 'var(--ds-text-muted)'],
  ['#555', 'var(--ds-text-muted)'],
  ['#999999', 'var(--ds-text-faint)'],
  ['#999', 'var(--ds-text-faint)'],
  ['#a0aec0', 'var(--ds-text-faint)'],
  ['#cbd5e0', 'var(--ds-text-faint)'],
  ['#bdbdbd', 'var(--ds-text-faint)'],
  ['#9ca3af', 'var(--ds-text-faint)'],
  ['#000000', 'var(--ds-text)'],
  ['#000', 'var(--ds-text)'],
  ['#1976d2', 'var(--ds-marine)'],
  ['#1976D2', 'var(--ds-marine)'],
  ['#2196f3', 'var(--ds-marine)'],
  ['#2196F3', 'var(--ds-marine)'],
  ['#2c5aa0', 'var(--ds-marine)'],
  ['#4299e1', 'var(--ds-marine)'],
  ['#3182ce', 'var(--ds-marine)'],
  ['#0088cc', 'var(--ds-marine)'],
  ['#34b7f1', 'var(--ds-marine-light)'],
  ['#4caf50', 'var(--ds-success)'],
  ['#4CAF50', 'var(--ds-success)'],
  ['#25d366', 'var(--ds-success)'],
  ['#48bb78', 'var(--ds-success)'],
  ['#66bb6a', 'var(--ds-success)'],
  ['#f44336', 'var(--ds-error)'],
  ['#F44336', 'var(--ds-error)'],
  ['#e53e3e', 'var(--ds-error)'],
  ['#ef5350', 'var(--ds-error)'],
  ['#c53030', 'var(--ds-error)'],
  ['#dc2626', 'var(--ds-error)'],
  ['#d32f2f', 'var(--ds-error)'],
  ['#e74c3c', 'var(--ds-error)'],
  ['#ff9800', 'var(--ds-warning)'],
  ['#FF9800', 'var(--ds-warning)'],
  ['#f57c00', 'var(--ds-warning)'],
  ['#ffeaa7', 'var(--ds-warning-hl)'],
  ['#fff3e0', 'var(--ds-warning-hl)'],
  ['#fff3cd', 'var(--ds-warning-hl)'],
  ['#fff8e1', 'var(--ds-warning-hl)'],
  ['#ffeb3b', 'var(--ds-warning-hl)'],
  ['#ffebee', 'var(--ds-error-hl)'],
  ['#e3f2fd', 'var(--ds-marine-hl)'],
  ['#E3F2FD', 'var(--ds-marine-hl)'],
  ['#f7fafc', 'var(--ds-bg)'],
  ['#edf2f7', 'var(--ds-bg)'],
  ['#e2e8f0', 'var(--ds-divider)'],
  ['#fef5e7', 'var(--ds-warning-hl)'],
  ['#ebf8ff', 'var(--ds-marine-hl)'],
  ['#f0fff4', 'var(--ds-success-hl)'],
  ['#fff5f5', 'var(--ds-error-hl)'],
  ['#fee', 'var(--ds-error-hl)'],
  ['#fecaca', 'var(--ds-error-hl)'],
  ['#feb2b2', 'var(--ds-error-hl)'],
  ['#fef2f2', 'var(--ds-error-hl)'],
  ['#991b1b', 'var(--ds-error)'],
  ['#fef3c7', 'var(--ds-warning-hl)'],
  ['#fde68a', 'var(--ds-warning-hl)'],
  ['#78350f', 'var(--ds-warning)'],
  ['#f59e0b', 'var(--ds-warning)'],
  ['#e5e7eb', 'var(--ds-divider)'],
  ['#075e54', 'var(--ds-marine)'],
  ['#128c7e', 'var(--ds-marine-light)'],
  ['#e5ddd5', 'var(--ds-bg)'],
  ['#dcf8c6', 'var(--ds-success-hl)'],
  ['#00a884', 'var(--ds-success)'],
  ['#008c6f', 'var(--ds-success)'],
  ['#d1d7db', 'var(--ds-divider)'],
  ['#f0f2f5', 'var(--ds-bg)'],
  ['#667eea', 'var(--ds-marine-light)'],
  ['#764ba2', 'var(--ds-primary)'],
  ['#ef4444', 'var(--ds-error)'],
  ['#e44538', 'var(--ds-error)'],
  ['#265192', 'var(--ds-marine)'],
  ['#1e1e1e', 'var(--ds-text)'],
  ['#2d2d2d', 'var(--ds-text)'],
  ['#64b5f6', 'var(--ds-marine-light)'],
  ['#e8e8e8', 'var(--ds-divider)'],
  ['#5568d3', 'var(--ds-marine)'],
  ['#c47a3d', 'var(--ds-primary)'],
  ['#1f8b5b', 'var(--ds-success)'],
  ['#f5f7fa', 'var(--ds-bg)'],
  ['#cc8700', 'var(--ds-warning)'],
  ['#c02424', 'var(--ds-error)'],
  ['#0d2c4a', 'var(--ds-marine)'],
  ['#07203a', 'var(--ds-marine-hover)'],
  ['#eee', 'var(--ds-divider)'],
  ['#f8f9fa', 'var(--ds-bg)'],
  ['#e9ecef', 'var(--ds-divider)'],
  ['#dee2e6', 'var(--ds-divider)'],
  ['#495057', 'var(--ds-text-muted)'],
  ['#2c2c2c', 'var(--ds-text)'],
  ['#444444', 'var(--ds-text-muted)'],
  ['#444', 'var(--ds-text-muted)'],
  ['#262626', 'var(--ds-text)'],
  ['#2a2a2a', 'var(--ds-text)'],
  ['#f5f8ff', 'var(--ds-marine-hl)'],
  ['#fff59d', 'var(--ds-warning-hl)'],
  ['#e8eaf6', 'var(--ds-marine-hl)'],
  ['#3f51b5', 'var(--ds-marine)'],
  ['#f3e5f5', 'var(--ds-primary-hl)'],
  ['#7b1fa2', 'var(--ds-primary-hover)'],
  ['#e8f5e9', 'var(--ds-success-hl)'],
  ['#fceae9', 'var(--ds-error-hl)'],
  ['#c8e6c9', 'var(--ds-success-hl)'],
  ['#1b5e20', 'var(--ds-success)'],
  ['#f1f8f4', 'var(--ds-success-hl)'],
  ['#e65100', 'var(--ds-warning)'],
  ['#388e3c', 'var(--ds-success)'],
  ['#9c27b0', 'var(--ds-primary)'],
  ['#8bc34a', 'var(--ds-success)'],
  ['#ffc107', 'var(--ds-warning)'],
  ['#f3f3f3', 'var(--ds-bg)'],
  ['#f8f8f8', 'var(--ds-bg)'],
  ['#aaa', 'var(--ds-text-faint)'],
  ['#34495e', 'var(--ds-text)'],
  ['#fff4e5', 'var(--ds-warning-hl)'],
  ['#f39c12', 'var(--ds-warning)'],
  ['#27ae60', 'var(--ds-success)'],
  ['#856404', 'var(--ds-warning)'],
  ['#42a5f5', 'var(--ds-marine-light)'],
  ['#ecc94b', 'var(--ds-warning)'],
  ['#f56565', 'var(--ds-error)'],
  ['#975a16', 'var(--ds-warning)'],
  ['#2c5282', 'var(--ds-marine)'],
  ['#22543d', 'var(--ds-success)'],
  ['#ffe0e0', 'var(--ds-error-hl)'],
  ['#f1f1f1', 'var(--ds-bg)'],
  ['#c1c1c1', 'var(--ds-border)'],
  ['#a8a8a8', 'var(--ds-text-faint)'],
  ['#c62828', 'var(--ds-error)'],
  ['#3f7bc7', 'var(--ds-marine-light)'],
  ['#4b5563', 'var(--ds-text-muted)'],
  ['#374151', 'var(--ds-text-muted)'],
  ['#a5b4fc', 'var(--ds-marine-hl)'],
  ['#f0f4ff', 'var(--ds-marine-hl)'],
  ['#e8f0fe', 'var(--ds-marine-hl)'],
  ['#c3cfe2', 'var(--ds-divider)'],
  ['#e0c3fc', 'var(--ds-primary-hl)'],
  ['#8ec5fc', 'var(--ds-marine-hl)'],
  ['#777', 'var(--ds-text-muted)'],
  ['#3c3c3c', 'var(--ds-text)'],
  ['#1c1c1c', 'var(--ds-text)'],
  ['#7eb8f7', 'var(--ds-marine-light)'],
  ['#fce4ec', 'var(--ds-error-hl)'],
  ['#c2185b', 'var(--ds-error)'],
  ['#2e7d32', 'var(--ds-success)'],
  ['#7986cb', 'var(--ds-marine-light)'],
  ['#81c784', 'var(--ds-success)'],
];

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

function migrateFile(filePath) {
  let s = fs.readFileSync(filePath, 'utf8');
  const orig = s;
  /* Texte blanc explicite */
  s = s.replace(/\bcolor\s*:\s*#fff\b/gi, 'color: var(--ds-text-inverse)');
  s = s.replace(/\bcolor\s*:\s*#ffffff\b/gi, 'color: var(--ds-text-inverse)');
  for (const [hex, token] of REPLACEMENTS) {
    s = s.split(hex).join(token);
  }
  /* Fonds / surfaces blancs restants (#fff : \b ne colle pas avant #) */
  s = s.replace(/\b#ffffff\b/gi, 'var(--ds-surface)');
  s = s.replace(/(^|[^a-fA-F0-9])#fff\b/gm, '$1var(--ds-surface)');
  /* Retire fallbacks hex dans var(--ds-*, #hex) */
  s = s.replace(/var\((--ds-[a-z0-9-]+),\s*#[0-9a-fA-F]{3,8}\)/gi, 'var($1)');
  if (s !== orig) {
    fs.writeFileSync(filePath, s, 'utf8');
    return true;
  }
  return false;
}

function main() {
  const files = [];
  for (const sub of SCAN_SUBDIRS) {
    walkCss(path.join(APP_ROOT, sub), files);
  }
  let n = 0;
  for (const f of files) {
    if (migrateFile(f)) {
      n++;
      console.log('updated:', path.relative(APP_ROOT, f).split(path.sep).join('/'));
    }
  }
  console.log(`\nmigrate-hex-to-ds-in-app-css: ${n} fichier(s) modifié(s).`);
}

main();

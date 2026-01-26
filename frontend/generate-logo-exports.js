/**
 * Logo Export Generation Script
 * 
 * This script helps generate PNG exports from SVG logo files for:
 * - Favicons (16x16, 32x32, 48x48)
 * - PWA Icons (72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512)
 * - Email Images (200x50, 400x100, 600x150)
 * 
 * Requirements:
 * - ImageMagick installed on system
 * - Node.js
 * 
 * Usage:
 *   node generate-logo-exports.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BRAND_DIR = path.join(__dirname, 'src', 'assets', 'brand');
const ICON_SVG = path.join(BRAND_DIR, 'logo-icon.svg');
const HORIZONTAL_SVG = path.join(BRAND_DIR, 'logo-horizontal.svg');

// Create output directories
const FAVICON_DIR = path.join(BRAND_DIR, 'favicons');
const PWA_DIR = path.join(BRAND_DIR, 'pwa');
const EMAIL_DIR = path.join(BRAND_DIR, 'email');

console.log('🎨 Atlas Immobilier Logo Export Generator\n');

// Create directories
[FAVICON_DIR, PWA_DIR, EMAIL_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${path.relative(__dirname, dir)}`);
  }
});

// Check if ImageMagick is installed
function checkImageMagick() {
  try {
    execSync('convert --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

if (!checkImageMagick()) {
  console.log('\n⚠️  ImageMagick not found!');
  console.log('\nTo generate PNG exports, install ImageMagick:');
  console.log('  Windows: choco install imagemagick');
  console.log('  Mac:     brew install imagemagick');
  console.log('  Linux:   apt-get install imagemagick');
  console.log('\nAlternatively, use online tools:');
  console.log('  - https://realfavicongenerator.net/');
  console.log('  - https://favicon.io/favicon-converter/');
  console.log('  - https://cloudconvert.com/svg-to-png');
  process.exit(0);
}

console.log('\n📦 Generating favicon files...');

// Generate favicons
const faviconSizes = [16, 32, 48];
faviconSizes.forEach(size => {
  const output = path.join(FAVICON_DIR, `favicon-${size}x${size}.png`);
  try {
    execSync(`convert -background none "${ICON_SVG}" -resize ${size}x${size} "${output}"`, { stdio: 'inherit' });
    console.log(`  ✓ favicon-${size}x${size}.png`);
  } catch (error) {
    console.log(`  ✗ Failed to generate favicon-${size}x${size}.png`);
  }
});

// Generate favicon.ico
try {
  const ico16 = path.join(FAVICON_DIR, 'favicon-16x16.png');
  const ico32 = path.join(FAVICON_DIR, 'favicon-32x32.png');
  const ico48 = path.join(FAVICON_DIR, 'favicon-48x48.png');
  const icoOutput = path.join(FAVICON_DIR, 'favicon.ico');
  
  execSync(`convert "${ico16}" "${ico32}" "${ico48}" "${icoOutput}"`, { stdio: 'inherit' });
  console.log(`  ✓ favicon.ico`);
} catch (error) {
  console.log(`  ✗ Failed to generate favicon.ico`);
}

console.log('\n📱 Generating PWA icon files...');

// Generate PWA icons
const pwaSizes = [72, 96, 128, 144, 152, 192, 384, 512];
pwaSizes.forEach(size => {
  const output = path.join(PWA_DIR, `icon-${size}x${size}.png`);
  try {
    execSync(`convert -background none "${ICON_SVG}" -resize ${size}x${size} "${output}"`, { stdio: 'inherit' });
    console.log(`  ✓ icon-${size}x${size}.png`);
  } catch (error) {
    console.log(`  ✗ Failed to generate icon-${size}x${size}.png`);
  }
});

console.log('\n✉️  Generating email logo files...');

// Generate email logos
const emailSizes = [
  { width: 200, height: 50 },
  { width: 400, height: 100 },
  { width: 600, height: 150 }
];

emailSizes.forEach(({ width, height }) => {
  const output = path.join(EMAIL_DIR, `logo-${width}x${height}.png`);
  try {
    execSync(`convert -background none "${HORIZONTAL_SVG}" -resize ${width}x${height} "${output}"`, { stdio: 'inherit' });
    console.log(`  ✓ logo-${width}x${height}.png`);
  } catch (error) {
    console.log(`  ✗ Failed to generate logo-${width}x${height}.png`);
  }
});

console.log('\n✨ Export generation complete!');
console.log('\nGenerated files:');
console.log(`  - Favicons: ${FAVICON_DIR}`);
console.log(`  - PWA Icons: ${PWA_DIR}`);
console.log(`  - Email Logos: ${EMAIL_DIR}`);
console.log('\nNext steps:');
console.log('  1. Review generated PNG files');
console.log('  2. Optimize file sizes using TinyPNG or ImageOptim');
console.log('  3. Update favicon references in index.html');
console.log('  4. Update PWA manifest.json');
console.log('  5. Update email templates with new logo URLs');

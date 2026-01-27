#!/usr/bin/env node

/**
 * PWA Icon Generator
 * 
 * This script helps generate PWA icons from a source image.
 * 
 * Prerequisites:
 * - Install sharp: npm install --save-dev sharp
 * - Prepare a source image (recommended: 1024x1024 PNG)
 * 
 * Usage:
 * node scripts/generate-pwa-icons.js path/to/source-image.png
 */

const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// Maskable icon sizes (with padding for safe zone)
const MASKABLE_SIZES = [
  { size: 192, name: 'maskable-icon-192x192.png', padding: 20 },
  { size: 512, name: 'maskable-icon-512x512.png', padding: 52 }
];

// Shortcut icon sizes
const SHORTCUT_SIZES = [
  { name: 'shortcut-dossier.png', size: 96 },
  { name: 'shortcut-messages.png', size: 96 },
  { name: 'shortcut-search.png', size: 96 },
  { name: 'shortcut-dashboard.png', size: 96 }
];

async function generateIcons(sourcePath) {
  try {
    // Check if sharp is installed
    let sharp;
    try {
      sharp = require('sharp');
    } catch (error) {
      console.error('❌ Error: sharp is not installed');
      console.log('📦 Install sharp with: npm install --save-dev sharp');
      process.exit(1);
    }

    // Check if source image exists
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Error: Source image not found at ${sourcePath}`);
      process.exit(1);
    }

    const outputDir = path.join(__dirname, '..', 'src', 'assets', 'icons');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('🎨 Generating PWA icons...\n');

    // Generate standard icons
    console.log('📱 Standard Icons:');
    for (const icon of ICON_SIZES) {
      await sharp(sourcePath)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(path.join(outputDir, icon.name));
      
      console.log(`  ✓ Generated ${icon.name} (${icon.size}x${icon.size})`);
    }

    // Generate maskable icons
    console.log('\n🎭 Maskable Icons:');
    for (const icon of MASKABLE_SIZES) {
      const canvas = sharp({
        create: {
          width: icon.size,
          height: icon.size,
          channels: 4,
          background: { r: 44, g: 90, b: 160, alpha: 1 } // Theme color
        }
      });

      const contentSize = icon.size - (icon.padding * 2);
      
      const resized = await sharp(sourcePath)
        .resize(contentSize, contentSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      await canvas
        .composite([{
          input: resized,
          top: icon.padding,
          left: icon.padding
        }])
        .png()
        .toFile(path.join(outputDir, icon.name));
      
      console.log(`  ✓ Generated ${icon.name} (${icon.size}x${icon.size})`);
    }

    // Generate shortcut icons (optional - requires separate source images)
    console.log('\n⚡ Shortcut Icons:');
    console.log('  ℹ️  Create separate source images for shortcuts and run:');
    for (const shortcut of SHORTCUT_SIZES) {
      console.log(`     node generate-pwa-icons.js source-${shortcut.name}`);
    }

    console.log('\n✅ All icons generated successfully!');
    console.log(`📁 Output directory: ${outputDir}`);
    
    // Generate favicon
    console.log('\n🌐 Generating favicon...');
    await sharp(sourcePath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(__dirname, '..', 'src', 'favicon.ico'));
    console.log('  ✓ Generated favicon.ico');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

// Check command line arguments
const sourcePath = process.argv[2];

if (!sourcePath) {
  console.log('PWA Icon Generator\n');
  console.log('Usage: node generate-pwa-icons.js <source-image-path>');
  console.log('\nExample: node generate-pwa-icons.js logo-1024x1024.png');
  console.log('\nRecommended source image:');
  console.log('  - Format: PNG');
  console.log('  - Size: 1024x1024 or larger');
  console.log('  - Transparent background preferred');
  process.exit(0);
}

generateIcons(sourcePath);

# PWA Icons

This directory contains all icons required for the Progressive Web App.

## Required Icons

### Standard Icons
- ✅ `icon-72x72.png` (72x72)
- ✅ `icon-96x96.png` (96x96)
- ✅ `icon-128x128.png` (128x128)
- ✅ `icon-144x144.png` (144x144)
- ✅ `icon-152x152.png` (152x152)
- ✅ `icon-192x192.png` (192x192)
- ✅ `icon-384x384.png` (384x384)
- ✅ `icon-512x512.png` (512x512)

### Maskable Icons (for Android Adaptive Icons)
- ✅ `maskable-icon-192x192.png` (192x192)
- ✅ `maskable-icon-512x512.png` (512x512)

### Shortcut Icons
- ✅ `shortcut-dossier.png` (96x96)
- ✅ `shortcut-messages.png` (96x96)
- ✅ `shortcut-search.png` (96x96)
- ✅ `shortcut-dashboard.png` (96x96)

## Generating Icons

### Automated Generation

Use the provided script to generate all icons from a source image:

```bash
# Install sharp (if not already installed)
npm install --save-dev sharp

# Generate icons from source image (1024x1024 recommended)
node scripts/generate-pwa-icons.js path/to/source-logo.png
```

This will generate:
- All standard icons (72x72 to 512x512)
- Maskable icons with safe zone padding
- Favicon

### Manual Creation

If you prefer to create icons manually:

1. **Standard Icons:** Simple resize of logo
2. **Maskable Icons:** Logo centered with 10% safe zone padding on all sides
3. **Shortcut Icons:** 96x96 icons with relevant imagery

### Design Guidelines

**Standard Icons:**
- Format: PNG with transparency
- Background: Transparent or solid color
- Content: Centered, occupies ~80% of canvas
- Padding: ~10% from edges

**Maskable Icons:**
- Format: PNG with solid background
- Background: App theme color (#2c5aa0)
- Content: Centered, occupies ~60% of canvas
- Safe zone: 10% padding from edges
- Purpose: Android adaptive icons

**Shortcut Icons:**
- Format: PNG
- Size: 96x96
- Style: Simple, recognizable icons
- Purpose: App shortcuts on home screen

## Icon Specifications

### Standard Icon Safe Zone

```
┌─────────────────────┐
│     (10% pad)       │
│  ┌──────────────┐  │
│  │              │  │
│  │   Logo here  │  │
│  │   (80% size) │  │
│  │              │  │
│  └──────────────┘  │
│     (10% pad)       │
└─────────────────────┘
```

### Maskable Icon Safe Zone

```
┌─────────────────────┐
│ Theme color bg      │
│  ┌──────────────┐   │
│  │   (10% pad)  │   │
│  │ ┌─────────┐  │   │
│  │ │  Logo   │  │   │
│  │ │ (60%)   │  │   │
│  │ └─────────┘  │   │
│  │   (10% pad)  │   │
│  └──────────────┘   │
└─────────────────────┘
```

## Testing Icons

### Chrome DevTools
1. Open DevTools (F12)
2. Go to Application > Manifest
3. Check "Icons" section
4. Verify all icons load correctly

### Real Device Testing

**Android:**
1. Install PWA
2. Check home screen icon
3. Test adaptive icon (long press)
4. Test shortcuts (long press)

**iOS:**
1. Add to Home Screen
2. Check icon appearance
3. Verify safe area (no cropping)

## Icon Checklist

Before deploying:

- [ ] All 8 standard icon sizes present
- [ ] Both maskable icon sizes present
- [ ] All 4 shortcut icons present
- [ ] Icons have transparent or appropriate background
- [ ] Maskable icons have proper safe zone
- [ ] Icons tested on real devices
- [ ] Icons pass Lighthouse PWA audit
- [ ] Favicon matches main icon

## Icon Testing Tools

- **Maskable.app:** https://maskable.app/ - Test maskable icons
- **PWA Asset Generator:** https://www.pwabuilder.com/imageGenerator
- **Favicon Generator:** https://realfavicongenerator.net/

## Troubleshooting

### Icons not appearing

**Check:**
1. File paths match manifest.json
2. Files exist in src/assets/icons/
3. Angular.json includes assets folder
4. Service worker registered successfully

**Fix:**
```bash
# Verify files exist
ls -la src/assets/icons/

# Check manifest
cat src/manifest.json | grep icons

# Rebuild
npm run build:prod
```

### Blurry icons

**Cause:** Icon upscaled from smaller size

**Fix:** Use source image 1024x1024 or larger

### Cropped icons on Android

**Cause:** Maskable icon safe zone too small

**Fix:** 
- Increase padding to 10-15%
- Test at https://maskable.app/
- Ensure logo fits within safe zone

## Resources

- [PWA Icon Guidelines](https://web.dev/add-manifest/#icons)
- [Maskable Icons](https://web.dev/maskable-icon/)
- [Adaptive Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [iOS Icon Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/)

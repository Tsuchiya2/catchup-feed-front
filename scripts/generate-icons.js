#!/usr/bin/env node

/**
 * PWA Icon Generation Script
 *
 * This script generates PNG icons from the SVG source for PWA manifest.
 * It uses sharp library if available, otherwise provides instructions for manual generation.
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('PWA Icon Generation Script');
  console.log('=========================\n');

  // Check if sharp is available
  let sharp;
  try {
    sharp = require('sharp');
    console.log('✓ Sharp library detected. Generating PNG icons...\n');

    const svgBuffer = fs.readFileSync(svgPath);

    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);
      console.log(`✓ Generated: icon-${size}x${size}.png`);
    }

    console.log('\n✓ All icons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('⚠ Sharp library not found.');
      console.log('\nTo generate icons automatically, install sharp:');
      console.log('  npm install --save-dev sharp\n');
      console.log('Or generate icons manually using an online tool:');
      console.log('  1. Open public/icons/icon.svg in a browser');
      console.log('  2. Use an SVG to PNG converter (e.g., CloudConvert, SVG2PNG)');
      console.log('  3. Generate the following sizes:');
      sizes.forEach((size) => console.log(`     - ${size}x${size} → icon-${size}x${size}.png`));
      console.log('  4. Save all files to public/icons/\n');
    } else {
      console.error('Error generating icons:', error);
      process.exit(1);
    }
  }
}

// Create placeholder PNGs if sharp is not available
function createPlaceholders() {
  console.log('Creating placeholder PNG files...\n');

  // Create a simple 1x1 transparent PNG as placeholder
  const transparentPNG = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]);

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    fs.writeFileSync(outputPath, transparentPNG);
    console.log(`✓ Created placeholder: icon-${size}x${size}.png`);
  }

  console.log('\n⚠ Placeholder icons created.');
  console.log('Please replace them with proper icons before production deployment.\n');
}

// Run the script
generateIcons().catch(() => {
  console.log('\nFalling back to placeholder generation...\n');
  createPlaceholders();
});

/* global __dirname */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const assetsDir = path.join(__dirname, '..', 'assets', 'images');
    const srcPath = path.join(assetsDir, 'puzzle.png');
    if (!fs.existsSync(srcPath)) {
      console.error('Source puzzle.png not found at', srcPath);
      process.exit(1);
    }

    // Create a square canvas (1024x1024) with transparent background
    const size = 1024;
    const destPath = path.join(assetsDir, 'puzzle_safe.png');

    // Resize source image to fit within ~48% of canvas while preserving aspect
    // Slightly larger than before so the foreground appears a bit bigger but still framed
    const maxContent = Math.floor(size * 0.48);
    const resizedBuffer = await sharp(srcPath)
      .resize(maxContent, maxContent, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    // Compose resized image centered on a transparent square canvas
    const canvas = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    }).composite([
      {
        input: resizedBuffer,
        gravity: 'center',
      },
    ]);

    // Optionally add subtle padding/shadow (skipped to keep icon clean)

    // Backup previous generated icon if exists
    if (fs.existsSync(destPath)) {
      const bak = path.join(assetsDir, 'puzzle_safe.bak.png');
      try { fs.copyFileSync(destPath, bak); console.log('Backed up previous icon to', bak); } catch (e) { /* ignore */ }
    }

    await canvas.png().toFile(destPath);
    console.log('Generated', destPath);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

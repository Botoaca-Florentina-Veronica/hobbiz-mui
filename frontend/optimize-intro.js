import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputPath = join(__dirname, 'src/assets/images/intro-web.png');
const outputDir = join(__dirname, 'src/assets/images');

const sizes = [
  { width: 400, suffix: '-400' },
  { width: 800, suffix: '-800' },
  { width: 1200, suffix: '-1200' }
];

console.log('🚀 Starting image optimization...\n');

async function optimize() {
  for (const size of sizes) {
    const outputWebP = join(outputDir, `intro-web${size.suffix}.webp`);
    
    await sharp(inputPath)
      .resize(size.width, null, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ quality: 80, effort: 6 })
      .toFile(outputWebP);
    
    const stats = await sharp(outputWebP).metadata();
    const fileSize = (await import('fs')).statSync(outputWebP).size;
    console.log(`✅ Created: intro-web${size.suffix}.webp`);
    console.log(`   Dimensions: ${stats.width}x${stats.height}`);
    console.log(`   Size: ${(fileSize / 1024).toFixed(2)} KB\n`);
  }
  
  console.log('🎉 Optimization complete!');
}

optimize().catch(console.error);

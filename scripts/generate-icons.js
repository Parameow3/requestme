const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

async function generateIcons() {
  const svg192 = fs.readFileSync(path.join(publicDir, 'icon-192x192.svg'));
  const svg512 = fs.readFileSync(path.join(publicDir, 'icon-512x512.svg'));

  await sharp(svg192)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192x192.png'));
  
  console.log('✓ Created icon-192x192.png');

  await sharp(svg512)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512x512.png'));
  
  console.log('✓ Created icon-512x512.png');

  // Also create apple-touch-icon
  await sharp(svg192)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  
  console.log('✓ Created apple-touch-icon.png');

  // Create favicon
  await sharp(svg192)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  
  console.log('✓ Created favicon.png');

  console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);


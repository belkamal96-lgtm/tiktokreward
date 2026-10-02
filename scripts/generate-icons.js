import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Beautiful TikTok LIVE Rewards icon SVG (512x512)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F1015"/>
      <stop offset="100%" stop-color="#1E202B"/>
    </linearGradient>
    <linearGradient id="neonPink" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF0050"/>
      <stop offset="100%" stop-color="#FE2C55"/>
    </linearGradient>
    <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F2FE"/>
      <stop offset="100%" stop-color="#4FACFE"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Background Card with rounded corners -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  
  <!-- Outer subtle glowing border -->
  <rect x="6" y="6" width="500" height="500" rx="106" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="6"/>

  <!-- Glowing Accent rings -->
  <circle cx="256" cy="256" r="180" fill="none" stroke="url(#neonPink)" stroke-width="4" opacity="0.25"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="url(#neonCyan)" stroke-width="2" opacity="0.3"/>

  <!-- TikTok Note with Cyber Glitch offset layers -->
  <g filter="url(#shadow)" transform="translate(14, 0)">
    <!-- Cyan Shadow Note -->
    <path d="M304 120a100 100 0 0 0 68 28v54a154 154 0 0 1-68-16v134a94 94 0 1 1-94-94c8 0 16 1 24 3v58a36 36 0 1 0 14 29V120h56z" fill="#00F2FE" opacity="0.85" transform="translate(-6, -4)"/>

    <!-- Red/Pink Shadow Note -->
    <path d="M304 120a100 100 0 0 0 68 28v54a154 154 0 0 1-68-16v134a94 94 0 1 1-94-94c8 0 16 1 24 3v58a36 36 0 1 0 14 29V120h56z" fill="#FE2C55" opacity="0.9" transform="translate(6, 4)"/>

    <!-- White Main Note -->
    <path d="M304 120a100 100 0 0 0 68 28v54a154 154 0 0 1-68-16v134a94 94 0 1 1-94-94c8 0 16 1 24 3v58a36 36 0 1 0 14 29V120h56z" fill="#FFFFFF"/>
  </g>

  <!-- Live Rewards Badge at Bottom -->
  <g transform="translate(136, 400)">
    <rect x="0" y="0" width="240" height="48" rx="24" fill="#FE2C55" filter="url(#shadow)"/>
    <text x="120" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">LIVE REWARDS</text>
  </g>
</svg>`;

// Maskable icon with 15% safe zone margin
const maskableSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F1015"/>
      <stop offset="100%" stop-color="#1E202B"/>
    </linearGradient>
  </defs>
  <!-- Full bleed background -->
  <rect width="512" height="512" fill="url(#bgGradM)"/>

  <!-- Centered scaled content within safe zone (80% scale -> centered) -->
  <g transform="translate(51.2, 51.2) scale(0.8)">
    ${svgContent.replace(/<rect width="512"[^>]+>/, '').replace(/<rect x="6"[^>]+>/, '')}
  </g>
</svg>`;

async function generate() {
  console.log('Writing public/icon.svg...');
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

  const svgBuffer = Buffer.from(svgContent);
  const maskableSvgBuffer = Buffer.from(maskableSvgContent);

  console.log('Generating pwa-512x512.png...');
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  console.log('Generating pwa-192x192.png...');
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  console.log('Generating pwa-maskable-512x512.png...');
  await sharp(maskableSvgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('Generating apple-touch-icon.png (180x180)...');
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Generating favicon.ico...');
  await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Icons generated successfully!');
}

generate().catch(console.error);

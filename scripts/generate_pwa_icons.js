const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const LOGO_PATH = path.join(__dirname, '../client/public/shiftaura_logo.png');
const PUBLIC_DIR = path.join(__dirname, '../client/public');

async function generateIcons() {
  console.log('Launching headless browser to render official ShiftAura logo icons...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const logoBase64 = fs.readFileSync(LOGO_PATH).toString('base64');
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  // 1. Generate 192x192 standard icon
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 192, height: 192 });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background: transparent; display: flex; align-items: center; justify-content: center; width: 192px; height: 192px; overflow: hidden;">
        <img src="${logoDataUri}" style="width: 180px; height: 178px; object-fit: contain;" />
      </body>
      </html>
    `);
    const buffer = await page.screenshot({ omitBackground: true });
    fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-192.png'), buffer);
    console.log('Generated icon-192.png');
    await page.close();
  }

  // 2. Generate 512x512 standard icon
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 512, height: 512 });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background: transparent; display: flex; align-items: center; justify-content: center; width: 512px; height: 512px; overflow: hidden;">
        <img src="${logoDataUri}" style="width: 480px; height: 474px; object-fit: contain;" />
      </body>
      </html>
    `);
    const buffer = await page.screenshot({ omitBackground: true });
    fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-512.png'), buffer);
    console.log('Generated icon-512.png');
    await page.close();
  }

  // 3. Generate 512x512 maskable icon (with Android safe zone padding)
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 512, height: 512 });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background: #0D0D0D; display: flex; align-items: center; justify-content: center; width: 512px; height: 512px; overflow: hidden;">
        <img src="${logoDataUri}" style="width: 380px; height: 376px; object-fit: contain;" />
      </body>
      </html>
    `);
    const buffer = await page.screenshot();
    fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-maskable-512.png'), buffer);
    console.log('Generated icon-maskable-512.png');
    await page.close();
  }

  // 4. Generate 96x96 notification badge icon
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 96, height: 96 });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background: transparent; display: flex; align-items: center; justify-content: center; width: 96px; height: 96px; overflow: hidden;">
        <img src="${logoDataUri}" style="width: 88px; height: 87px; object-fit: contain;" />
      </body>
      </html>
    `);
    const buffer = await page.screenshot({ omitBackground: true });
    fs.writeFileSync(path.join(PUBLIC_DIR, 'badge-96.png'), buffer);
    console.log('Generated badge-96.png');
    await page.close();
  }

  await browser.close();
  console.log('All official ShiftAura PWA branding assets generated successfully.');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});

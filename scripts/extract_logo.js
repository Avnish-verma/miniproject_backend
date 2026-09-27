const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../client/public/favicon.svg');
const svg = fs.readFileSync(svgPath, 'utf8');
const match = svg.match(/href="data:image\/png;base64,([^"]+)"/);

if (match) {
  const buffer = Buffer.from(match[1], 'base64');
  const outPath = path.join(__dirname, '../client/public/shiftaura_logo.png');
  fs.writeFileSync(outPath, buffer);
  console.log('Successfully extracted ShiftAura official logo PNG to:', outPath);
  console.log('File size:', buffer.length, 'bytes');
} else {
  console.log('No base64 PNG found in favicon.svg');
}

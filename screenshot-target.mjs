import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const { launch } = require('./node_modules/puppeteer/lib/puppeteer/puppeteer.js');

const url = process.argv[2] || 'http://localhost:3000';

const dir = './temporary screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const existing = fs.readdirSync(dir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(Boolean);
const base = nums.length ? Math.max(...nums) + 1 : 1;

const browser = await launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 3500));

// Get actual section positions via DOM
const positions = await page.evaluate(() => {
  const sections = ['#testimonials', '#bstrip', '#location', 'footer'];
  return sections.reduce((acc, sel) => {
    const el = document.querySelector(sel);
    if (el) acc[sel] = el.getBoundingClientRect().top + window.scrollY;
    return acc;
  }, {});
});
console.log('Section positions:', positions);

const shots = [
  { id: '#testimonials', name: 'testimonials' },
  { id: '#bstrip',       name: 'bookingstrip' },
  { id: '#location',     name: 'location' },
  { id: 'footer',        name: 'footer' },
];

for (const s of shots) {
  const top = positions[s.id] || 0;
  await page.evaluate(y => window.scrollTo({ top: y - 40, behavior: 'instant' }), top);
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: path.join(dir, `screenshot-${base}-${s.name}.png`), fullPage: false });
  console.log(`${s.name} saved at ${top}px`);
}

await browser.close();

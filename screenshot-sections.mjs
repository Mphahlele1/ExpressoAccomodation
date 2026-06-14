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

const sections = [
  { y: 0,    name: 'hero' },
  { y: 1.05, name: 'about' },
  { y: 2.2,  name: 'rooms' },
  { y: 3.5,  name: 'amenities' },
  { y: 4.7,  name: 'gallery' },
  { y: 6.1,  name: 'testimonials' },
  { y: 7.3,  name: 'contact' },
  { y: 8.4,  name: 'footer' },
];

for (const s of sections) {
  await page.evaluate(y => window.scrollTo({ top: window.innerHeight * y, behavior: 'instant' }), s.y);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(dir, `screenshot-${base}-${s.name}.png`), fullPage: false });
  console.log(`${s.name} saved`);
}

await browser.close();

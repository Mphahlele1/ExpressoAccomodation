import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const { launch } = require('./node_modules/puppeteer/lib/puppeteer/puppeteer.js');

const dir = './temporary screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const existing = fs.readdirSync(dir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(Boolean);
const base = nums.length ? Math.max(...nums) + 1 : 1;

const browser = await launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });

// Wait for preloader to animate away (it takes ~3.5s)
await new Promise(r => setTimeout(r, 5000));

const sections = [
  { id: null,            y: 0,    name: 'hero' },
  { id: '#about',        y: null, name: 'about' },
  { id: '#accommodation',y: null, name: 'accommodation' },
  { id: '#amenities',    y: null, name: 'amenities' },
  { id: '#gallery',      y: null, name: 'gallery' },
  { id: '#experiences',  y: null, name: 'experiences' },
  { id: '#testimonials', y: null, name: 'testimonials' },
  { id: '#location',     y: null, name: 'location' },
  { id: 'footer',        y: null, name: 'footer' },
];

for (const s of sections) {
  let scrollY = s.y;
  if (s.id && scrollY === null) {
    scrollY = await page.evaluate(id => {
      const el = document.querySelector(id);
      return el ? el.getBoundingClientRect().top + window.scrollY - 40 : 0;
    }, s.id);
  }
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), scrollY || 0);
  await new Promise(r => setTimeout(r, 700));
  const filename = path.join(dir, `screenshot-${base}-${s.name}.png`);
  await page.screenshot({ path: filename, fullPage: false });
  console.log(`Saved: ${filename}`);
}

await browser.close();
console.log('Done.');

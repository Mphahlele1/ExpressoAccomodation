import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const puppeteer = require('./node_modules/puppeteer/lib/puppeteer/puppeteer.js');
const launch = puppeteer.launch || puppeteer.default?.launch;

const dir = './temporary screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const existing = fs.readdirSync(dir).filter(f => f.match(/^screenshot-\d+/));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(Boolean);
const base = nums.length ? Math.max(...nums) + 1 : 1;

const browser = await launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 5000));

const sections = [
  { id: null,             name: 'hero' },
  { id: '#why',           name: 'why-choose-us' },
  { id: '#about',         name: 'about' },
  { id: '#accommodation', name: 'accommodation' },
  { id: '#gallery',       name: 'gallery' },
  { id: '#experiences',   name: 'experiences' },
  { id: '#booking',       name: 'booking' },
  { id: '#testimonials',  name: 'testimonials' },
  { id: '#location',      name: 'location' },
  { id: 'footer',         name: 'footer' },
];

for (const s of sections) {
  let y = 0;
  if (s.id) {
    y = await page.evaluate(id => {
      const el = document.querySelector(id);
      return el ? Math.max(0, el.getBoundingClientRect().top + window.scrollY - 40) : 0;
    }, s.id);
  }
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
  await new Promise(r => setTimeout(r, 700));
  const file = path.join(dir, `screenshot-${base}-${s.name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log('Saved:', file);
}
await browser.close();
console.log('Done.');

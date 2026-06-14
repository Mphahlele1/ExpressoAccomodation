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
await new Promise(r => setTimeout(r, 3500));

// Gallery position
const galleryTop = await page.evaluate(() => document.querySelector('#gallery').getBoundingClientRect().top + window.scrollY);
await page.evaluate(y => window.scrollTo({ top: y - 20, behavior: 'instant' }), galleryTop);
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: path.join(dir, `screenshot-${base}-gallery-final.png`), fullPage: false });
console.log('Gallery final saved');

// Hero final
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: path.join(dir, `screenshot-${base}-hero-final.png`), fullPage: false });
console.log('Hero final saved');

await browser.close();

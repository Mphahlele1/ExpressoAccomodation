import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const { launch } = require('./node_modules/puppeteer/lib/puppeteer/puppeteer.js');

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || 'full';

const dir = './temporary screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const existing = fs.readdirSync(dir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(Boolean);
const next = nums.length ? Math.max(...nums) + 1 : 1;

const browser = await launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

// Wait for preloader to finish + animations
await new Promise(r => setTimeout(r, 3500));

// Take hero
await page.screenshot({ path: path.join(dir, `screenshot-${next}-${label}-hero.png`), fullPage: false });
console.log('Hero saved');

// Scroll to about
await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.1, behavior: 'instant' }));
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: path.join(dir, `screenshot-${next}-${label}-about.png`), fullPage: false });
console.log('About saved');

// Scroll to rooms
await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 2.4, behavior: 'instant' }));
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: path.join(dir, `screenshot-${next}-${label}-rooms.png`), fullPage: false });
console.log('Rooms saved');

// Scroll to gallery
await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 4.5, behavior: 'instant' }));
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: path.join(dir, `screenshot-${next}-${label}-gallery.png`), fullPage: false });
console.log('Gallery saved');

// Full page
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: path.join(dir, `screenshot-${next}-${label}-fullpage.png`), fullPage: true });
console.log('Full page saved');

await browser.close();

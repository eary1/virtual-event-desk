// Public-site SEO metadata, sitemap and manual Cloudflare Web Analytics beacon.
// This script uses no API keys, external dependencies or network requests.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE_ORIGIN = 'https://virtual-event-desk.virtual-event-deskfox-labworkersdev.workers.dev';
const SITE_NAME = 'バーチャルイベント準備室';
const TOKEN = 'a08c8a453be2432aae2ed9bab5d48ef2'; // Public Cloudflare Web Analytics site token.
const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const BLOCK_START = '<!-- SEO_META_START -->';
const BLOCK_END = '<!-- SEO_META_END -->';
const BEACON_URL = 'https://static.cloudflareinsights.com/beacon.min.js';

const attr = value => String(value).replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[c]);

export function publicPathFromFile(filename) {
  const rel = path.relative(publicDir, filename).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  throw new Error('Unexpected HTML path: ' + rel);
}

function seoBlock(html, pathname) {
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)">/i)?.[1];
  if (!title || !description) throw new Error('Title/description required for ' + pathname);
  const canonical = SITE_ORIGIN + pathname;
  const type = pathname.startsWith('/guides/') && pathname !== '/guides/' ? 'article' : 'website';
  return BLOCK_START +
    '\n<link rel="canonical" href="' + attr(canonical) + '">' +
    '\n<meta property="og:site_name" content="' + attr(SITE_NAME) + '">' +
    '\n<meta property="og:type" content="' + type + '">' +
    '\n<meta property="og:title" content="' + attr(title) + '">' +
    '\n<meta property="og:description" content="' + attr(description) + '">' +
    '\n<meta property="og:url" content="' + attr(canonical) + '">' +
    '\n' + BLOCK_END;
}

export function decorateHtml(html, pathname) {
  // Unit-test render stubs without a <head> are intentionally left untouched.
  if (!html.includes('</head>')) return html;
  if (/<meta\s+name=["']robots["'][^>]*noindex/i.test(html)) return html;
  const block = seoBlock(html, pathname);
  if (html.includes(BLOCK_START) && html.includes(BLOCK_END)) {
    html = html.replace(/<!-- SEO_META_START -->[\s\S]*?<!-- SEO_META_END -->/, block);
  } else {
    html = html.replace('</head>', block + '</head>');
  }
  if (!html.includes(BEACON_URL)) {
    const beacon = '\n<!-- Cloudflare Web Analytics -->' +
      '\n<script type="module" src="' + BEACON_URL + '" data-cf-beacon=' +
      "'{\"token\":\"" + TOKEN + "\"}'" + '></script>' +
      '\n<!-- End Cloudflare Web Analytics -->\n';
    if (!html.includes('</body>')) throw new Error('Missing body close: ' + pathname);
    html = html.replace('</body>', beacon + '</body>');
  }
  const beacons = html.split(BEACON_URL).length - 1;
  if (beacons !== 1) throw new Error('Expected one analytics beacon on ' + pathname);
  return html;
}

export function buildSitemap(paths) {
  const entries = [...new Set(paths)].sort().map(page =>
    '  <url><loc>' + SITE_ORIGIN + page + '</loc></url>'
  ).join('\n');
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries + '\n</urlset>\n';
}

export function buildRobots() {
  return 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE_ORIGIN + '/sitemap.xml\n';
}

async function listHtml(root) {
  const found = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) found.push(...await listHtml(file));
    else if (entry.isFile() && entry.name === 'index.html') found.push(file);
  }
  return found.sort();
}

async function writeOrVerify(file, content, mode) {
  const original = await readFile(file, 'utf8').catch(() => '');
  if (mode === 'build') {
    if (original !== content) await writeFile(file, content);
  } else if (original !== content) {
    throw new Error(path.relative(publicDir, file) + ' is out of date. Run node scripts/seo.mjs build');
  }
}

async function run(mode) {
  if (!['build','verify'].includes(mode)) throw new Error('Usage: node scripts/seo.mjs build|verify');
  const pages = [];
  for (const file of await listHtml(publicDir)) {
    const pathname = publicPathFromFile(file);
    const html = await readFile(file, 'utf8');
    if (/<meta\s+name=["']robots["'][^>]*noindex/i.test(html)) continue;
    pages.push(pathname);
    await writeOrVerify(file, decorateHtml(html, pathname), mode);
  }
  await writeOrVerify(path.join(publicDir,'sitemap.xml'), buildSitemap(pages), mode);
  await writeOrVerify(path.join(publicDir,'robots.txt'), buildRobots(), mode);
  console.log(mode + ' OK: ' + pages.length + ' searchable pages, excluding noindex editor');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv[2] || 'verify').catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

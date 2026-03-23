/**
 * IT-Guru.co.za Website Scraper
 * Scrapes the old website for content migration to IT-Guru.Online
 *
 * Usage: node scripts/scraper.js
 * Output: docs/scraped-content/*.md
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, '..', 'docs', 'scraped-content');

const PAGES = [
  { url: 'https://it-guru.co.za/', slug: 'homepage' },
  { url: 'https://it-guru.co.za/who-are-we.html', slug: 'who-are-we' },
  { url: 'https://it-guru.co.za/what-we-do.html', slug: 'what-we-do' },
  { url: 'https://it-guru.co.za/get-in-touch.html', slug: 'get-in-touch' },
];

async function scrapePage(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.text();
}

function extractTextContent(html) {
  // Strip HTML tags but preserve structure
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '[NAV REMOVED]')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|section|article|h[1-6]|li|ul|ol)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#?\w+;/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractMeta(html) {
  const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] || '';
  const description = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i)?.[1] || '';
  const keywords = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["'](.*?)["']/i)?.[1] || '';
  return { title, description, keywords };
}

function extractLinks(html, baseUrl) {
  const links = [];
  const regex = /<a[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
      try {
        const absoluteUrl = new URL(href, baseUrl).toString();
        links.push({ url: absoluteUrl, text });
      } catch {
        links.push({ url: href, text });
      }
    }
  }
  return links;
}

function extractImages(html, baseUrl) {
  const images = [];
  const regex = /<img[^>]*src=["'](.*?)["'][^>]*(?:alt=["'](.*?)["'])?[^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const src = new URL(match[1], baseUrl).toString();
      images.push({ src, alt: match[2] || '' });
    } catch {
      images.push({ src: match[1], alt: match[2] || '' });
    }
  }
  return images;
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🔍 Scraping IT-Guru.co.za old website...\n');

  for (const page of PAGES) {
    try {
      console.log(`  Fetching: ${page.url}`);
      const html = await scrapePage(page.url);
      const meta = extractMeta(html);
      const text = extractTextContent(html);
      const links = extractLinks(html, page.url);
      const images = extractImages(html, page.url);

      const markdown = [
        `# ${meta.title || page.slug}`,
        `> Scraped from: ${page.url}`,
        `> Date: ${new Date().toISOString()}`,
        '',
        meta.description ? `**Description:** ${meta.description}\n` : '',
        meta.keywords ? `**Keywords:** ${meta.keywords}\n` : '',
        '## Content',
        '',
        text,
        '',
        '## Links Found',
        '',
        ...links.map(l => `- [${l.text || l.url}](${l.url})`),
        '',
        '## Images Found',
        '',
        ...images.map(i => `- ![${i.alt}](${i.src})`),
      ].join('\n');

      const outPath = join(OUTPUT_DIR, `${page.slug}.md`);
      writeFileSync(outPath, markdown, 'utf-8');
      console.log(`  ✅ Saved: ${outPath}`);
    } catch (err) {
      console.error(`  ❌ Error scraping ${page.url}:`, err.message);
    }
  }

  console.log('\n✅ Scraping complete. Files saved to docs/scraped-content/');
}

main();

import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 },
];

function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const response = await fetch(url);
        if (response.ok) return resolve();
      } catch {
        // keep waiting
      }
      if (Date.now() > deadline) return reject(new Error(`Timed out waiting for ${url}`));
      setTimeout(tick, 500);
    };
    tick();
  });
}

function startPreview() {
  const child = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, BROWSER: 'none' },
  });
  child.stdout.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));
  return child;
}

async function inspectViewport(page, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto('http://127.0.0.1:4173/harrier-openclaw-memory-search/', {
    waitUntil: 'networkidle',
  });

  return page.evaluate(({ width, name }) => {
    const tolerance = 1;
    const doc = document.documentElement;
    const body = document.body;
    const viewportWidth = window.innerWidth;
    const documentOverflow = Math.max(doc.scrollWidth, body.scrollWidth) - viewportWidth;

    const overflowing = Array.from(document.body.querySelectorAll('*'))
      .map((el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          className: typeof el.className === 'string' ? el.className : '',
          text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          overflowX: style.overflowX,
        };
      })
      .filter((item) => item.width > 0 && (item.left < -tolerance || item.right > viewportWidth + tolerance))
      .filter((item) => !(item.tag === 'code' || item.tag === 'pre'))
      .filter((item) => {
        const candidates = Array.from(document.body.querySelectorAll('*'));
        const el = candidates.find((candidate) => {
          const rect = candidate.getBoundingClientRect();
          return Math.round(rect.left) === item.left && Math.round(rect.right) === item.right && candidate.tagName.toLowerCase() === item.tag;
        });
        if (!el) return true;
        let parent = el.parentElement;
        while (parent && parent !== document.body) {
          const parentStyle = window.getComputedStyle(parent);
          const parentRect = parent.getBoundingClientRect();
          const parentHasHorizontalScroll = parent.scrollWidth > parent.clientWidth + tolerance;
          const parentClipsX = ['auto', 'scroll', 'hidden', 'clip'].includes(parentStyle.overflowX);
          const parentContained = parentRect.left >= -tolerance && parentRect.right <= viewportWidth + tolerance;
          if (parentHasHorizontalScroll && parentClipsX && parentContained) return false;
          parent = parent.parentElement;
        }
        return true;
      })
      .slice(0, 20);

    const overlapping = [];
    const cards = Array.from(document.querySelectorAll('section, article, li, .rounded-xl, .rounded-2xl'))
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 40 && rect.height > 20);

    for (let i = 0; i < cards.length; i += 1) {
      for (let j = i + 1; j < cards.length; j += 1) {
        const a = cards[i].rect;
        const b = cards[j].rect;
        const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        const overlapArea = xOverlap * yOverlap;
        const smallerArea = Math.min(a.width * a.height, b.width * b.height);
        if (overlapArea > 0 && smallerArea > 0 && overlapArea / smallerArea > 0.85) continue;
        if (overlapArea > 24 && yOverlap > 12 && xOverlap > 12) {
          overlapping.push({
            a: (cards[i].el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
            b: (cards[j].el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
            xOverlap: Math.round(xOverlap),
            yOverlap: Math.round(yOverlap),
          });
        }
      }
    }

    const codeBlocks = Array.from(document.querySelectorAll('pre'))
      .map((pre) => ({
        text: (pre.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
        clientWidth: pre.clientWidth,
        scrollWidth: pre.scrollWidth,
        overflowX: window.getComputedStyle(pre).overflowX,
        right: Math.round(pre.getBoundingClientRect().right),
      }));

    return {
      name,
      width,
      viewportWidth,
      scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth),
      documentOverflow,
      overflowing,
      overlapping: overlapping.slice(0, 10),
      codeBlocks,
    };
  }, { width: viewport.width, name: viewport.name });
}

const preview = startPreview();
let browser;
try {
  await waitForServer('http://127.0.0.1:4173/harrier-openclaw-memory-search/');
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  const results = [];

  for (const viewport of viewports) {
    results.push(await inspectViewport(page, viewport));
  }

  const failures = results.filter((result) => (
    result.documentOverflow > 1 || result.overflowing.length > 0 || result.overlapping.length > 0
  ));

  console.log(JSON.stringify({ ok: failures.length === 0, results }, null, 2));

  if (failures.length > 0) {
    console.error('Responsive smoke failed: overflow or overlap detected.');
    process.exitCode = 1;
  }
} finally {
  if (browser) await browser.close();
  preview.kill('SIGTERM');
}

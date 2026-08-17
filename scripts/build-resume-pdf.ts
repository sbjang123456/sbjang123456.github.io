/**
 * 이력서 전체보기(/resume/all/)를 PDF 한 장으로 굽는다.
 *
 * **`astro build` 다음에 자동으로 돈다** (apps/site의 build 스크립트).
 * 사이트가 정적이라 런타임 서버가 없고, 브라우저에서 만드는 방식(html2canvas
 * 류)은 글자가 이미지로 바뀌어 검색·복사가 안 된다. 대신 e2e에 이미 쓰는
 * 크로미움으로 빌드 시점에 한 번만 인쇄해 dist에 넣어 둔다.
 *
 * 화면 코드에는 손대지 않는다. 다 펼친 상태는 여기서 DOM으로 만들고,
 * 종이 모양은 packages/resume/src/print.css의 @media print가 맡는다.
 */

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const DIST = fileURLToPath(new URL('../apps/site/dist', import.meta.url));
const PAGE = '/resume/all/';
const OUT = join(DIST, 'resume.pdf');

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * dist를 그대로 읽는 최소 정적 서버.
 *
 * `astro preview`를 띄우지 않는 이유는 두 가지다 — 자식 프로세스 뒷정리가
 * 필요 없고, 포트 0으로 열어 이미 떠 있는 개발 서버와 부딪히지 않는다.
 * 빌드 포맷이 directory라 `/resume/all/` → `resume/all/index.html`로 찾는다.
 */
const serveDist = async () => {
  const server = createServer(async (req, res) => {
    const { pathname } = new URL(req.url ?? '/', 'http://localhost');
    const path = decodeURIComponent(pathname);
    const candidates = path.endsWith('/')
      ? [join(DIST, path, 'index.html')]
      : [join(DIST, path), join(DIST, path, 'index.html')];

    for (const file of candidates) {
      // 경로 탈출 차단 — join이 `..`를 접은 뒤에 확인해야 한다
      if (!file.startsWith(DIST + sep)) break;
      const found = await stat(file).catch(() => null);
      if (!found?.isFile()) continue;

      res.writeHead(200, {
        'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      });
      createReadStream(file).pipe(res);
      return;
    }

    res.writeHead(404).end(`not found: ${path}`);
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  return {
    origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
};

/** 브라우저 안에서 돈다 — 접힌 상세를 전부 펼치고 그 안의 이미지까지 받는다. */
const expandAll = async () => {
  const all = [...document.querySelectorAll('details')];

  // 회사 <details>는 name으로 묶인 아코디언이라 속성을 떼야 여럿이 열린다.
  // 먼저 전부 떼고 나서 열어야 열다 말고 서로 닫는 일이 없다.
  for (const details of all) details.removeAttribute('name');
  for (const details of all) details.open = true;

  // 닫혀 있는 동안 loading="lazy" 이미지는 요청조차 되지 않는다
  const images = [...document.images];
  for (const image of images) image.loading = 'eager';

  await Promise.all([
    document.fonts.ready,
    ...images.map((image) => image.decode().catch(() => undefined)),
  ]);

  return { details: all.length, images: images.length };
};

const server = await serveDist();
const browser = await chromium.launch().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.includes("Executable doesn't exist")) throw error;
  throw new Error(
    `PDF를 구우려면 크로미움이 필요하다:\n  pnpm exec playwright install chromium\n\n${message}`,
  );
});

try {
  const page = await browser.newPage();

  // 첫 페인트 전에 도는 테마 스크립트가 CI 머신의 시스템 설정을 따라가지
  // 않도록 못 박는다 — 이력서 PDF는 언제 구워도 흰 종이여야 한다
  await page.addInitScript(() => localStorage.setItem('theme', 'light'));
  await page.goto(`${server.origin}${PAGE}`, { waitUntil: 'load' });

  // 펼침 트랜지션이 인쇄 순간에 진행 중이면 잘린 채로 찍힌다
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important }',
  });

  const { details, images } = await page.evaluate(expandAll);

  await page.pdf({
    path: OUT,
    format: 'A4',
    printBackground: true,
    margin: { top: '12mm', right: '12mm', bottom: '16mm', left: '12mm' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="width:100%;padding:0 12mm;text-align:right;font-size:8px;color:#71717a">
      <span class="pageNumber"></span> / <span class="totalPages"></span>
    </div>`,
  });

  const { size } = await stat(OUT);
  console.log(
    `✓ resume.pdf ← ${PAGE} (상세 ${details}개 · 이미지 ${images}장 · ${(size / 1024 / 1024).toFixed(2)}MB)`,
  );
} finally {
  await browser.close();
  await server.close();
}

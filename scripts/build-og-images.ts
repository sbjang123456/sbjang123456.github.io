/**
 * 링크 미리보기에 쓸 OG 카드를 글마다 한 장씩 굽는다.
 *
 * **`astro build` 다음에 자동으로 돈다** (apps/site의 build 스크립트).
 * 이미 e2e와 이력서 PDF에 쓰는 크로미움을 그대로 빌려 쓰므로 새 의존성이 없다.
 *
 * PDF 스크립트와 다른 점 하나 — 카드는 사이트 페이지가 아니라 아래 템플릿
 * 문자열을 `setContent`로 그린다. `/og/[id]/` 같은 라우트를 만들면 dist에
 * 크롤러가 주워 갈 쓰레기 페이지가 생기고 sitemap에서 도로 빼야 한다.
 * 라우트가 없으니 글 목록도 dist가 아니라 소스 MDX에서 직접 읽는다.
 */

import { mkdir, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { OG_SIZE, SITE } from '../apps/site/src/site.ts';

const CONTENT = fileURLToPath(
  new URL('../apps/site/src/content/retrospect', import.meta.url),
);
const OUT_DIR = fileURLToPath(new URL('../apps/site/dist/og', import.meta.url));

type Card = { file: string; eyebrow: string; title: string; meta: string };

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

/** `key: value` 한 줄을 꺼낸다. 따옴표는 감싼 것만 벗긴다. */
const field = (block: string, key: string, file: string) => {
  const raw = new RegExp(`^${key}:[ \\t]*(.+)$`, 'm').exec(block)?.[1]?.trim();
  if (!raw) throw new Error(`${file}: 프론트매터에 ${key}가 없다`);
  return raw.replace(/^(['"])([\s\S]*)\1$/, '$2');
};

/**
 * 소스 MDX의 프론트매터만 읽는다.
 *
 * 스키마(content.config.ts)가 title·date·description을 필수로 잡아 두므로
 * 여기서 빠진 값을 만나면 빌드가 이미 앞에서 죽었어야 한다 — 그래도 던져서
 * 두부 카드가 조용히 나가는 일은 막는다.
 */
const readPosts = async () => {
  const files = (await readdir(CONTENT))
    .filter((name) => name.endsWith('.mdx'))
    .sort();

  return Promise.all(
    files.map(async (name) => {
      const source = await readFile(join(CONTENT, name), 'utf8');
      const block = FRONTMATTER.exec(source)?.[1];
      if (!block) throw new Error(`${name}: 프론트매터가 없다`);

      return {
        // 글 URL과 카드 파일명은 같은 슬러그를 쓴다 (glob 로더의 id 규칙)
        id: name.replace(/\.mdx$/, ''),
        title: field(block, 'title', name),
        date: field(block, 'date', name).slice(0, 10),
      };
    }),
  );
};

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>]/g, (char) => ENTITIES[char]);

/**
 * 카드 한 장의 마크업.
 *
 * 색은 global.css의 라이트 토큰 값을 그대로 옮겨 적었다. 사이트 CSS를 끌어오면
 * 해시 붙은 Tailwind 산출물 경로에 묶여, 빌드가 바뀔 때마다 카드가 깨진다.
 * 폰트도 시스템 것만 쓴다 — CI(ubuntu)에는 Noto CJK가 깔려 있다.
 */
const markup = ({ eyebrow, title, meta }: Card) => `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <style>
      * { margin: 0; box-sizing: border-box; }
      body {
        width: ${OG_SIZE.width}px;
        height: ${OG_SIZE.height}px;
        background: oklch(1 0 0);
        color: oklch(0.141 0.005 285.823);
        font-family: 'Apple SD Gothic Neo', 'Noto Sans CJK KR', 'Noto Sans KR',
          system-ui, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .card {
        width: 100%;
        height: 100%;
        padding: 72px 80px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        border-bottom: 14px solid oklch(0.141 0.005 285.823);
      }
      .eyebrow, .meta { font-size: 30px; color: oklch(0.552 0.016 285.938); }
      h1 {
        font-size: 76px;
        line-height: 1.24;
        font-weight: 700;
        letter-spacing: -0.03em;
        /* 긴 제목은 두 줄에서 자른다 — 넘치면 카드가 아니라 벽지가 된다 */
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        word-break: keep-all;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <p class="eyebrow">${escapeHtml(eyebrow)}</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="meta">${escapeHtml(meta)}</p>
    </div>
  </body>
</html>`;

const posts = await readPosts();
const eyebrow = `${SITE.name} · 회고`;

const cards: Card[] = [
  // 회고가 아닌 페이지(홈·이력서)가 물려받는 공용 카드
  {
    file: 'default.png',
    eyebrow: SITE.name,
    title: 'Astro 아일랜드 아키텍처 기반 개인 사이트',
    meta: '회고와 이력서',
  },
  {
    file: 'retrospect.png',
    eyebrow,
    title: '회고',
    meta: `글 ${posts.length}개`,
  },
  ...posts.map((post) => ({
    file: `${post.id}.png`,
    eyebrow,
    title: post.title,
    meta: post.date,
  })),
];

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.includes("Executable doesn't exist")) throw error;
  throw new Error(
    `OG 카드를 구우려면 크로미움이 필요하다:\n  pnpm exec playwright install chromium\n\n${message}`,
  );
});

try {
  const page = await browser.newPage({
    viewport: { ...OG_SIZE },
    deviceScaleFactor: 1,
  });

  for (const card of cards) {
    await page.setContent(markup(card), { waitUntil: 'load' });
    // 폰트가 붙기 전에 찍으면 폭이 어긋나 두 줄 자르기가 엉뚱한 데서 걸린다
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await page.screenshot({ path: join(OUT_DIR, card.file), type: 'png' });
  }

  console.log(`✓ og/*.png (카드 ${cards.length}장)`);
} finally {
  await browser.close();
}

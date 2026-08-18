import { beforeAll, describe, expect, it } from 'vitest';
import { createContainer, parse, url } from '../test/container';
import Base from './base.astro';

let container: Awaited<ReturnType<typeof createContainer>>;

const renderAt = async (path: string, props: Record<string, unknown> = {}) => {
  const html = await container.renderToString(Base, {
    request: url(path),
    props,
    partial: false,
    slots: { default: '<p id="slotted">본문</p>' },
  });
  return parse(html);
};

const meta = (doc: ReturnType<typeof parse>, selector: string) =>
  doc.querySelector(selector)?.getAttribute('content');

const jsonLd = (doc: ReturnType<typeof parse>) => {
  const raw = doc.querySelector('script[type="application/ld+json"]');
  return raw ? JSON.parse(raw.textContent ?? '') : null;
};

const currentNavLabels = (doc: ReturnType<typeof parse>) =>
  [...doc.querySelectorAll('[aria-current="page"]')].map((el) =>
    el.textContent?.trim(),
  );

beforeAll(async () => {
  container = await createContainer();
});

describe('base.astro', () => {
  it('슬롯 내용을 main 안에 넣는다', async () => {
    const doc = await renderAt('/');

    expect(doc.querySelector('main #slotted')?.textContent).toBe('본문');
  });

  it('현재 경로의 네비게이션 항목만 aria-current를 갖는다', async () => {
    expect(currentNavLabels(await renderAt('/retrospect/'))).toEqual(['회고']);
    expect(currentNavLabels(await renderAt('/resume/'))).toEqual(['이력서']);
  });

  it('회고 상세 경로도 회고 탭을 현재로 표시한다', async () => {
    const doc = await renderAt('/retrospect/2026-08-11-mfa-scaffolding/');

    expect(currentNavLabels(doc)).toEqual(['회고']);
  });

  it('홈에서는 워드마크만 현재로 표시한다', async () => {
    expect(currentNavLabels(await renderAt('/'))).toEqual(['sbjang']);
  });

  it('title·description props를 메타에 반영한다', async () => {
    const doc = await renderAt('/resume/', {
      title: '이력서 — sbjang',
      description: '프론트엔드 개발자 sbjang의 이력서.',
    });

    expect(doc.querySelector('title')?.textContent).toBe('이력서 — sbjang');
    expect(
      doc.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toBe('프론트엔드 개발자 sbjang의 이력서.');
  });

  it('canonical URL을 site 기준 절대경로로 만든다', async () => {
    const doc = await renderAt('/retrospect/');

    expect(
      doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('https://sbjang123456.github.io/retrospect/');
  });

  it('글 정보를 주면 og:type=article과 BlogPosting JSON-LD를 낸다', async () => {
    const doc = await renderAt('/retrospect/post/', {
      title: '어떤 회고 — sbjang',
      description: '어떤 회고의 요약.',
      image: '/og/post.png',
      article: { publishedAt: new Date('2026-08-11T00:00:00Z') },
    });

    expect(meta(doc, 'meta[property="og:type"]')).toBe('article');
    expect(jsonLd(doc)).toMatchObject({
      '@type': 'BlogPosting',
      // <title>용 꼬리표(— sbjang)는 구조화 데이터에 섞이지 않아야 한다
      headline: '어떤 회고',
      description: '어떤 회고의 요약.',
      datePublished: '2026-08-11T00:00:00.000Z',
      author: { name: '장수빈' },
      url: 'https://sbjang123456.github.io/retrospect/post/',
      image: 'https://sbjang123456.github.io/og/post.png',
      inLanguage: 'ko-KR',
    });
  });

  it('글이 아니면 og:type=website이고 JSON-LD를 넣지 않는다', async () => {
    const doc = await renderAt('/resume/', { title: '이력서 — sbjang' });

    expect(meta(doc, 'meta[property="og:type"]')).toBe('website');
    expect(jsonLd(doc)).toBeNull();
  });

  it('상대경로로 준 카드도 og:image는 절대 URL로 낸다', async () => {
    // 크롤러 상당수가 상대경로 og:image를 그냥 버린다
    const doc = await renderAt('/retrospect/post/', { image: '/og/post.png' });

    expect(meta(doc, 'meta[property="og:image"]')).toBe(
      'https://sbjang123456.github.io/og/post.png',
    );
    expect(meta(doc, 'meta[name="twitter:image"]')).toBe(
      'https://sbjang123456.github.io/og/post.png',
    );
  });

  it('description이 없으면 사이트 기본값을 og·twitter까지 함께 쓴다', async () => {
    const doc = await renderAt('/');
    const fallback =
      'Astro 아일랜드 아키텍처 기반 개인 사이트 — 회고와 이력서.';

    expect(meta(doc, 'meta[name="description"]')).toBe(fallback);
    expect(meta(doc, 'meta[property="og:description"]')).toBe(fallback);
    expect(meta(doc, 'meta[name="twitter:description"]')).toBe(fallback);
    expect(meta(doc, 'meta[property="og:image"]')).toBe(
      'https://sbjang123456.github.io/og/default.png',
    );
  });

  it('og:url을 canonical과 같은 주소로 맞춘다', async () => {
    const doc = await renderAt('/retrospect/');

    expect(meta(doc, 'meta[property="og:url"]')).toBe(
      doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    );
  });

  it('RSS를 자동 발견할 수 있게 alternate 링크를 건다', async () => {
    const doc = await renderAt('/');

    expect(
      doc
        .querySelector('link[rel="alternate"][type="application/rss+xml"]')
        ?.getAttribute('href'),
    ).toBe('/rss.xml');
  });

  it('테마 토글을 Svelte 아일랜드로 하이드레이션한다', async () => {
    const doc = await renderAt('/');
    const island = doc.querySelector('astro-island');

    expect(island?.getAttribute('renderer-url')).toContain('svelte');
    expect(island?.getAttribute('client')).toBe('load');
  });

  it('첫 페인트 전에 테마를 정하는 인라인 스크립트를 head에 넣는다', async () => {
    const doc = await renderAt('/');
    const inline = [...doc.querySelectorAll('head script:not([src])')]
      .map((el) => el.textContent ?? '')
      .join('');

    // FOUC 방지: localStorage 값이 없으면 OS 설정을 따른다
    expect(inline).toContain("localStorage.getItem('theme')");
    expect(inline).toContain('prefers-color-scheme: dark');
    expect(inline).toContain('document.documentElement.dataset.theme');
  });
});

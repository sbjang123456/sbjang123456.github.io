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

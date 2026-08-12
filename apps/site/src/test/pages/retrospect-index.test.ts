import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createContainer, parse, url } from '../container';

// 콘텐츠 레이어(.astro/data-store.json)는 dev 서버만 채운다 — build도 만들지
// 않는다. 그래서 컨테이너에서 진짜 getCollection을 쓰면 글이 0개로 나온다.
// 대신 고정 데이터를 주입해 페이지 자체의 로직(정렬·직렬화·마크업)만 본다.
// 실제 MDX가 실제로 렌더되는지는 E2E가 본다.
//
// 일부러 뒤섞인 순서로 준다 — 페이지가 정렬을 하는지 확인하려면 필요하다.
const FIXTURES = [
  { id: 'middle', data: { title: '두 번째 글', date: new Date('2026-08-10') } },
  { id: 'oldest', data: { title: '세 번째 글', date: new Date('2026-08-09') } },
  { id: 'newest', data: { title: '첫 번째 글', date: new Date('2026-08-11') } },
];

vi.mock('astro:content', () => ({
  getCollection: async () => FIXTURES,
}));

let doc: ReturnType<typeof parse>;

beforeAll(async () => {
  const { default: RetrospectIndex } = await import(
    '../../pages/retrospect/index.astro'
  );
  const container = await createContainer();
  const html = await container.renderToString(RetrospectIndex, {
    request: url('/retrospect/'),
    partial: false,
  });
  doc = parse(html);
});

/** 이 페이지엔 아일랜드가 둘(헤더의 Svelte 토글 + React 검색창)이라 골라야 한다. */
const island = (framework: 'react' | 'svelte') =>
  [...doc.querySelectorAll('astro-island')].find((el) =>
    el.getAttribute('renderer-url')?.includes(framework),
  );

const postLinks = () =>
  [...doc.querySelectorAll('main ul a[href^="/retrospect/"]')] as {
    textContent: string | null;
    getAttribute(name: string): string | null;
    querySelector(
      sel: string,
    ): { getAttribute(n: string): string | null } | null;
  }[];

describe('retrospect/index.astro', () => {
  it('컬렉션의 글을 모두 렌더한다', () => {
    expect(postLinks()).toHaveLength(FIXTURES.length);
  });

  it('최신순으로 정렬한다', () => {
    const dates = postLinks().map((a) =>
      a.querySelector('time')?.getAttribute('datetime'),
    );

    expect(dates).toEqual([
      '2026-08-11T00:00:00.000Z',
      '2026-08-10T00:00:00.000Z',
      '2026-08-09T00:00:00.000Z',
    ]);
  });

  it('링크가 트레일링 슬래시를 포함한 슬러그 URL을 가리킨다', () => {
    expect(postLinks().map((a) => a.getAttribute('href'))).toEqual([
      '/retrospect/newest/',
      '/retrospect/middle/',
      '/retrospect/oldest/',
    ]);
  });

  it('React 검색창과 Svelte 테마 토글이 한 페이지에 공존한다', () => {
    // 아일랜드 아키텍처의 핵심 성질 — 두 런타임이 각자 독립적으로 하이드레이션된다
    expect(island('react')?.getAttribute('client')).toBe('load');
    expect(island('svelte')?.getAttribute('client')).toBe('load');
  });

  it('아일랜드에 넘기는 props가 직렬화 가능하다', () => {
    // README의 계약: Date 객체가 아니라 문자열이어야 한다.
    const raw = island('react')?.getAttribute('props');
    expect(raw).toBeTruthy();

    // Astro는 [타입태그, 값] 쌍으로 직렬화한다. 태그 0은 평범한 값,
    // 1은 배열 — Date였다면 다른 태그가 붙는다.
    const props = JSON.parse(raw as string);
    const [arrayTag, posts] = props.posts as [
      number,
      [number, Record<string, [number, string]>][],
    ];

    expect(arrayTag).toBe(1);
    expect(posts).toHaveLength(FIXTURES.length);

    for (const [, post] of posts) {
      expect(post.date[0]).toBe(0);
      expect(post.date[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(post.url[1]).toMatch(/^\/retrospect\/[^/]+\/$/);
    }
  });

  it('글 개수를 머리말에 보여준다', () => {
    expect(doc.querySelector('header p')?.textContent).toBe(
      `글 ${FIXTURES.length}개`,
    );
  });
});

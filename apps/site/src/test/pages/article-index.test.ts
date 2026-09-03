import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createContainer, parse, url } from '../container';

// 회고 목록 테스트와 같은 이유로 astro:content를 고정 데이터로 바꾼다 — 콘텐츠
// 레이어(.astro/data-store.json)는 dev 서버만 채우기 때문이다. 여기서는
// 페이지 자체의 로직(정렬·직렬화·마크업)만 보고, 실제 MDX는 E2E가 본다.
//
// 일부러 뒤섞인 순서로 준다 — 페이지가 정렬을 하는지 확인하려면 필요하다.
const FIXTURES = [
  {
    id: 'middle',
    data: {
      title: '두 번째 글',
      date: new Date('2026-09-02'),
      description: '두 번째 요약',
      source: 'https://example.com/second',
      publisher: '두 번째 매체',
    },
  },
  {
    id: 'oldest',
    data: {
      title: '세 번째 글',
      date: new Date('2026-09-01'),
      description: '세 번째 요약',
      source: 'https://example.com/third',
      publisher: '세 번째 매체',
    },
  },
  {
    id: 'newest',
    data: {
      title: '첫 번째 글',
      date: new Date('2026-09-03'),
      description: '첫 번째 요약',
      source: 'https://example.com/first',
      publisher: '첫 번째 매체',
    },
  },
];

vi.mock('astro:content', () => ({
  getCollection: async () => FIXTURES,
}));

let doc: ReturnType<typeof parse>;

beforeAll(async () => {
  const { default: ArticleIndex } = await import(
    '../../pages/article/index.astro'
  );
  const container = await createContainer();
  const html = await container.renderToString(ArticleIndex, {
    request: url('/article/'),
    partial: false,
  });
  doc = parse(html);
});

/** 이 페이지엔 아일랜드가 둘(헤더의 Svelte 토글 + React 검색창)이라 골라야 한다. */
const island = (framework: 'react' | 'svelte') =>
  [...doc.querySelectorAll('astro-island')].find((el) =>
    el.getAttribute('renderer-url')?.includes(framework),
  );

const articleLinks = () =>
  [...doc.querySelectorAll('main ul a[href^="/article/"]')] as {
    textContent: string | null;
    getAttribute(name: string): string | null;
    querySelector(
      sel: string,
    ): { getAttribute(n: string): string | null } | null;
  }[];

describe('article/index.astro', () => {
  it('컬렉션의 글을 모두 렌더한다', () => {
    expect(articleLinks()).toHaveLength(FIXTURES.length);
  });

  it('최신순으로 정렬한다', () => {
    const dates = articleLinks().map((a) =>
      a.querySelector('time')?.getAttribute('datetime'),
    );

    expect(dates).toEqual([
      '2026-09-03T00:00:00.000Z',
      '2026-09-02T00:00:00.000Z',
      '2026-09-01T00:00:00.000Z',
    ]);
  });

  it('링크가 트레일링 슬래시를 포함한 슬러그 URL을 가리킨다', () => {
    expect(articleLinks().map((a) => a.getAttribute('href'))).toEqual([
      '/article/newest/',
      '/article/middle/',
      '/article/oldest/',
    ]);
  });

  it('출처와 한 줄 요약을 목록에서 바로 보여준다', () => {
    // 제목이 원문 제목과 같을 수 있어, 어디 글인지와 무슨 내용인지가 목록에 있어야 한다
    const first = articleLinks()[0].textContent ?? '';

    expect(first).toContain('첫 번째 매체');
    expect(first).toContain('첫 번째 요약');
  });

  it('React 검색창과 Svelte 테마 토글이 한 페이지에 공존한다', () => {
    expect(island('react')?.getAttribute('client')).toBe('load');
    expect(island('svelte')?.getAttribute('client')).toBe('load');
  });

  it('아일랜드에 넘기는 props가 직렬화 가능하고 아티클 URL을 가리킨다', () => {
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
    // 검색창 라벨은 회고와 갈라 둔다 — 같은 아일랜드를 두 목록이 나눠 쓴다
    expect(props.label).toEqual([0, '아티클 검색']);

    for (const [, post] of posts) {
      expect(post.date[0]).toBe(0);
      expect(post.date[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(post.url[1]).toMatch(/^\/article\/[^/]+\/$/);
    }
  });

  it('글 개수를 머리말에 보여준다', () => {
    // 사이트 헤더도 <header>라 본문 안의 것으로 좁혀야 한다
    expect(doc.querySelector('main header')?.textContent).toContain(
      `글 ${FIXTURES.length}개`,
    );
  });
});

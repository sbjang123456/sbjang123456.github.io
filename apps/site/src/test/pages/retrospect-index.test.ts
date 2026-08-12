import { beforeAll, describe, expect, it } from 'vitest';
import RetrospectIndex from '../../pages/retrospect/index.astro';
import { createContainer, parse, url } from '../container';

let doc: ReturnType<typeof parse>;

beforeAll(async () => {
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
    getAttribute(name: string): string | null;
    querySelector(
      sel: string,
    ): { getAttribute(n: string): string | null } | null;
  }[];

describe('retrospect/index.astro', () => {
  it('콘텐츠 컬렉션의 글을 모두 렌더한다', () => {
    expect(postLinks().length).toBeGreaterThan(0);
  });

  it('글을 최신순으로 정렬한다', () => {
    const dates = postLinks().map(
      (a) => a.querySelector('time')?.getAttribute('datetime') ?? '',
    );

    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('링크가 트레일링 슬래시를 포함한 슬러그 URL을 가리킨다', () => {
    for (const a of postLinks()) {
      expect(a.getAttribute('href')).toMatch(/^\/retrospect\/[^/]+\/$/);
    }
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
    expect(posts.length).toBe(postLinks().length);

    for (const [, post] of posts) {
      expect(post.date[0]).toBe(0);
      expect(post.date[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(post.url[1]).toMatch(/^\/retrospect\/[^/]+\/$/);
    }
  });

  it('글 개수를 머리말에 보여준다', () => {
    expect(doc.querySelector('header p')?.textContent).toBe(
      `글 ${postLinks().length}개`,
    );
  });
});

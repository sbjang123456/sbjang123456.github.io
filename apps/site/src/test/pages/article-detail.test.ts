import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createContainer, parse, url } from '../container';

// 회고 상세 테스트와 같은 이유로 astro:content를 고정 데이터로 바꾼다.
// 여기서 보는 건 상세가 원문 링크를 안전하게 내고 SEO 메타를 실제로 내보내는지다.
const ARTICLE = {
  id: '2026-07-28-mcp-specification',
  data: {
    title: 'MCP 2026-07-28 스펙: 세션을 버리고 무상태 프로토콜이 되었다',
    date: new Date('2026-07-28T00:00:00Z'),
    description: 'MCP 2026-07-28 스펙 발표 글을 정리했다.',
    source: 'https://blog.modelcontextprotocol.io/posts/2026-07-28/',
    publisher: 'Model Context Protocol Blog',
  },
};

vi.mock('astro:content', async () => ({
  getCollection: async () => [ARTICLE],
  render: async () => ({
    Content: (await import('../fixtures/post-body.astro')).default,
  }),
}));

let doc: ReturnType<typeof parse>;

beforeAll(async () => {
  const { default: ArticleDetail } = await import(
    '../../pages/article/[id].astro'
  );
  const container = await createContainer();
  const html = await container.renderToString(ArticleDetail, {
    request: url(`/article/${ARTICLE.id}/`),
    props: { article: ARTICLE },
    partial: false,
  });
  doc = parse(html);
});

const meta = (selector: string) =>
  doc.querySelector(selector)?.getAttribute('content');

describe('article/[id].astro', () => {
  it('글 제목·출처·본문을 렌더한다', () => {
    expect(doc.querySelector('article h1')?.textContent).toBe(
      ARTICLE.data.title,
    );
    expect(doc.querySelector('article header')?.textContent).toContain(
      ARTICLE.data.publisher,
    );
    expect(doc.querySelector('article .prose')?.textContent).toContain(
      '본문 문단',
    );
  });

  it('원문 링크를 새 탭으로 열고 opener를 끊는다', () => {
    const link = doc.querySelector('article header a[href^="http"]');

    expect(link?.getAttribute('href')).toBe(ARTICLE.data.source);
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toContain('noopener');
    expect(link?.textContent).toContain('원문 보기');
  });

  it('목록으로 돌아가는 링크가 아티클 목록을 가리킨다', () => {
    expect(doc.querySelector('main a[href="/article/"]')).not.toBeNull();
  });

  it('frontmatter의 description을 메타 설명으로 내보낸다', () => {
    expect(meta('meta[name="description"]')).toBe(ARTICLE.data.description);
    expect(meta('meta[property="og:description"]')).toBe(
      ARTICLE.data.description,
    );
  });

  it('아티클 전용 OG 카드를 절대 URL로 가리킨다', () => {
    // 회고 카드(/og/{id}.png)와 파일명이 겹치지 않도록 하위 디렉터리를 쓴다
    expect(meta('meta[property="og:image"]')).toBe(
      `https://sbjang123456.github.io/og/article/${ARTICLE.id}.png`,
    );
  });

  it('글 페이지임을 og:type과 BlogPosting JSON-LD로 알린다', () => {
    expect(meta('meta[property="og:type"]')).toBe('article');

    const raw = doc.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(raw?.textContent ?? '')).toMatchObject({
      '@type': 'BlogPosting',
      headline: ARTICLE.data.title,
      description: ARTICLE.data.description,
      datePublished: '2026-07-28T00:00:00.000Z',
      url: `https://sbjang123456.github.io/article/${ARTICLE.id}/`,
    });
  });

  it('제목 뒤에 사이트 이름을 붙여 <title>을 만든다', () => {
    expect(doc.querySelector('title')?.textContent).toBe(
      `${ARTICLE.data.title} — sbjang`,
    );
  });
});

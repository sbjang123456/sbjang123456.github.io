import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createContainer, parse, url } from '../container';

// 목록 테스트와 같은 이유로 astro:content를 고정 데이터로 바꾼다 — 콘텐츠
// 레이어(.astro/data-store.json)는 dev 서버만 채우기 때문이다.
// 여기서 보는 건 상세가 SEO 메타를 실제로 내보내는지다. 예전엔 title만 넘겨
// 모든 글이 사이트 기본 설명을 공유했다 (구글이 중복 스니펫으로 보는 모양).
const POST = {
  id: '2026-08-11-mfa-scaffolding',
  data: {
    title: '런타임 MFA 스캐폴딩을 시작하며',
    date: new Date('2026-08-11T00:00:00Z'),
    description:
      '런타임 MFA를 직접 구성해 보고 원자적 배포와 맞지 않음을 알았다.',
  },
};

vi.mock('astro:content', async () => ({
  getCollection: async () => [POST],
  render: async () => ({
    Content: (await import('../fixtures/post-body.astro')).default,
  }),
}));

let doc: ReturnType<typeof parse>;

beforeAll(async () => {
  const { default: RetrospectDetail } = await import(
    '../../pages/retrospect/[id].astro'
  );
  const container = await createContainer();
  const html = await container.renderToString(RetrospectDetail, {
    request: url(`/retrospect/${POST.id}/`),
    props: { post: POST },
    partial: false,
  });
  doc = parse(html);
});

const meta = (selector: string) =>
  doc.querySelector(selector)?.getAttribute('content');

describe('retrospect/[id].astro', () => {
  it('글 제목과 본문을 렌더한다', () => {
    expect(doc.querySelector('article h1')?.textContent).toBe(POST.data.title);
    expect(doc.querySelector('article .prose')?.textContent).toContain(
      '본문 문단',
    );
  });

  it('frontmatter의 description을 메타 설명으로 내보낸다', () => {
    expect(meta('meta[name="description"]')).toBe(POST.data.description);
    expect(meta('meta[property="og:description"]')).toBe(POST.data.description);
  });

  it('글마다 다른 OG 카드를 절대 URL로 가리킨다', () => {
    expect(meta('meta[property="og:image"]')).toBe(
      `https://sbjang123456.github.io/og/${POST.id}.png`,
    );
  });

  it('글 페이지임을 og:type과 BlogPosting JSON-LD로 알린다', () => {
    expect(meta('meta[property="og:type"]')).toBe('article');

    const raw = doc.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(raw?.textContent ?? '')).toMatchObject({
      '@type': 'BlogPosting',
      headline: POST.data.title,
      description: POST.data.description,
      datePublished: '2026-08-11T00:00:00.000Z',
      url: `https://sbjang123456.github.io/retrospect/${POST.id}/`,
    });
  });

  it('제목 뒤에 사이트 이름을 붙여 <title>을 만든다', () => {
    expect(doc.querySelector('title')?.textContent).toBe(
      `${POST.data.title} — sbjang`,
    );
  });
});

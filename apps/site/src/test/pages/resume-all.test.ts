import { resume } from '@site/resume/data';
import { projects } from '@site/resume/projects';
import { beforeAll, describe, expect, it } from 'vitest';
import ResumeAllPage from '../../pages/resume/all.astro';
import { createContainer, parse, url } from '../container';

// 전체보기는 경력만 담는다 — 회사를 열면 그 회사 프로젝트 상세가 나온다.
let doc: ReturnType<typeof parse>;
let html: string;

beforeAll(async () => {
  const container = await createContainer();
  html = await container.renderToString(ResumeAllPage, {
    request: url('/resume/all/'),
    partial: false,
  });
  doc = parse(html);
});

const companies = () => [...doc.querySelectorAll('main ol > li > details')];

describe('resume-all.astro', () => {
  it('회사를 최신순으로 나열한다', () => {
    expect(companies().map((el) => el.getAttribute('id'))).toEqual(
      resume.careers.map((career) => career.slug),
    );
  });

  it('회사마다 기간과 역할을 함께 보여준다', () => {
    const first = companies()[0];

    expect(
      first?.querySelector('[data-slot="career-org"]')?.textContent,
    ).toContain(resume.careers[0]?.org);
    expect(first?.textContent).toContain('재직 중');
  });

  it('한 번에 하나만 열리도록 회사끼리 묶는다', () => {
    // <details name>은 브라우저가 아코디언으로 다뤄 준다 — JS가 필요 없다
    for (const company of companies()) {
      expect(company.getAttribute('name')).toBe('career');
    }
  });

  it('프로젝트 상세가 회사 안에 슬러그 id로 들어 있다', () => {
    const ids = [...doc.querySelectorAll('main details details')].map((el) =>
      el.getAttribute('id'),
    );

    expect(ids).toEqual(projects.map((project) => project.slug));
  });

  it('상세 본문이 닫힌 상태에서도 HTML에 있다', () => {
    // <details>를 고른 이유 — 크롤러·Cmd+F·인쇄·JS 미사용자가 모두 본다
    const detail = doc.querySelector('main details details');

    expect(detail?.hasAttribute('open')).toBe(false);
    expect(detail?.textContent).toContain('업무');
  });

  it('이름만 있는 프로젝트는 없다', () => {
    expect(doc.querySelectorAll('[data-project-name]')).toHaveLength(
      projects.length,
    );
  });

  it('소개·스택·학력 카드는 랜딩에만 둔다', () => {
    const titles = [...doc.querySelectorAll('[data-slot="card-title"]')].map(
      (el) => el.textContent?.trim(),
    );

    expect(titles).toEqual([]);
  });

  it('이력서로 돌아가는 링크를 둔다', () => {
    expect(doc.querySelector('main a')?.getAttribute('href')).toBe('/resume/');
  });

  it('이미지마다 alt와 크기가 있다', () => {
    const images = [...doc.querySelectorAll('img')];

    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      expect(image.getAttribute('alt')?.trim()).toBeTruthy();
      // width/height가 없으면 이미지가 늦게 와서 본문이 밀린다 (CLS)
      expect(Number(image.getAttribute('width'))).toBeGreaterThan(0);
      expect(Number(image.getAttribute('height'))).toBeGreaterThan(0);
      // 빌드에선 해시 붙은 /_astro/… 이고 여기선 ?origWidth=… 가 달린다
      expect(image.getAttribute('src')).toMatch(/\.webp(\?|$)/);
      expect(image.getAttribute('loading')).toBe('lazy');
    }
  });

  it('아일랜드는 헤더의 테마 토글 하나뿐이다', () => {
    // 상세를 통째로 실어도 클라이언트 JS는 0바이트로 남는다
    const islands = doc.querySelectorAll('astro-island');

    expect(islands).toHaveLength(1);
    expect(islands[0]?.getAttribute('renderer-url')).toContain('svelte');
  });

  it('Notion 내부 식별자가 화면에 새지 않는다', () => {
    expect(html).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
    );
    expect(html).not.toContain('‣');
  });
});

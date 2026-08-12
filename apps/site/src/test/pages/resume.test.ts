import type { Resume } from '@site/resume/data';
import { resume } from '@site/resume/data';
import { beforeAll, describe, expect, it } from 'vitest';
import ResumePage from '../../pages/resume.astro';
import { createContainer, parse, url } from '../container';

// 워크스페이스 패키지(@site/resume)의 .astro가 앱을 통해 실제로 렌더되는지 본다.
// 데이터 자체의 로직(formatPeriod 등)은 packages/resume의 유닛 테스트가 맡는다.
let doc: ReturnType<typeof parse>;

beforeAll(async () => {
  const container = await createContainer();
  const html = await container.renderToString(ResumePage, {
    request: url('/resume/'),
    partial: false,
  });
  doc = parse(html);
});

const cardTitles = () =>
  [...doc.querySelectorAll('[data-slot="card-title"]')].map((el) =>
    el.textContent?.trim(),
  );

const cardContent = (index: number) =>
  doc.querySelectorAll('[data-slot="card-content"]')[index];

describe('resume.astro', () => {
  it('패키지의 섹션들을 순서대로 렌더한다', () => {
    expect(cardTitles()).toEqual(['소개', '경력', '기술 스택', '학력 · 자격']);
  });

  it('머리말에 이름과 직군을 보여준다', () => {
    expect(doc.querySelector('main header h1')?.textContent).toBe('이력서');
    expect(doc.querySelector('main header p')?.textContent?.trim()).toContain(
      '프론트엔드 개발자',
    );
  });

  it('머리말의 연락처를 링크로 건다', () => {
    const links = [...doc.querySelectorAll('main header a')];

    expect(links.map((el) => el.getAttribute('href'))).toEqual(
      resume.contacts.map((contact) => contact.href),
    );
  });

  it('소개를 문단으로 나눠 보여준다', () => {
    expect(cardContent(0)?.querySelectorAll('p')).toHaveLength(
      resume.summary.length,
    );
  });

  it('경력을 최신순으로 나열하고 기간을 붙인다', () => {
    const orgs = [...(cardContent(1)?.querySelectorAll('ol > li h3') ?? [])];

    expect(orgs).toHaveLength(resume.careers.length);
    expect(orgs[0]?.textContent).toContain(resume.careers[0]?.org);
    expect(cardContent(1)?.textContent).toContain('재직 중');
  });

  it('경력마다 프로젝트를 함께 보여준다', () => {
    const projects = resume.careers.flatMap((career) => career.projects);

    expect(
      cardContent(1)?.querySelectorAll('[data-slot="projects"] li'),
    ).toHaveLength(projects.length);
  });

  it('스택을 분류별로 나눠 보여준다', () => {
    const groups = doc.querySelectorAll('dl dt');

    expect(groups.length).toBeGreaterThan(0);
    expect([...groups].map((el) => el.textContent?.trim())).toContain(
      '프레임워크',
    );
  });

  it('학력·자격을 항목마다 기간과 함께 보여준다', () => {
    const items = [...(cardContent(3)?.querySelectorAll('li') ?? [])];

    expect(items).toHaveLength(resume.background.length);
    expect(items[0]?.textContent).toContain(resume.background[0]?.title);
    expect(items[0]?.textContent).toContain(resume.background[0]?.period);
  });

  it('아일랜드는 헤더의 테마 토글 하나뿐이다', () => {
    // 이력서는 순수 정적 — 클라이언트 JS가 늘어나면 알아챈다
    const islands = doc.querySelectorAll('astro-island');

    expect(islands).toHaveLength(1);
    expect(islands[0]?.getAttribute('renderer-url')).toContain('svelte');
  });
});

// 타입이 실제로 노출되는지 확인 (컴파일 타임 검증)
const _typeCheck: Resume['stack'] = [];

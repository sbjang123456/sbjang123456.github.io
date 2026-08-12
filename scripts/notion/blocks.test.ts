import { describe, expect, it } from 'vitest';
import fixture from './__fixtures__/page-chunk.json';
import {
  type BlockMap,
  block,
  links,
  pageMentions,
  plain,
  toProject,
} from './blocks.ts';

/**
 * 픽스처는 실제 `loadPageChunk` 응답에서 닿는 블록만 잘라 낸 것이다
 * (파서가 읽는 `id/type/properties/content`만 남겼다). 다섯 페이지가
 * 각각 다른 함정을 하나씩 갖고 있어 골랐다 — 아래 id 주석 참고.
 */
const map = fixture as unknown as BlockMap;

/** 신한항업 "Projects" 콜아웃 — 페이지 멘션(`["p", id]`)이 사는 유일한 자리. */
const CALLOUT = '57d16704-c27c-47ee-ac8a-360ae63a89bd';
/** 4단 중첩 불릿 · code · image 2장 · 불릿 안에 들어간 표. */
const ERP = '63d1c3b3-a764-4a16-8b12-f0df8b1306d6';
/** 헤딩과 이미지가 불릿의 자식으로 잘못 들어간 페이지. */
const HOISTED = '309a76d3-c2cf-4376-8dba-8be0e9dfebad';
/** 링크 멘션(`lm`) — 본문에는 "‣" 한 글자로만 온다. */
const MENTION = 'dc13fe0b-8872-4fed-af09-c40d81307a78';
/** 북마크 2개 · Notion 자동 링크 오탐(`http://Asp.net`) · 헤딩 앞 불릿. */
const BOOKMARKS = 'cbd27d06-1c62-4d2f-93ef-a1ea2b3e10c5';

const convert = (pageId: string, name: string, slug: string) =>
  toProject({ map, pageId, name, org: 'test-org', slug });

const flatten = (nodes: { text: string; children?: unknown[] }[]): string[] =>
  nodes.flatMap((node) => [
    node.text,
    ...flatten((node.children ?? []) as typeof nodes),
  ]);

describe('block()', () => {
  it('레코드의 value.value 이중 중첩을 벗긴다', () => {
    expect(block(map, ERP)?.type).toBe('page');
  });

  it('권한 없는 레코드(role: none)는 undefined로 넘긴다', () => {
    // 안쪽 value가 아예 없다. 벗기다 터지면 임포트 전체가 죽는다.
    const denied = Object.keys(map).find((id) => !map[id]?.value?.value);

    expect(denied).toBeDefined();
    expect(block(map, denied as string)).toBeUndefined();
  });

  it('없는 id는 undefined다', () => {
    expect(block(map, '없는-id')).toBeUndefined();
  });
});

describe('pageMentions()', () => {
  it('페이지 멘션을 문서 순서대로 걷는다', () => {
    const found = pageMentions(map, CALLOUT);

    expect(found).toHaveLength(3);
    for (const id of found) expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('links()', () => {
  it('Notion이 스킴 없는 토큰을 자동 링크한 오탐은 버린다', () => {
    // "Asp.net" 같은 낱말에 Notion이 http:// 를 붙인다 — 그대로 옮기면
    // 존재하지 않는 호스트로 나가는 링크가 화면에 생긴다.
    expect(links([['Asp.net', [['a', 'http://Asp.net']]]])).toEqual([]);
  });

  it('진짜 링크는 남긴다', () => {
    expect(links([['뉴스', [['a', 'https://example.com/a']]]])).toEqual([
      { label: '뉴스', href: 'https://example.com/a' },
    ]);
  });

  it('링크 멘션은 제목을 라벨로 삼는다', () => {
    const rich = [
      ['‣', [['lm', { href: 'https://example.com', title: '어떤 시스템' }]]],
    ] as Parameters<typeof links>[0];

    expect(links(rich)).toEqual([
      { label: '어떤 시스템', href: 'https://example.com' },
    ]);
  });
});

describe('toProject() — ERP 페이지', () => {
  const { project, images } = convert(ERP, 'ERP 디자인 시스템 개발', 'erp');

  it('첫 문단을 요약으로 뽑는다', () => {
    expect(project.summary).toBe(
      'ERP 개발팀의 UI 표준을 위한 디자인 시스템 개발',
    );
  });

  it('헤딩마다 섹션을 끊는다', () => {
    expect(project.sections.map((section) => section.heading)).toEqual([
      '업무',
      '작업 결과물',
      'vite 환경 변경으로 변경',
    ]);
  });

  it('중첩 불릿을 4단까지 잃지 않는다', () => {
    const tasks = project.sections[0]?.blocks.flatMap((b) =>
      b.kind === 'tasks' ? b.items : [],
    );

    expect(flatten(tasks ?? [])).toContain('barrel index 사용여부 → 사용');
  });

  it('코드 블록은 언어와 본문을 그대로 옮긴다', () => {
    const code = project.sections
      .flatMap((section) => section.blocks)
      .find((b) => b.kind === 'code');

    expect(code).toMatchObject({ language: 'Shell' });
    expect(code?.kind === 'code' && code.code).toContain('erp-design-system');
  });

  it('이미지는 슬러그로 번호 매긴 파일명을 받는다', () => {
    const files = project.sections
      .flatMap((section) => section.blocks)
      .flatMap((b) => (b.kind === 'image' ? [b.file] : []));

    expect(files).toEqual(['erp-1.webp', 'erp-2.webp']);
    expect(images.map((image) => image.file)).toEqual(files);
    for (const image of images) expect(image.source).toMatch(/^https:\/\//);
  });

  it('표는 옮기지 않는다', () => {
    const kinds = new Set(
      project.sections.flatMap((section) => section.blocks.map((b) => b.kind)),
    );

    expect([...kinds].sort()).toEqual(['code', 'image', 'tasks', 'text']);
  });
});

describe('toProject() — 불릿에 끌려들어간 블록', () => {
  const { project } = convert(HOISTED, '홈퍼니싱 시공 PC/모바일 운영', 'home');

  it('불릿 자식으로 잘못 들어간 헤딩도 섹션이 된다', () => {
    // Notion에서 들여쓰기가 어긋난 페이지다. 불릿 트리만 보면
    // "작업 결과물" 절이 통째로 사라진다.
    expect(project.sections.map((section) => section.heading)).toEqual([
      '업무',
      '작업 결과물',
    ]);
  });

  it('그 아래 이미지도 함께 끌어올린다', () => {
    const blocks = project.sections[1]?.blocks ?? [];

    expect(blocks).toEqual([
      { kind: 'image', file: 'home-1.webp', alt: 'PC 시스템 운영' },
    ]);
  });
});

describe('toProject() — 링크 멘션', () => {
  const { project } = convert(
    MENTION,
    '한샘몰 디자인 시스템 운영 및 개발',
    'mall',
  );

  it('"‣" 한 글자를 남기지 않고 링크로 바꾼다', () => {
    const texts = project.sections.flatMap((section) =>
      section.blocks.flatMap((b) => (b.kind === 'text' ? [b] : [])),
    );

    expect(JSON.stringify(project)).not.toContain('‣');
    expect(texts[0]).toEqual({
      kind: 'text',
      text: '',
      links: [
        {
          label: '@storybook/cli - Storybook',
          href: 'https://res.remodeling.hanssem.com/design-system/pc/storybook/index.html?path=/docs/docs-intro--docs',
        },
      ],
    });
  });
});

describe('toProject() — 북마크와 헤딩 앞 본문', () => {
  const { project } = convert(BOOKMARKS, 'T-GIS 2018', 'tgis');

  it('북마크를 프로젝트 링크로 모은다', () => {
    expect(project.links).toHaveLength(2);
    for (const link of project.links ?? []) {
      expect(link.href).toMatch(/^https:\/\/tgis\.eseoul\.go\.kr/);
      expect(link.label).not.toBe('');
    }
  });

  it('헤딩보다 앞선 내용은 제목 없는 섹션에 담는다', () => {
    expect(project.sections[0]?.heading).toBe('');
    expect(project.sections[0]?.blocks[0]?.kind).toBe('tasks');
  });

  it('자동 링크 오탐이 본문에 남지 않는다', () => {
    expect(JSON.stringify(project)).toContain('Asp.net');
    expect(JSON.stringify(project)).not.toContain('http://Asp.net');
  });
});

describe('plain()', () => {
  it('서식은 버리고 글자만 잇는다', () => {
    expect(plain([['a'], ['b', [['c']]], ['c']])).toBe('abc');
  });

  it('리치 텍스트가 없으면 빈 문자열이다', () => {
    expect(plain(undefined)).toBe('');
  });
});

/**
 * Notion recordMap → `Project` 정규화. 순수 함수만 둔다 (fetch·fs 없음).
 *
 * 조용히 내용을 뭉개는 자리라 `blocks.test.ts`가 커밋된 픽스처로 지킨다.
 */

import type {
  Project,
  ProjectBlock,
  ProjectSection,
  TaskNode,
} from '../../packages/resume/src/projects/types.ts';

type Link = { label: string; href: string };

/** 어노테이션. `["a", href]` `["lm", {href,title}]` `["c"]` `["b"]` 등. */
type Annotation = [string, ...unknown[]];

/** Notion 리치 텍스트: `[[글자, 어노테이션[]?], …]`. */
export type RichText = Array<[string, Annotation[]?]>;

export type NotionBlock = {
  id: string;
  type: string;
  properties?: Record<string, RichText>;
  content?: string[];
  format?: Record<string, unknown>;
};

/**
 * loadPageChunk의 `recordMap.block`.
 *
 * 레코드가 `value.value`로 이중 중첩된다 — 바깥 `value`는 `{role, value}`
 * 래퍼다. 권한이 없는 레코드(`role: "none"`)는 안쪽 `value`가 없다.
 */
export type BlockMap = Record<
  string,
  { value?: { role?: string; value?: NotionBlock } }
>;

export type PendingImage = {
  blockId: string;
  /** S3 원본 URL. 직접 열면 403이라 프록시를 거쳐야 한다. */
  source: string;
  /** 저장될 파일명 (`<slug>-<n>.webp`). */
  file: string;
};

export const block = (map: BlockMap, id: string): NotionBlock | undefined =>
  map[id]?.value?.value;

/** 리치 텍스트를 평문으로. 굵게·기울임·인라인 코드는 버린다. */
export const plain = (rich: RichText | undefined): string =>
  Array.isArray(rich) ? rich.map((segment) => segment[0]).join('') : '';

const annotations = (rich: RichText | undefined): Annotation[] =>
  Array.isArray(rich)
    ? rich.flatMap((segment) => segment[1] ?? []).filter(Array.isArray)
    : [];

/**
 * Notion이 스킴 없는 토큰(`README.md`, `Asp.net`)을 자동 링크한 오탐인가.
 *
 * 자동 링크는 href가 정확히 `http://` + 보이는 글자다. 진짜 링크로 옮기면
 * 존재하지 않는 호스트로 나가는 링크가 화면에 생긴다.
 */
const isAutoLink = (text: string, href: string) => href === `http://${text}`;

/** 텍스트에 딸린 링크. `a`(인라인 링크)와 `lm`(링크 멘션)을 함께 걷는다. */
export function links(rich: RichText | undefined): Link[] {
  if (!Array.isArray(rich)) return [];

  const found: Link[] = [];
  for (const [text, marks] of rich) {
    for (const mark of marks ?? []) {
      if (mark[0] === 'a') {
        const href = String(mark[1] ?? '');
        if (href && !isAutoLink(text, href)) found.push({ label: text, href });
      }
      if (mark[0] === 'lm') {
        const mention = mark[1] as { href?: string; title?: string };
        if (mention?.href) {
          found.push({
            label: mention.title?.trim() || mention.href,
            href: mention.href,
          });
        }
      }
    }
  }
  return found;
}

/** 링크 멘션은 본문에 "‣" 한 글자로만 온다 — 평문으로 남기면 의미가 없다. */
const MENTION_GLYPH = '‣';

const stripMentions = (text: string) =>
  text.split(MENTION_GLYPH).join('').trim();

/** 페이지 멘션(`["p", pageId]`)을 문서 순서대로 걷는다. */
export function pageMentions(map: BlockMap, rootId: string): string[] {
  const found: string[] = [];

  const walk = (id: string) => {
    const node = block(map, id);
    if (!node) return;
    for (const mark of annotations(node.properties?.title)) {
      if (mark[0] === 'p') found.push(String(mark[1]));
    }
    for (const child of node.content ?? []) walk(child);
  };

  walk(rootId);
  return found;
}

export const pageTitle = (map: BlockMap, id: string): string =>
  plain(block(map, id)?.properties?.title).trim();

const HEADINGS = new Set(['header', 'sub_header', 'sub_sub_header']);

/** 불릿 하나와 그 아래 불릿들. 불릿이 아닌 자식은 `hoist`가 따로 걷는다. */
function toTask(map: BlockMap, id: string): TaskNode {
  const node = block(map, id);
  const title = node?.properties?.title;
  const children = (node?.content ?? [])
    .filter((child) => block(map, child)?.type === 'bulleted_list')
    .map((child) => toTask(map, child));
  const found = links(title);

  return {
    text: stripMentions(plain(title)),
    ...(found.length ? { links: found } : {}),
    ...(children.length ? { children } : {}),
  };
}

/**
 * 불릿 아래에 잘못 딸려 들어간 블록들을 문서 순서대로 끌어올린다.
 *
 * Notion에서 들여쓰기가 어긋나면 헤딩·이미지·북마크가 불릿의 자식이 된다
 * (실제로 "홈퍼니싱 시공"의 `작업 결과물` 절 전체가 그렇다). 불릿 트리에만
 * 눈을 두면 그 내용이 통째로 사라지므로, 불릿이 아닌 자손은 본문으로 옮긴다.
 */
function hoist(map: BlockMap, id: string): string[] {
  const found: string[] = [];

  for (const child of block(map, id)?.content ?? []) {
    if (block(map, child)?.type === 'bulleted_list')
      found.push(...hoist(map, child));
    else found.push(child);
  }
  return found;
}

const bookmarkLink = (node: NotionBlock): Link | null => {
  const href = node.properties?.link?.[0]?.[0];
  if (!href) return null;

  const label =
    plain(node.properties?.title).trim() ||
    URL.parse(href)?.hostname ||
    '관련 링크';
  return { label, href };
};

/**
 * 프로젝트 페이지 하나를 `Project`로 옮긴다.
 *
 * 최상위 블록만 순회한다 — 중첩은 불릿 트리에서만 의미가 있다. 섹션은
 * 헤딩(`sub_header`/`sub_sub_header`)마다 끊고, 헤딩보다 앞선 내용은
 * 제목 없는 섹션에 담는다(5개 페이지가 실제로 그렇다).
 * 표는 옮기지 않는다 — 유일한 표(빌드 속도 비교)는 바로 뒤 문장이 결론을 담는다.
 */
export function toProject(input: {
  map: BlockMap;
  pageId: string;
  /** data.ts의 이름. Notion 제목과 띄어쓰기가 다를 수 있어 넘겨받는다. */
  name: string;
  org: string;
  slug: string;
}): { project: Project; images: PendingImage[] } {
  const { map, pageId, name, org, slug } = input;
  const page = block(map, pageId);
  if (!page) throw new Error(`${name}: 페이지 블록을 읽을 수 없다 (${pageId})`);

  const sections: ProjectSection[] = [];
  const images: PendingImage[] = [];
  const projectLinks: Link[] = [];
  let summary = '';
  let note: string | undefined;
  let current: ProjectSection = { heading: '', blocks: [] };

  const push = (item: ProjectBlock) => {
    const last = current.blocks.at(-1);
    if (item.kind === 'tasks' && last?.kind === 'tasks') {
      last.items.push(...item.items);
      return;
    }
    current.blocks.push(item);
  };

  const closeSection = () => {
    if (current.heading || current.blocks.length) sections.push(current);
  };

  const queue = [...(page.content ?? [])];
  while (queue.length) {
    const id = queue.shift() as string;
    const node = block(map, id);
    if (!node) continue;
    const title = node.properties?.title;
    const text = plain(title).trim();

    if (HEADINGS.has(node.type)) {
      closeSection();
      current = { heading: text, blocks: [] };
      continue;
    }

    switch (node.type) {
      case 'text': {
        const found = links(title);
        const body = stripMentions(text);
        // 첫 문장은 요약으로 뽑아 접힌 <summary>에 함께 보인다
        if (!summary && body && !sections.length && !current.blocks.length) {
          summary = body;
          break;
        }
        if (body || found.length) {
          push({
            kind: 'text',
            text: body,
            ...(found.length ? { links: found } : {}),
          });
        }
        break;
      }
      case 'quote':
        if (text) note = note ? `${note}\n${text}` : text;
        break;
      case 'bulleted_list':
        push({ kind: 'tasks', items: [toTask(map, id)] });
        queue.unshift(...hoist(map, id));
        break;
      case 'code':
        push({
          kind: 'code',
          language: plain(node.properties?.language).trim() || 'text',
          code: plain(title),
        });
        break;
      case 'image': {
        const source = node.properties?.source?.[0]?.[0];
        if (!source) break;
        const file = `${slug}-${images.length + 1}.webp`;
        images.push({ blockId: node.id, source, file });
        push({
          kind: 'image',
          file,
          alt:
            plain(node.properties?.caption).trim() ||
            (current.heading ? `${name} — ${current.heading}` : name),
        });
        break;
      }
      case 'bookmark': {
        const link = bookmarkLink(node);
        if (link) projectLinks.push(link);
        break;
      }
      default:
        // divider·table·table_row 등은 옮기지 않는다
        break;
    }
  }
  closeSection();

  return {
    project: {
      slug,
      name,
      org,
      summary,
      ...(note ? { note } : {}),
      sections,
      ...(projectLinks.length ? { links: projectLinks } : {}),
    },
    images,
  };
}

/**
 * Notion 이력서의 프로젝트 상세 38쪽을 저장소로 가져온다.
 *
 * **수동 실행이다.** 콘텐츠 컬렉션 로더로 상시 연결하면 `astro build`가
 * Notion에 의존하게 되고, deploy.yml이 빌드 성공에 배포를 걸어 두었으므로
 * Notion 장애가 곧 배포 장애가 된다. 이력서는 1년에 몇 번 바뀐다.
 *
 *   pnpm import:notion              # 전체 (글 + 이미지)
 *   pnpm import:notion --no-images  # 글만 — 빠른 반복
 *   pnpm import:notion --refresh    # .notion-cache 무시하고 다시 받는다
 *   pnpm import:notion:check        # 재생성해 커밋본과 비교만 (쓰기 없음)
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resume } from '../packages/resume/src/data.ts';
import { projectSlugs } from '../packages/resume/src/projects/slugs.ts';
import type { Project } from '../packages/resume/src/projects/types.ts';
import type { PendingImage } from './notion/blocks.ts';
import { pageMentions, pageTitle, toProject } from './notion/blocks.ts';
import { loadPage, RESUME_PAGE_ID } from './notion/client.ts';
import { emit, GENERATED_FILE } from './notion/emit.ts';
import { pruneImages, writeImages } from './notion/images.ts';

const flags = new Set(process.argv.slice(2));
const check = flags.has('--check');
const refresh = flags.has('--refresh');
const withImages = !flags.has('--no-images');

const fail = (message: string): never => {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
};

/**
 * 이름을 조인 키로 쓴다. Notion 제목과 data.ts 사이엔 띄어쓰기 차이가 있어
 * (`쿠팡 모니터링 시스템 신규개발` ↔ `… 신규 개발`) 공백을 지우고 맞춘다.
 * 화면에 나가는 이름은 언제나 data.ts 쪽이다.
 */
const joinKey = (name: string) => name.replace(/\s+/g, '');

const expected = new Map<string, { name: string; org: string }>();
for (const career of resume.careers) {
  for (const name of career.projects) {
    expected.set(joinKey(name), { name, org: career.slug });
  }
}

console.log(`Notion 이력서를 읽는다 (프로젝트 ${expected.size}개 기대)`);

const root = await loadPage(RESUME_PAGE_ID, { refresh });
const pageIds = pageMentions(root, RESUME_PAGE_ID);

const projects: Project[] = [];
const images: PendingImage[] = [];
const unknown: string[] = [];

for (const pageId of pageIds) {
  const map = await loadPage(pageId, { refresh });
  const title = pageTitle(map, pageId);
  const match = expected.get(joinKey(title));

  if (!match) {
    unknown.push(title);
    continue;
  }

  const slug = projectSlugs[match.name];
  if (!slug) fail(`slugs.ts에 슬러그가 없다: ${match.name}`);

  const converted = toProject({ map, pageId, ...match, slug });
  projects.push(converted.project);
  images.push(...converted.images);
}

if (unknown.length) {
  fail(
    [
      'data.ts에서 짝을 못 찾은 Notion 프로젝트가 있다.',
      '이름을 맞추거나 data.ts에 추가할 것:',
      ...unknown.map((name) => `  · ${name}`),
    ].join('\n'),
  );
}

const missing = [...expected.values()]
  .map(({ name }) => name)
  .filter((name) => !projects.some((project) => project.name === name));
if (missing.length) {
  fail(
    [
      'Notion에서 상세를 못 찾은 data.ts 프로젝트가 있다:',
      ...missing.map((name) => `  · ${name}`),
    ].join('\n'),
  );
}

// data.ts의 표시 순서를 그대로 따른다 — 렌더러가 다시 정렬하지 않도록
const order = [...expected.values()].map(({ name }) => name);
projects.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

const source = emit(projects);
const committed = await readFile(GENERATED_FILE, 'utf8').catch(() => '');

if (check) {
  const missingAssets = withImages
    ? await missingImageFiles(images)
    : ([] as string[]);

  if (source !== committed) {
    fail('생성물이 커밋본과 다르다. `pnpm import:notion`을 돌리고 커밋할 것.');
  }
  if (missingAssets.length) {
    fail(
      `이미지 파일이 없다:\n${missingAssets.map((f) => `  · ${f}`).join('\n')}`,
    );
  }
  console.log(`✓ 생성물이 최신이다 (프로젝트 ${projects.length}개)`);
  process.exit(0);
}

if (source !== committed) await writeFile(GENERATED_FILE, source);

if (withImages) {
  const { written, bytes } = await writeImages(images, { refresh });
  const stale = await pruneImages(new Set(images.map((image) => image.file)));

  console.log(
    `이미지 ${images.length}장 · 새로 쓴 것 ${written}장 · 지운 것 ${stale.length}장 · 합계 ${(bytes / 1024 / 1024).toFixed(2)}MB`,
  );
} else {
  console.log('이미지는 건너뛴다 (--no-images)');
}

console.log(
  `✓ 프로젝트 ${projects.length}개를 ${GENERATED_FILE.pathname.split('/').slice(-4).join('/')}에 썼다`,
);

/** 바이트 비교는 하지 않는다 — 인코더가 바뀌어도 --check가 헛돌지 않도록. */
async function missingImageFiles(pending: PendingImage[]) {
  const { ASSET_DIR } = await import('./notion/images.ts');
  const found: string[] = [];

  for (const image of pending) {
    const exists = await readFile(new URL(image.file, ASSET_DIR))
      .then(() => true)
      .catch(() => false);
    if (!exists) found.push(image.file);
  }
  return found;
}

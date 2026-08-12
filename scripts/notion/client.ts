import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { BlockMap } from './blocks.ts';

/** Notion 이력서(Subin`s Resume) 루트 페이지. */
export const RESUME_PAGE_ID = '9cc406d6-4d77-49b8-b12b-a46b35bc0810';

const SITE = 'https://sbjang123456.notion.site';
const ENDPOINT = `${SITE}/api/v3/loadPageChunk`;

/** 원본 응답과 원본 PNG를 담는다. .gitignore로 뺐다 — 재실행을 오프라인·무료로. */
export const CACHE_DIR = new URL('../../.notion-cache/', import.meta.url);

type Cursor = { stack: unknown[] };
type ChunkResponse = { cursor: Cursor; recordMap: { block?: BlockMap } };

const cachePath = (...parts: string[]) =>
  join(CACHE_DIR.pathname, ...parts.map(encodeURIComponent));

async function readCache(path: string) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

async function writeCache(path: string, body: string | Uint8Array) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
}

/**
 * 페이지 하나의 블록 전부를 가져온다.
 *
 * loadPageChunk는 한 번에 다 주지 않는다 — 응답의 `cursor.stack`이 비지 않으면
 * `chunkNumber`를 올려 가며 이어 받아야 한다. 루트 이력서 페이지가 실제로
 * 2청크로 나뉘어 오므로, 이걸 빠뜨리면 프로젝트 절반이 조용히 사라진다.
 */
export async function loadPage(
  pageId: string,
  { refresh = false } = {},
): Promise<BlockMap> {
  const path = cachePath('pages', `${pageId}.json`);

  if (!refresh) {
    const cached = await readCache(path);
    if (cached) return JSON.parse(cached) as BlockMap;
  }

  const blocks: BlockMap = {};
  let cursor: Cursor = { stack: [] };

  for (let chunk = 0; chunk < 20; chunk += 1) {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageId,
        limit: 100,
        cursor,
        chunkNumber: chunk,
        verticalColumns: false,
      }),
    });
    if (!response.ok) {
      throw new Error(`loadPageChunk ${pageId} 실패: HTTP ${response.status}`);
    }

    const { cursor: next, recordMap } =
      (await response.json()) as ChunkResponse;
    Object.assign(blocks, recordMap.block ?? {});

    if (!next?.stack.length) break;
    cursor = next;
  }

  await writeCache(path, JSON.stringify(blocks));
  return blocks;
}

/**
 * Notion 이미지를 내려받는다.
 *
 * S3 원본 URL은 직접 열면 403이다. notion.site의 `/image/` 프록시로만 받힌다.
 */
export async function loadImage(
  source: string,
  blockId: string,
  { refresh = false } = {},
): Promise<Buffer> {
  const path = cachePath('images', `${blockId}.bin`);

  if (!refresh) {
    try {
      return await readFile(path);
    } catch {
      // 캐시 미스 — 받아 온다
    }
  }

  const proxied = `${SITE}/image/${encodeURIComponent(source)}?table=block&id=${blockId}&cache=v2`;
  const response = await fetch(proxied);
  if (!response.ok) {
    throw new Error(`이미지 ${blockId} 내려받기 실패: HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeCache(path, buffer);
  return buffer;
}

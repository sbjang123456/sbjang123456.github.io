import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import type { PendingImage } from './blocks.ts';
import { loadImage } from './client.ts';
import type { Redaction } from './redactions.ts';
import { REDACTION_COLOR, redactions } from './redactions.ts';

/** 저장 위치. astro의 asset 파이프라인이 해시·크기를 붙여 준다. */
export const ASSET_DIR = new URL(
  '../../packages/resume/src/assets/projects/',
  import.meta.url,
);

/**
 * 본문 폭이 `max-w-3xl`(768px)이라 2× DPR에 1280이면 충분하다.
 * 원본은 대부분 CleanShot 2× 캡처라 5000px가 넘는다.
 *
 * 애니메이션은 프레임 수만큼 값이 곱해진다 — 유일한 GIF가 20프레임짜리라
 * 같은 설정으로 뽑으면 혼자 2.7MB로 나머지 16장을 다 합친 것의 세 배가 된다.
 * 본문 폭 등배(768px)로 낮춰 담는다.
 */
const STILL = { width: 1280, quality: 80 };
const ANIMATED = { width: 768, quality: 60 };

/**
 * 개인정보·사번을 검은 막대로 덮는다.
 *
 * 리사이즈를 끝낸 뒤에 얹어야 좌표가 맞으므로 인코딩 전에 한 단계 끊는다.
 * 크기가 규칙과 다르면 — Notion에서 스크린샷을 갈아 끼운 경우다 — 엉뚱한
 * 곳을 가린 채 공개되지 않도록 여기서 멈춘다.
 */
async function redact(resized: Buffer, file: string, rule: Redaction) {
  const { width, height } = await sharp(resized).metadata();
  if (width !== rule.width || height !== rule.height) {
    throw new Error(
      `${file}: 가림 좌표는 ${rule.width}x${rule.height} 기준인데 ${width}x${height}로 나왔다. ` +
        'Notion 원본이 바뀐 것 같다 — scripts/notion/redactions.ts의 좌표를 다시 잡을 것.',
    );
  }

  return sharp(resized)
    .composite(
      rule.areas.map((area) => ({
        input: {
          create: {
            width: area.width,
            height: area.height,
            channels: 3 as const,
            background: REDACTION_COLOR,
          },
        },
        left: area.left,
        top: area.top,
      })),
    )
    .toBuffer();
}

const toWebp = async (buffer: Buffer, file: string) => {
  // GIF를 정지 이미지로 넘기면 첫 프레임만 남는다 — 애니메이션째 옮긴다
  const animated = buffer
    .subarray(0, 3)
    .equals(Buffer.from([0x47, 0x49, 0x46]));
  const { width, quality } = animated ? ANIMATED : STILL;
  const resize = sharp(buffer, { animated }).resize({
    width,
    withoutEnlargement: true,
  });

  // 가릴 게 없으면 한 번에 인코딩한다 — 중간 버퍼를 거치면 애니메이션이
  // 한 번 더 재인코딩돼 공연히 커진다
  const rule = redactions[file];
  if (!rule) return resize.webp({ quality, effort: 6 }).toBuffer();

  const redacted = await redact(await resize.toBuffer(), file, rule);
  return sharp(redacted).webp({ quality, effort: 6 }).toBuffer();
};

/**
 * 이미지를 내려받아 webp로 저장한다.
 *
 * 내용이 같으면 쓰지 않는다 — 임포터를 다시 돌려도 git에 아무 변화가 없어야
 * 재실행이 결정적이라고 말할 수 있다.
 */
export async function writeImages(
  images: PendingImage[],
  { refresh = false } = {},
): Promise<{ written: number; bytes: number }> {
  await mkdir(ASSET_DIR, { recursive: true });

  let written = 0;
  let bytes = 0;

  for (const image of images) {
    const source = await loadImage(image.source, image.blockId, { refresh });
    const webp = await toWebp(source, image.file);
    const path = new URL(image.file, ASSET_DIR);

    bytes += webp.length;
    const current = await readFile(path).catch(() => null);
    if (current?.equals(webp)) continue;

    await writeFile(path, webp);
    written += 1;
  }

  return { written, bytes };
}

/** 이번 임포트에 없는 webp는 지운다 — 지난 실행의 잔재가 남지 않도록. */
export async function pruneImages(keep: Set<string>): Promise<string[]> {
  const existing = await readdir(ASSET_DIR).catch(() => [] as string[]);
  const stale = existing.filter(
    (file) => file.endsWith('.webp') && !keep.has(file),
  );

  for (const file of stale) await rm(new URL(file, ASSET_DIR));
  return stale;
}

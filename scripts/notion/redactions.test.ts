import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { redactions } from './redactions.ts';

/**
 * 가림 규칙이 **커밋된 이미지에 실제로 적용돼 있는지** 본다.
 *
 * 규칙만 검사하면 의미가 없다 — 임포터를 안 돌리고 커밋했거나 좌표가 어긋나면
 * 개인정보가 그대로 공개된다. 그래서 파일을 열어 그 영역이 정말 덮였는지 잰다.
 */
const asset = (file: string) =>
  fileURLToPath(
    new URL(
      `../../packages/resume/src/assets/projects/${file}`,
      import.meta.url,
    ),
  );

/** 덮개는 #111827이고 webp(q80)를 거치며 조금 번진다. 글자가 남으면 훨씬 밝다. */
const COVERED_MAX = 60;

describe('스크린샷 가림', () => {
  it('가릴 대상이 남아 있다', () => {
    // 규칙이 통째로 사라지면 이 파일의 나머지 테스트가 전부 통과해 버린다
    expect(Object.keys(redactions).length).toBeGreaterThan(0);
  });

  for (const [file, rule] of Object.entries(redactions)) {
    describe(file, () => {
      it('선언한 크기와 실제 이미지 크기가 같다', async () => {
        const { width, height } = await sharp(asset(file)).metadata();

        expect({ width, height }).toEqual({
          width: rule.width,
          height: rule.height,
        });
      });

      it('영역이 이미지 안에 있고 비어 있지 않다', () => {
        for (const area of rule.areas) {
          expect(area.width, area.covers).toBeGreaterThan(0);
          expect(area.height, area.covers).toBeGreaterThan(0);
          expect(area.left + area.width, area.covers).toBeLessThanOrEqual(
            rule.width,
          );
          expect(area.top + area.height, area.covers).toBeLessThanOrEqual(
            rule.height,
          );
        }
      });

      for (const area of rule.areas) {
        it(`실제로 덮여 있다 — ${area.covers}`, async () => {
          // 가장자리 2px는 인코딩 번짐이 있어 안쪽만 본다
          const { data } = await sharp(asset(file))
            .extract({
              left: area.left + 2,
              top: area.top + 2,
              width: area.width - 4,
              height: area.height - 4,
            })
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

          // 수만 바이트라 Math.max(...data)는 스택을 넘긴다
          const brightest = data.reduce((max, v) => (v > max ? v : max), 0);

          expect(brightest).toBeLessThan(COVERED_MAX);
        });
      }
    });
  }
});

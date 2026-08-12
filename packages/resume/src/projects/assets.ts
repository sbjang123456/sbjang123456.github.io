import type { ImageMetadata } from 'astro';

/**
 * 프로젝트 스크린샷.
 *
 * `apps/site/public/`이 아니라 소스 안에 두는 이유는 세 가지다 — 콘텐츠 해시로
 * 캐시가 무효화되고, `width`/`height`를 얻어 CLS를 없애고, 없는 파일을
 * 참조하면 (`projectImage`가 던져서) 빌드가 실패한다. 기계가 만든 경로에
 * 꼭 필요한 방어다.
 *
 * astro의 asset 플러그인은 확장자로만 필터링하고 `srcDir`를 보지 않아
 * 워크스페이스 패키지 안에서도 그대로 동작한다.
 */
const modules = import.meta.glob<ImageMetadata>('../assets/projects/*.webp', {
  eager: true,
  import: 'default',
});

export const projectAssets = new Map(
  Object.entries(modules).map(([path, image]) => [
    path.slice(path.lastIndexOf('/') + 1),
    image,
  ]),
);

/** 파일명으로 이미지를 찾는다. 없으면 빌드를 세운다. */
export function projectImage(file: string): ImageMetadata {
  const image = projectAssets.get(file);
  if (!image) {
    throw new Error(
      `프로젝트 이미지가 없다: ${file} — \`pnpm import:notion\`을 돌렸는지 확인할 것.`,
    );
  }
  return image;
}

import { fileURLToPath } from 'node:url';
import { getViteConfig } from 'astro/config';

// astro.config.mjs의 통합(mdx·react·svelte·tailwind)을 그대로 물려받아
// .astro와 아일랜드가 실제 빌드와 동일한 파이프라인으로 변환된다.
//
// root를 명시해야 한다 — 루트 vitest.config.ts가 이 파일을 프로젝트로 참조하면
// Astro는 cwd(저장소 루트)에서 설정을 찾아 "Missing pages directory"로 샌다.
//
// 주의: getViteConfig는 sync: false로 Vite를 만든다. astro:content를 쓰는
// 테스트는 `astro sync`가 선행돼야 한다 (루트 test:unit 스크립트가 처리).
export default getViteConfig(
  {
    test: {
      name: 'site',
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  },
  { root: fileURLToPath(new URL('.', import.meta.url)) },
);

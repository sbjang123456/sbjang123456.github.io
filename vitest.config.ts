import { svelte } from '@sveltejs/vite-plugin-svelte';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// 프로젝트마다 실행 환경과 컴파일러가 다르므로 하나의 설정으로 묶을 수 없다.
// `site`만 Astro 파이프라인이 필요해 별도 설정 파일을 참조한다.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'ui',
          root: './packages/ui',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'resume',
          root: './packages/resume',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'scripts',
          root: './scripts',
          environment: 'node',
          include: ['**/*.test.ts'],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'post-search',
          root: './packages/post-search',
          environment: 'happy-dom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
      {
        plugins: [svelte()],
        // svelte는 exports 조건으로 서버/클라이언트 빌드를 가른다. 기본값이면
        // index-server.js가 잡혀 mount()가 없다 — 브라우저 조건을 명시한다.
        resolve: { conditions: ['browser'] },
        test: {
          name: 'theme-toggle',
          root: './packages/theme-toggle',
          environment: 'happy-dom',
          include: ['src/**/*.test.ts'],
          setupFiles: ['./vitest.setup.ts'],
          // testing-library의 .svelte.js 헬퍼가 룬을 쓴다. externalize되면
          // 컴파일을 안 거쳐 rune_outside_svelte로 죽으므로 inline해야 한다.
          server: { deps: { inline: [/@testing-library\/svelte/] } },
        },
      },
      './apps/site/vitest.config.ts',
    ],
  },
});

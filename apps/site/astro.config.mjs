// @ts-check
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sbjang123456.github.io',
  integrations: [mdx(), react(), svelte()],
  vite: {
    plugins: [tailwindcss()],
    // 워크스페이스 패키지는 빌드 단계 없이 소스를 그대로 내보낸다. 앱 밖에 사는
    // .astro(packages/retrospect)가 그런 패키지를 부르면 Vite가 SSR external로
    // 넘기고, Node가 직접 읽다가 확장자 없는 상대 임포트(`./post-search`)에서
    // 죽는다 — dev만 500이고 빌드는 멀쩡해 더 늦게 들킨다.
    ssr: { noExternal: [/^@site\//] },
  },
});

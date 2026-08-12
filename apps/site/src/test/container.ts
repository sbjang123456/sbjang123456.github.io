import reactRenderer from '@astrojs/react/server.js';
import svelteRenderer from '@astrojs/svelte/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';

const SITE = 'https://sbjang123456.github.io';

/**
 * React·Svelte 아일랜드를 렌더할 수 있는 Astro 컨테이너.
 *
 * 주의: astro@7.2.0의 `AstroContainer.create()`는 `astroConfig` 옵션을 타입으로만
 * 받고 구현에서는 버린다 (`{streaming, manifest, renderers, resolve}`만 구조분해).
 * 컨테이너 매니페스트에 `site` 필드 자체가 없어 `Astro.site`는 항상 undefined다.
 * 그래서 컴포넌트는 `Astro.site ?? Astro.url`로 되돌릴 수 있어야 하고,
 * 테스트는 절대 URL을 `request`로 넘겨 origin을 정한다.
 */
export async function createContainer() {
  const container = await AstroContainer.create();

  container.addServerRenderer({
    name: '@astrojs/react',
    renderer: reactRenderer,
  });
  container.addClientRenderer({
    name: '@astrojs/react',
    entrypoint: '@astrojs/react/client.js',
  });
  container.addServerRenderer({
    name: '@astrojs/svelte',
    renderer: svelteRenderer,
  });
  container.addClientRenderer({
    name: '@astrojs/svelte',
    entrypoint: '@astrojs/svelte/client.js',
  });

  return container;
}

/** 렌더된 HTML 문자열을 조회 가능한 DOM으로 바꾼다. */
export function parse(html: string) {
  const window = new Window({ url: SITE });
  window.document.write(html);
  return window.document;
}

export const url = (path: string) => new Request(new URL(path, SITE));

/**
 * 사이트 공용 상수.
 *
 * base.astro의 메타, sitemap.xml, rss.xml, OG 카드가 모두 같은 문구·주소를
 * 써야 해서 한곳에 모아 둔다. 흩어져 있으면 이름 하나 고칠 때 네 군데를
 * 찾아다녀야 한다.
 *
 * `url`의 원본은 astro.config.mjs의 `site`다. 이 파일은 그 값을 다시 적을 뿐이니
 * 한쪽만 고치지 말 것 — 어긋나면 canonical과 sitemap이 서로 다른 주소를 가리킨다.
 */
export const SITE = {
  url: 'https://sbjang123456.github.io',
  name: 'sbjang',
  author: '장수빈',
  description: 'Astro 아일랜드 아키텍처 기반 개인 사이트 — 회고와 이력서.',
  locale: 'ko_KR',
} as const;

/** OG 카드 규격. scripts/build-og-images.ts의 뷰포트와 같아야 한다. */
export const OG_SIZE = { width: 1200, height: 630 } as const;

/** 카드가 없는 페이지가 쓰는 공용 OG 이미지. */
export const OG_DEFAULT = '/og/default.png';

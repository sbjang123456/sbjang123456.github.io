import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE } from '../site';
import { escapeXml, xmlResponse } from './_xml';

/**
 * 정적 페이지 목록은 손으로 적는다. 여섯 쪽짜리 사이트라 dist를 훑어 역산하는
 * 것보다 명시하는 쪽이 싸고 분명하다 — 페이지를 늘리면 여기도 한 줄 는다.
 *
 * 트레일링 슬래시를 붙인 형태가 정본이다. 빌드 포맷이 directory이고 canonical도
 * 같은 모양이라, 여기서만 슬래시를 빼면 색인이 두 주소로 갈라진다.
 */
const STATIC_PATHS = ['/', '/resume/', '/resume/all/', '/retrospect/'];

export const GET: APIRoute = async () => {
  const posts = (await getCollection('retrospect')).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  const entries = [
    ...STATIC_PATHS.map((path) => ({ path, lastmod: null as Date | null })),
    ...posts.map((post) => ({
      path: `/retrospect/${post.id}/`,
      lastmod: post.data.date,
    })),
  ];

  const urls = entries
    .map(({ path, lastmod }) => {
      const loc = escapeXml(new URL(path, SITE.url).href);
      const modified = lastmod
        ? `\n    <lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>`
        : '';
      return `  <url>\n    <loc>${loc}</loc>${modified}\n  </url>`;
    })
    .join('\n');

  return xmlResponse(
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
  );
};

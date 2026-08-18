import { getCollection } from 'astro:content';
import { RETROSPECT } from '@site/retrospect/meta';
import type { APIRoute } from 'astro';
import { SITE } from '../site';
import { escapeXml, xmlResponse } from './_xml';

const FEED = {
  title: `${SITE.name} — ${RETROSPECT.title}`,
  description: RETROSPECT.description,
};

export const GET: APIRoute = async () => {
  const posts = (await getCollection('retrospect')).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  // 본문 전문은 싣지 않는다 — MDX를 렌더해 HTML로 밀어 넣어야 하는데,
  // 리더에서 아일랜드가 살아날 리 없으니 품만 들고 얻는 게 없다.
  const items = posts
    .map((post) => {
      const link = escapeXml(new URL(`/retrospect/${post.id}/`, SITE.url).href);
      return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${link}</link>
      <description>${escapeXml(post.data.description)}</description>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
      <guid>${link}</guid>
    </item>`;
    })
    .join('\n');

  return xmlResponse(`<rss version="2.0">
  <channel>
    <title>${escapeXml(FEED.title)}</title>
    <link>${escapeXml(new URL('/retrospect/', SITE.url).href)}</link>
    <description>${escapeXml(FEED.description)}</description>
    <language>ko</language>
${items}
  </channel>
</rss>`);
};

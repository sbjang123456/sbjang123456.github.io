/**
 * sitemap.xml.ts와 rss.xml.ts가 함께 쓰는 XML 조립 도우미.
 *
 * 앞의 언더스코어 덕에 Astro가 라우트로 잡지 않는다 — pages 안에 두면서도
 * `/_xml`이 생기지 않는다.
 */

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

/** 글 제목·설명이 그대로 들어가므로 XML 특수문자를 반드시 접어야 한다. */
export const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ENTITIES[char]);

/** 선언부를 붙이고 content-type까지 정해 응답으로 만든다. */
export const xmlResponse = (body: string) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}\n`, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });

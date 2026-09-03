import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const retrospect = defineCollection({
  loader: glob({
    base: '../../packages/retrospect/content',
    pattern: '**/*.mdx',
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // 검색 결과 스니펫과 OG 카드 설명으로 그대로 나간다. 선택 항목으로 두면
    // 빠뜨린 글이 사이트 기본 설명을 물려받아 중복 스니펫이 되므로 필수다.
    description: z.string(),
  }),
});

const article = defineCollection({
  loader: glob({
    base: '../../packages/article/content',
    pattern: '**/*.mdx',
  }),
  schema: z.object({
    title: z.string(),
    // 정리한 날이다. 원문 발행일은 본문에 적는다
    date: z.coerce.date(),
    description: z.string(),
    // 원문 주소 — 상세의 '원문 보기' 버튼이 그대로 가리킨다
    source: z.string().url(),
    // 원문을 낸 곳(매체·공식 블로그·커뮤니티). 목록과 OG 카드에 날짜와 함께 나간다
    publisher: z.string(),
  }),
});

export const collections = { retrospect, article };

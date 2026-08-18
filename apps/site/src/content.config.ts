import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const retrospect = defineCollection({
  loader: glob({ base: './src/content/retrospect', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // 검색 결과 스니펫과 OG 카드 설명으로 그대로 나간다. 선택 항목으로 두면
    // 빠뜨린 글이 사이트 기본 설명을 물려받아 중복 스니펫이 되므로 필수다.
    description: z.string(),
  }),
});

export const collections = { retrospect };

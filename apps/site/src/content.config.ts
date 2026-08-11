import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const retrospect = defineCollection({
  loader: glob({ base: './src/content/retrospect', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
});

export const collections = { retrospect };

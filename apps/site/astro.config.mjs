// @ts-check
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sbjang123456.github.io',
  integrations: [mdx(), react(), svelte()],
});

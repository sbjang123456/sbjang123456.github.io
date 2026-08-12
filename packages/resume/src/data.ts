/**
 * 이력서 데이터.
 *
 * 마크업과 분리해 둔다 — 나중에 PDF나 JSON Resume 같은 다른 렌더러를 붙일 때
 * 이 파일만 읽으면 된다. 내용을 고칠 때 .astro를 열 필요도 없다.
 */

export type Career = {
  org: string;
  role: string;
  /** YYYY-MM 형식. 재직 중이면 `to`를 비운다. */
  from: string;
  to?: string;
  highlights: string[];
};

export type StackGroup = {
  category: string;
  items: string[];
};

export type Resume = {
  name: string;
  headline: string;
  summary: string;
  careers: Career[];
  stack: StackGroup[];
};

/** `to`가 없으면 재직 중으로 본다. */
export const formatPeriod = ({ from, to }: Pick<Career, 'from' | 'to'>) =>
  `${from} — ${to ?? '재직 중'}`;

export const resume: Resume = {
  name: 'sbjang',
  headline: '프론트엔드 개발자',
  summary: '(작성 예정)',
  careers: [],
  stack: [
    { category: '프레임워크', items: ['Astro', 'React', 'Svelte'] },
    { category: '언어', items: ['TypeScript'] },
    { category: '스타일', items: ['Tailwind CSS', 'shadcn/ui'] },
  ],
};

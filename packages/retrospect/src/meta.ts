export const RETROSPECT = {
  title: '회고',
  description: 'sbjang이 쓴 개발 회고 모음.',
  ogImage: '/og/retrospect.png',
} as const;

/** 컬렉션 엔트리에서 화면에 필요한 것만 추린 모양 (astro:content에 묶이지 않는다) */
export interface Post {
  id: string;
  title: string;
  date: Date;
  description: string;
}

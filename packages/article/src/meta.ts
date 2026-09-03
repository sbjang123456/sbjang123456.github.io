export const ARTICLE = {
  title: '아티클',
  description: 'sbjang이 읽은 기사와 공식 커뮤니티 글을 정리한 노트.',
  ogImage: '/og/article.png',
} as const;

/** 컬렉션 엔트리에서 화면에 필요한 것만 추린 모양 (astro:content에 묶이지 않는다) */
export interface Article {
  id: string;
  title: string;
  /** 정리한 날. 원문이 발행된 날이 아니다 */
  date: Date;
  description: string;
  /** 원문 주소 — 상세의 '원문 보기'가 그대로 가리킨다 */
  source: string;
  /** 원문을 낸 곳(매체·공식 블로그·커뮤니티) */
  publisher: string;
}

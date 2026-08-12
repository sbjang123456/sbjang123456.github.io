import type { Link } from '../data';

/** 업무 항목. Notion 중첩 불릿(최대 4단계)을 그대로 옮긴다. */
export type TaskNode = {
  text: string;
  /** 항목에 딸린 링크. 인라인 서식 렌더러를 만들지 않으려고 뒤에 붙인다. */
  links?: Link[];
  children?: TaskNode[];
};

export type ProjectBlock =
  /**
   * 문단. Notion 링크 멘션은 본문에 "‣" 한 글자로만 오므로 `text`가 비고
   * `links`만 남는 경우가 있다 — 렌더러는 둘 다 비었을 때만 건너뛴다.
   */
  | { kind: 'text'; text: string; links?: Link[] }
  | { kind: 'tasks'; items: TaskNode[] }
  /** file은 assets/projects 기준 파일명. 데이터는 이미지를 import하지 않는다. */
  | { kind: 'image'; file: string; alt: string }
  | { kind: 'code'; language: string; code: string };

/** Notion sub_header 하나 = 섹션 하나 (업무 / 작업 결과물 / 프로젝트 구조 …). */
export type ProjectSection = { heading: string; blocks: ProjectBlock[] };

export type Project = {
  /** 전역 유일. #앵커와 <details> id에 쓴다. */
  slug: string;
  /** data.ts의 Career.projects 항목과 문자 그대로 같아야 한다 — 테스트가 강제한다. */
  name: string;
  /** 소속 회사. Career.slug와 같은 값. */
  org: string;
  /** 첫 text 블록. 접힌 <summary>에 함께 보인다. */
  summary: string;
  /** Notion quote — 배경이나 회고 노트. */
  note?: string;
  sections: ProjectSection[];
  /** Notion bookmark — 관련 서비스 URL. */
  links?: Link[];
};

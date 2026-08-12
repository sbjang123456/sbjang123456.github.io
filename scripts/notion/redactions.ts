/**
 * 스크린샷에서 가릴 영역.
 *
 * Notion 원본에는 사내 시스템 화면이 그대로 담겨 있다. 이력서는 공개 사이트라
 * 개인정보(성명·연락처)와 사번은 지우고 내보낸다. 지우는 대신 검은 막대를
 * 덮는다 — 무엇을 가렸는지 컬럼 제목으로 알 수 있어야 화면이 이해된다.
 *
 * 좌표는 **리사이즈를 마친 뒤**(가로 1280px) 기준 픽셀이다. Notion에서 원본
 * 스크린샷을 갈아 끼우면 좌표가 어긋나 엉뚱한 곳을 가리게 되므로, 임포터가
 * `width`/`height`를 대조해 다르면 실패한다. 조용히 안 가려지는 일은 없다.
 */

export type RedactionArea = {
  left: number;
  top: number;
  width: number;
  height: number;
  /** 무엇을 가리는지 — 좌표만 남으면 나중에 손댈 수 없다. */
  covers: string;
};

export type Redaction = {
  /** 이 좌표가 유효한 이미지 크기. 다르면 임포트가 멈춘다. */
  width: number;
  height: number;
  areas: RedactionArea[];
};

export const redactions: Record<string, Redaction> = {
  // 시공협력기사 관리 화면 — 협력기사 실명과 휴대전화번호가 마스킹 없이 보인다
  'homefurnishing-install-1.webp': {
    width: 1280,
    height: 701,
    areas: [
      {
        left: 306,
        top: 399,
        width: 178,
        height: 302,
        covers: '시공협력기사명·연락처(휴대폰) 컬럼의 값',
      },
    ],
  },

  // 농지원부 통합검색 — 화면 자체가 "개인정보 조회이력 관리대상"이라고 적고 있다.
  // 농가주·주민번호 칸은 비어 있지만, 지번 주소와 농가고유번호가 짝이 되면
  // 특정 필지를 가리킨다. 총계·면적 같은 집계는 남겨 화면 성격은 보이게 둔다.
  'farmland-info-1.webp': {
    width: 740,
    height: 592,
    areas: [
      {
        left: 250,
        top: 240,
        width: 83,
        height: 280,
        covers: '농가고유번호 컬럼의 값',
      },
      {
        left: 467,
        top: 240,
        width: 165,
        height: 280,
        covers: '주소지 컬럼의 지번 주소',
      },
    ],
  },

  // MDS 작업 목록 — 작업자 사번이 검색 조건과 목록 양쪽에 남아 있다
  'mds-1.webp': {
    width: 1280,
    height: 639,
    areas: [
      {
        left: 142,
        top: 127,
        width: 88,
        height: 15,
        covers: '검색 조건 "작업자"에 입력된 사번',
      },
      {
        left: 808,
        top: 200,
        width: 94,
        height: 415,
        covers: '작업자 컬럼의 사번',
      },
    ],
  },
};

/** 가림 막대 색. 흰 표 위에서 "일부러 지웠다"로 읽히도록 검정에 가깝게 둔다. */
export const REDACTION_COLOR = '#111827';

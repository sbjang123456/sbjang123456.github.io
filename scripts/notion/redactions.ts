/**
 * 스크린샷에서 가릴 영역.
 *
 * Notion 원본에는 사내 시스템 화면이 그대로 담겨 있다. 이력서는 공개 사이트라
 * 두 종류를 지우고 내보낸다 — 개인정보(성명·연락처·사번)와, 회사 정보에
 * 해당하는 값(거래처명·상품 마스터). 앞의 것은 남의 개인정보라서, 뒤의 것은
 * 내 것이 아닌 회사 자산이라서다. 기준이 다르니 한쪽만 보고 좌표를 잡으면
 * 다른 쪽이 그대로 나간다 — 실제로 협력기사 화면이 그랬다.
 *
 * 지우는 대신 검은 막대를 덮는다 — 무엇을 가렸는지 컬럼 제목으로 알 수 있어야
 * 화면이 이해된다. 값만 덮고 헤더는 남기는 이유다.
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
  // 시공협력기사 관리 화면 — 협력기사 실명과 휴대전화번호가 마스킹 없이 보인다.
  // 거래처(협력사) 법인명도 함께 덮는다. 개인정보만 보고 좌표를 잡았을 때
  // 남아 있던 값인데, 거래처 명단은 회사 영업정보라 공개 이력서에 실을 것이 아니다.
  'homefurnishing-install-1.webp': {
    width: 1280,
    height: 701,
    areas: [
      {
        left: 48,
        top: 399,
        width: 242,
        height: 302,
        covers: '시공협력사코드·시공협력사명·시공협력기사코드 컬럼의 값',
      },
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

  // MDS 상품 마스터 — 상품코드와 상품명이 실데이터로 50건 보인다(전체 2,025건).
  // 상품명에는 공개 판매 라인(듀스페이스 등)과 내부 표기(DMS_*, MTN_*, [미쓰]*)가
  // 섞여 있어 항목별로 가려내기 어렵다. 코드 체계는 어느 쪽이든 내부 것이라
  // 두 컬럼을 통째로 덮는다. 그리드·메뉴·필드 구성은 남아 화면은 그대로 읽힌다.
  'mds-2.webp': {
    width: 1280,
    height: 637,
    areas: [
      {
        left: 172,
        top: 170,
        width: 56,
        height: 432,
        covers: '상품코드 컬럼의 값',
      },
      {
        left: 290,
        top: 170,
        width: 132,
        height: 432,
        covers: '상품명 컬럼의 값',
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

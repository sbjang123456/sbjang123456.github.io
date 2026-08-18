/**
 * 이력서 데이터.
 *
 * 마크업과 분리해 둔다 — 나중에 PDF나 JSON Resume 같은 다른 렌더러를 붙일 때
 * 이 파일만 읽으면 된다. 내용을 고칠 때 .astro를 열 필요도 없다.
 *
 * 원본은 Notion 이력서(Subin`s Resume). 회사별 Projects의 상세 페이지는
 * `scripts/import-notion.ts`가 `src/projects/generated/`로 옮긴다.
 */

export type Career = {
  /** URL 앵커와 `<details>` id에 쓰는 ascii 식별자. 프로젝트 상세의 조인 키. */
  slug: string;
  org: string;
  role: string;
  /** YYYY-MM 형식. 재직 중이면 `to`를 비운다. */
  from: string;
  to?: string;
  highlights: string[];
  /**
   * 회사에서 수행한 프로젝트 이름 — 표시 순서대로.
   *
   * 이 이름이 상세(`src/projects`)와의 조인 키다. 여기서 이름을 고치면
   * `src/projects/slugs.ts`도 같이 고쳐야 한다 — 어긋나면 테스트가 잡는다.
   */
  projects: string[];
};

export type StackGroup = {
  category: string;
  items: string[];
};

export type Link = {
  label: string;
  href: string;
};

/** 학력·자격·병역처럼 "무엇을 언제" 한 줄로 끝나는 항목. */
export type Credential = {
  title: string;
  period: string;
};

export type Resume = {
  name: string;
  headline: string;
  /** 문단 단위. 렌더러가 <p>로 나눠 그린다. */
  summary: string[];
  contacts: Link[];
  careers: Career[];
  stack: StackGroup[];
  background: Credential[];
};

/** `to`가 없으면 재직 중으로 본다. */
export const formatPeriod = ({ from, to }: Pick<Career, 'from' | 'to'>) =>
  `${from} — ${to ?? '재직 중'}`;

export const resume: Resume = {
  name: '장수빈',
  headline: '프론트엔드 개발자',
  summary: [
    '대학교 강의에서 프로그래밍 언어를 처음 접했습니다. 학점을 잘 받으려고 시작한 일이었지만 그 과정에서 프로그래밍의 재미를 느꼈고, 개발자로 커리어를 시작하려고 타전공 수업과 학원에서 기본기를 쌓아 개발자로 취직했습니다.',
    '첫 커리어는 SI 분야였습니다. OpenLayers 기반 지도 화면 개발을 주로 맡았고 Spring 기반 백엔드 API 개발에도 많이 기여했습니다. 이후 SI에서의 성장 한계와, 결과를 화면으로 바로 확인할 수 있는 프론트엔드의 매력 때문에 포지션을 전향했고 지금까지 여러 분야에서 프론트엔드 경력을 쌓고 있습니다.',
    '좋은 기술이 있으면 계속 탐구하고, 모르는 부분을 찾아 적용하고 이해하는 과정을 즐깁니다. 알게 된 것을 함께 공유하며 같이 성장하는 환경을 만들려고 노력합니다.',
    "배움에는 끝이 없다고 생각합니다. 내가 아는 것이 '다'가 아니라는 마음가짐으로, 스스로 목마르다고 믿으며 앞으로도 나아가려 합니다.",
  ],
  contacts: [
    { label: 'sbjang123456@gmail.com', href: 'mailto:sbjang123456@gmail.com' },
    { label: 'Blog', href: 'https://songjang.tistory.com/' },
    { label: 'GitHub', href: 'https://github.com/sbjang123456' },
    // 사이트 안쪽이지만 절대 주소로 둔다 — 이 줄은 어디에 붙여 넣어도
    // 그대로 열려야 하는 링크 모음이다
    { label: '이력서', href: 'https://sbjang123456.github.io/resume/' },
    { label: '회고', href: 'https://sbjang123456.github.io/retrospect/' },
  ],
  careers: [
    {
      slug: 'hanssem',
      org: '한샘',
      role: 'Front-end Engineer',
      from: '2023-08',
      highlights: [
        '프론트엔드 개발팀 ERP 파트 리딩 — git 브랜치·머지 전략 수립, Changeset 기반 버저닝 관리',
        'commitlint로 커밋 메시지 품질을, lint-staged로 prettier·lint를 강제해 코드 품질을 관리',
        'Jira 사용 가이드와 코딩 컨벤션을 문서화해 팀에 공유',
        'ERP 디자인 시스템 공통 요소 개발, 한샘몰 디자인 시스템 운영·개선',
        'IT혁신팀(전 IT혁신TF팀) 프론트엔드 파트 리딩 — FE 기술 검토, 아키텍처 정의, 공통 요소 개발',
        'AS모바일 Hybrid 전환, AS포탈(업무시스템) 넥사크로 → React 전환',
        'MDS(기준정보시스템) 신규 개발과 MDC(MDS 고도화) 개발',
        '에이전트 스킬 작성',
      ],
      projects: [
        'ERP 디자인 시스템 개발',
        '홈퍼니싱 시공 PC/모바일 운영',
        '한샘몰 디자인 시스템 운영 및 개발',
        '외주 시공프로 관리 서비스 구축',
        'AS모바일 Hybrid 전환',
        'MDS(기준정보시스템) 구축',
        '통합기준정보 시스템구축(2단계-MDC통합)',
        'AS포탈(업무시스템) 넥사크로 → React 전환',
      ],
    },
    {
      slug: 'storelink',
      org: '스토어링크',
      role: 'Front-end Engineer',
      from: '2022-05',
      to: '2023-08',
      highlights: [
        '개발팀 FE 파트 리딩 — git 브랜치·머지 전략 수립, Jira 워크플로 정의 및 사용 가이드 문서화',
        'FE 신기술 및 아키텍처 검토',
        '신규 프로젝트 검토 및 개발',
        '스토어링크 서비스 운영 및 개발',
      ],
      projects: [
        '스토어링크 5.0 사이트 및 백오피스 재구축, 안정화 및 운영',
        '애드링크 시스템 신규 구축',
        '쿠팡 모니터링 시스템 신규 개발',
        '유니비 시스템 유지보수',
        '스토어링크 4.0 백오피스 기능개선 및 유지보수',
      ],
    },
    {
      slug: 'wmpo',
      org: '위메프오',
      role: 'Front-end Engineer',
      from: '2021-10',
      to: '2022-04',
      highlights: [
        '팀 내 O2O 관련 화면 FE 개발',
        '위메프오 웹뷰 및 백오피스 운영 개선·유지보수',
        '위메프오 POS 웹뷰 및 파트너스 개선·유지보수',
      ],
      projects: [
        '위메프오 플러스 웹뷰 및 어드민 시스템 기능 개선 및 유지보수',
        '위메프오 POS 웹뷰 기능 개선 및 유지보수',
        '위메프오 앱 내 일부 웹뷰 시스템 기능 개선 및 유지보수',
        '위메프오 파트너스 서비스 기능 개선 및 유지보수',
        '위메프오 어드민 시스템 기능 개선 및 유지보수',
      ],
    },
    {
      slug: 'innopam',
      org: '이노팸',
      role: 'R&D Engineer',
      from: '2019-07',
      to: '2021-10',
      highlights: [
        '드론 신청·물량·배차 관련 백엔드 API 개발',
        '드론 비행 중 촬영한 실시간 이미지를 웹 브라우저 지도에 렌더링',
        '실시간 이미지 Detection·Segmentation 검출 결과를 지도에 렌더링',
        '원본 드론 영상과 지오프로세싱 영상을 나란히 비교하는 리사이즈 가능한 창 구현',
        '지도 컨트롤 기능 구현 (스와이프, 분할맵 등)',
      ],
      projects: [
        '드론 영상 AI 분석 시스템 고도화 사업',
        '2020년도 창업성장기술개발사업 디딤돌 창업과제',
        '서울산업진흥원 2020년도 테스트베드 서울 실증지원 사업',
        '인공지능(AI) 학습용 데이터 구축 2차',
        '국립공원공단 드론 영상 보관 및 처리 시스템 구축',
        '항공안전기술원 2020년 드론 실증도시 구축 사업',
        '장기 체공형 태양광 드론과 인공지능을 이용한 산불 모니터링 플랫폼 개발',
        '국립공원공단 드론관리시스템 구축',
        '클라우드 기반의 드론 매핑 서비스 플랫폼 개발',
      ],
    },
    {
      slug: 'shinhan',
      org: '신한항업',
      role: 'Software Engineer',
      from: '2018-04',
      to: '2019-06',
      highlights: [
        'OpenLayers를 활용한 지도 컨트롤·이벤트·공간 데이터 렌더링',
        'Spring MVC(Java)와 JavaScript + jQuery로 개발 업무 수행',
        '웹 개발 파트 전반의 기술 검토',
      ],
      projects: [
        'KT 5G NMS 구축 사업',
        '사내 공간정보 포털시스템 구축',
        '2018 항공사진 관리시스템 구축',
      ],
    },
    {
      slug: 'spatial-info',
      org: '공간정보기술',
      role: 'Software Engineer',
      from: '2014-09',
      to: '2018-04',
      highlights: [
        '통계 쿼리 결과 데이터 화면 노출 개발',
        'OpenLayers를 활용한 지도 컨트롤·액션 및 공간 데이터 화면 개발',
        'Admin 메뉴(사용자·그룹·권한 관리) 개발',
        'Spring MVC(Java)와 JavaScript + jQuery로 개발 업무 수행',
      ],
      projects: [
        '2018년 교통안전시설물관리시스템(T-GIS) 유지관리 및 기능개선 용역',
        '서울시 2017년 교통안전시설물 관리시스템(T-GIS) 도로점용공사장 관리 기능',
        '광주광역시 도로 및 상하수도 관리시스템 고도화',
        '대전광역시 교통안전시설물 관리시스템(T-GIS) 구축 용역',
        '개발제한구역 항공사진판독시스템 재구축 및 서비스 확대',
        '서부발전 부동산영상정보 유지관리 용역',
        '울산시 교통안전시설물 유지관리시스템 기능개선 및 유지보수 용역',
        '농지정보시스템 개발 및 정보화사업 발전방향 수립',
        '부동산 영상 정보 시스템 구축',
        '교통지리정보시스템(TGIS) 기능개선 및 고도화 사업',
      ],
    },
  ],
  stack: [
    {
      category: '언어·마크업',
      items: [
        'TypeScript',
        'JavaScript (ES6+)',
        'HTML5',
        'CSS3',
        'SCSS',
        'CSS-in-JS',
      ],
    },
    { category: '프레임워크', items: ['React', 'Next.js', 'Vue.js', 'jQuery'] },
    {
      category: '상태 관리',
      items: ['Context API', 'Redux', 'Recoil', 'React Query', 'Zustand'],
    },
    {
      category: '빌드·품질',
      items: ['Vite', 'Rollup', 'ESLint', 'Prettier', 'husky'],
    },
    {
      category: '협업',
      items: [
        'Git',
        'GitHub',
        'Jira',
        'Confluence',
        'Notion',
        'Discord',
        'Jandi',
      ],
    },
  ],
  background: [
    {
      title: '남서울대학교 GIS공학과 졸업',
      period: '2009-03 — 2015-02',
    },
    {
      title: '측량 및 지형공간정보기사 (국가기술자격)',
      period: '2014-05',
    },
    {
      title: '육군 병장 만기 전역',
      period: '2010-05 — 2012-03',
    },
  ],
};

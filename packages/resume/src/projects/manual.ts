import type { Project } from './types';

/**
 * Notion 이력서에 상세 페이지가 없는 프로젝트.
 *
 * `generated/projects.ts`는 `scripts/import-notion.ts`가 통째로 덮어쓰므로
 * 손으로 쓴 상세를 거기 둘 수 없다. 그렇다고 `data.ts`에만 이름을 올리면
 * 임포터가 "Notion에서 상세를 못 찾았다"며 멈춘다. 그래서 상세를 이 파일에
 * 두고, 임포터는 아래 `manualProjectNames`를 기대 목록에서 빼고 돌린다.
 *
 * 공개 사이트에 나가는 글이라 사내 식별자(이슈 키·저장소·브랜치·화면 ID·
 * 사내 도메인)는 적지 않는다. 규모는 서술형으로만 쓴다.
 */
export const manualProjects: Project[] = [
  {
    slug: 'mdc',
    name: '통합기준정보 시스템구축(2단계-MDC통합)',
    org: 'hanssem',
    summary:
      '1단계 MDS에 이어 레거시 MDC(마스터 데이터 통합) 업무를 기준정보시스템으로 흡수하는 2단계 프로젝트',
    note: '유통·제조 기준정보가 1단계에서 만든 기준정보시스템과 레거시 MDC로 나뉘어 있어, 같은 마스터를 두 시스템에서 따로 관리해야 했다. 2단계는 MDC가 맡던 Non-SAP 기준정보 업무까지 기준정보시스템 한 곳으로 모아, 작업 등록부터 검증·배포까지 한 흐름으로 잇는 것을 목표로 한다.',
    sections: [
      {
        heading: '업무',
        blocks: [
          {
            kind: 'tasks',
            items: [
              {
                text: 'FE 파트 리딩 — 프론트엔드 아키텍처와 개발 범위 정의',
                children: [
                  {
                    text: '1단계에서 정한 스택(React + TypeScript + Vite, MUI X DataGrid, TanStack Query, Zustand, react-hook-form + zod)을 그대로 이어받고, FSD 레이어 규칙을 2단계 화면에 맞게 확장',
                  },
                  {
                    text: '화면 단위로 개발 범위를 쪼개 일정과 담당을 배분하고, 공통으로 빼야 할 요소를 먼저 식별해 선개발',
                  },
                ],
              },
              {
                text: 'API 계약 정의 — 응답 스키마(zod)와 타입, api client 메서드를 화면 개발보다 먼저 확정',
                children: [
                  { text: 'Non-SAP 작업·작업단위·템플릿·필드그룹' },
                  { text: '메타데이터, 참조코드, 권한 조회' },
                  { text: '그리드 통합조회와 엑셀 다운로드' },
                  { text: '장 전개·장 가격, 가격안·비규격 가격' },
                  { text: 'SAP 로그 조회와 SSE 구독' },
                  { text: '1단계에서 빠져 있던 엔드포인트 보완' },
                ],
              },
              {
                text: 'Non-SAP 작업·템플릿 화면 개발',
                children: [
                  { text: '작업 목록·등록 화면' },
                  { text: '템플릿 관리 목록과 등록·수정 다이얼로그' },
                  {
                    text: '작업 상세 화면',
                    children: [
                      {
                        text: '작업단위 탭 전환 — 저장하지 않은 변경이 있으면 이동 전에 확인',
                      },
                      {
                        text: '대상 그리드 인라인 편집과 행 추가·삭제, 작업 복사, 선택 행 일괄 변경',
                      },
                      {
                        text: '버전 검증(낙관적 잠금) 기반 임시저장 — 다른 사람이 먼저 저장한 경우를 충돌로 잡아낸다',
                      },
                      { text: '엑셀 업로드와 대상 추가 팝업' },
                      { text: '검증 실패 건만 골라내는 재작업' },
                      {
                        text: '작업단위 개별 배포와 전체 배포, 시각을 지정하는 배포 예약',
                      },
                    ],
                  },
                ],
              },
              {
                text: '기타 작업 화면 개발',
                children: [
                  {
                    text: 'OMS 카탈로그, 카탈로그 상품구분 맵핑 — 그리드 조회·편집·저장, 엑셀 업로드와 비동기 전체 다운로드',
                  },
                  {
                    text: '상품이미지 조회·작업 — 이미지 업로드와 원본 크기로 보는 뷰어 다이얼로그',
                  },
                  {
                    text: '공통 파일 업로드 다이얼로그·업로드 버튼과 엑셀 양식 다운로드 버튼을 공통 컴포넌트로 개발해 화면들이 나눠 쓰도록 정리',
                  },
                ],
              },
              {
                text: 'SSE 실시간 반영 공통 인프라 구축',
                children: [
                  {
                    text: '사내 공통 패키지에 SSE 클라이언트와 훅을 추가하고, 토큰 재발급과 연결 중단 처리를 여러 앱이 함께 쓰도록 공유화',
                  },
                  {
                    text: '도메인별로 흩어져 있던 SSE 훅을 공통 base 훅 경유로 정리',
                  },
                  {
                    text: '엑셀 파싱 진행률과 작업단위 상태를 화면에 실시간 반영 — 새로고침으로 결과를 확인하던 흐름을 없앰',
                  },
                  {
                    text: '알림이 연달아 와도 묻히지 않도록 스택형 스낵바 도입',
                  },
                ],
              },
              {
                text: 'MUI v9 마이그레이션 — system props를 sx로, 컴포넌트 커스터마이징을 슬롯 API로 전환. 앱과 사내 공통 UI 패키지에 함께 적용',
              },
              {
                text: '1단계(MDS) 본체 수정',
                children: [
                  { text: '작업 API 경로를 SAP 작업 기준으로 정리' },
                  {
                    text: '일괄 변경 요청 필드명과 작업 상태값을 공통 코드셋에 맞춰 정렬',
                  },
                  { text: 'BOM 외주생산 조회·작업 화면 추가' },
                ],
              },
            ],
          },
        ],
      },
      {
        heading: '작업 결과물',
        blocks: [
          {
            kind: 'tasks',
            items: [
              {
                text: '두 시스템에 나뉘어 있던 기준정보 업무를 한 화면 흐름으로 모아, 작업 등록부터 검증·배포까지 기준정보시스템 안에서 끝낼 수 있게 함',
              },
              {
                text: '엑셀 업로드·배포처럼 오래 걸리는 작업의 진행 상태를 SSE로 실시간 노출해, 결과를 기다리며 화면을 새로 고치던 대기 시간을 없앰',
              },
            ],
          },
        ],
      },
      {
        heading: '프로젝트 구조',
        blocks: [
          {
            kind: 'code',
            language: 'Shell',
            code: `.
├── CHANGELOG.md
├── eslint.config.js
├── index.html
├── lint-staged.config.js
├── nginx.conf
├── package.json
├── public
│   ├── favicon.ico
│   └── robots.txt
├── README.md
├── src
│   ├── app            # 4
│   ├── entities       # 47
│   ├── features       # 43
│   ├── pages          # 49
│   ├── shared         # 5
│   ├── vite-env.d.ts
│   └── widgets        # 15
├── tsconfig.json
└── vite.config.ts`,
          },
          {
            kind: 'text',
            text: '숫자는 레이어별 슬라이스 개수다.',
          },
        ],
      },
    ],
  },
  {
    slug: 'as-portal',
    name: 'AS포탈(업무시스템) 넥사크로 → React 전환',
    org: 'hanssem',
    summary:
      '넥사크로 레거시 A/S 업무시스템 전체를 React로 전환. Claude Code 에이전트 스킬로 분석–PRD–구현–테스트–리뷰–커밋 파이프라인을 만들어 50여 개 화면을 병렬 마이그레이션',
    note: '10년 넘게 운영된 넥사크로 기반 A/S 업무시스템을 React SPA로 전면 재구축하는 프로젝트. 화면 수가 많고 레거시 동작을 그대로 보존해야 하는 전환 작업이라, 사람이 화면을 하나씩 옮기는 대신 AI 에이전트가 레거시를 분석해 명세를 만들고 구현·검증까지 수행하는 파이프라인을 설계하는 데 집중했다. 사람은 명세 검토와 머지 같은 게이트에서 판단만 맡는다.',
    sections: [
      {
        heading: '업무',
        blocks: [
          {
            kind: 'tasks',
            items: [
              {
                text: 'FE 전환 설계·개발 전담 — 아키텍처 정의와 전 화면 마이그레이션',
                children: [
                  {
                    text: 'React + TypeScript + Vite SPA, FSD 아키텍처. TanStack Query·Table·Virtual, react-hook-form + zod, zustand, Tailwind CSS + shadcn/ui 조합',
                  },
                  {
                    text: '기준정보·A/S 접수·A/S 요청·조치관리·고객관리·평가분석·정산(유상수금, 현금영수증·카드결제)·게시판·교육·관리자 등 업무 도메인 전반의 화면 50여 개 전환',
                  },
                ],
              },
              {
                text: '공통 기능·인프라',
                children: [
                  {
                    text: '메인·영업조직 선택, GNB 메뉴, 탭 워크스페이스(탭 상태 유지·스크롤), breadcrumb, SSO 로그인 리다이렉트, nginx 배포 구성',
                  },
                  {
                    text: '검색 다이얼로그를 합성 컴포넌트로 공통화하고 중복 도메인 서비스를 정리 — 화면들이 같은 조회·검색 패턴을 나눠 쓰도록 수렴',
                  },
                  {
                    text: '엑셀 다운로드를 서버사이드 EXPORT로 전환(컬럼 그룹화·다중 시트)하고 암호화 팝업을 전 화면에 적용',
                  },
                ],
              },
              {
                text: 'UI 현대화 — shadcn/ui 기반 디자인 토큰·다크모드·Pretendard 적용, Radix에서 Base UI로 전환',
              },
              {
                text: '테스트 체계 — Vitest + Testing Library + MSW로 레거시 동작 보존을 검증하는 테스트 374파일 3,867건 구축, 실행 속도 개선 병행',
              },
              {
                text: '두 차례 QA 라운드 대응 — 수정필요 판정 207건을 이슈당 1커밋·1PR 원칙으로 처리',
              },
            ],
          },
        ],
      },
      {
        heading: 'AI 에이전트 활용',
        blocks: [
          {
            kind: 'text',
            text: '이 프로젝트의 방법론 자체가 성과다. Claude Code 에이전트 스킬을 직접 제작해 "레거시 분석 → PRD 생성 → 구현 → 테스트 → 리뷰 → 커밋·PR"을 잇는 마이그레이션 파이프라인을 만들었고, 화면 단위로 워크트리를 쪼개 여러 에이전트가 동시에 화면을 옮기게 했다.',
          },
          {
            kind: 'tasks',
            items: [
              {
                text: 'PRD 생성 스킬(nexacro-react-prd) — 레거시 화면을 분석해 마이그레이션 명세를 자동 작성',
                children: [
                  {
                    text: '메뉴 스코프·화면 분석·API 추적·PRD 조립·통합테스트 시나리오 5개 에이전트가 병렬로 분석',
                  },
                  {
                    text: '같은 분석을 반복해 누락(갭)이 0이 될 때까지 도는 자동 보완 루프(최대 10회) — 기능 누락 문제를 스킬 수준에서 해소',
                  },
                  {
                    text: '전체 이관용 full 모드와 누락 기능 탐지용 gap 모드 분리',
                  },
                ],
              },
              {
                text: '구현 스킬(nexacro-react-migration) — PRD를 입력받아 코드·테스트·리뷰까지 수행',
                children: [
                  {
                    text: '코딩 컨벤션 선로딩, 기존 API 스캔(재사용 맵 작성으로 중복 엔드포인트 생성 방지) 두 게이트를 통과해야 코드 편집 가능',
                  },
                  {
                    text: 'UI·API/상태·테스트 등 역할별 에이전트 4~5개 병렬 구현, 이후 컨벤션 리뷰어와 자동 코드 리뷰 에이전트가 순차로 후처리',
                  },
                  {
                    text: '분석과 구현을 한 세션에서 하던 초기 접근이 컨텍스트 오염으로 품질이 흔들리는 문제를 겪고, PRD와 구현을 별도 스킬로 분리한 것이 가장 큰 전환점',
                  },
                ],
              },
              {
                text: '컨벤션 스킬(basis-web-conventions) — FSD·React·테스트 규칙을 라우터 + 주제별 레퍼런스 구조(Progressive Disclosure)로 설계해, 모든 에이전트가 필요한 규칙만 로드하면서도 같은 규칙으로 코드를 쓰게 함',
              },
              {
                text: '워크트리 병렬화(git-ops) — 화면(이슈) 단위로 git 워크트리·브랜치·에이전트 세션을 만들어 다수 화면을 동시에 진행',
                children: [
                  {
                    text: '워크트리 일괄 생성 시 서브에이전트가 install·build·세션 구성을 독립 컨텍스트에서 수행, 터미널 멀티플렉서(tmux·cmux·Orca) 자동 감지',
                  },
                  {
                    text: 'rebase → 커밋 → 명세 문서 정리 → PR 생성까지 커밋 파이프라인을 스킬로 자동화, PRD에서 워크트리 생성과 구현 지시까지 한 번에 이어지는 원스텝 트리거 완성',
                  },
                ],
              },
              {
                text: '멀티에이전트 오케스트레이션(Orca) — 코디네이터 에이전트가 작업 DAG를 만들어 워커 에이전트들에게 분배',
                children: [
                  {
                    text: 'PostToolUse 훅으로 오케스트레이션 시작 순간 프로젝트 규칙을 자동 주입 — 키워드 트리거에 기대지 않고 규칙 적용을 구조적으로 보장',
                  },
                  {
                    text: '워커는 plan mode로 기동해 사람 승인 전 코드 수정을 차단, 모노레포 테스트 동시 실행은 2개로 제한(순번 세마포어), 머지는 코디네이터만 수행',
                  },
                ],
              },
              {
                text: '보조 스킬 — 테스트 작성 워크플로우(write-test), 대용량 OpenAPI 명세 부분 조회(swagger), Jira 일감 일괄 생성·Bitbucket PR 자동화까지 개발 프로세스 전반을 스킬로 도구화',
              },
              {
                text: 'QA 대응도 에이전트 루프로 처리 — 이슈마다 레거시 원본과 대조 조사 후 이슈당 1커밋·1PR로 수정하고, 코드 결함이 아닌 건은 근거 코멘트로 판별해 종결 요청',
                children: [
                  {
                    text: '1차 라운드: 수정필요 152건 전량 처리 — 커밋 131건, PR 31건, 전체 테스트 3,867건 통과 상태 유지',
                  },
                  {
                    text: '2차 라운드: 55건 중 49건 PR 머지, 나머지 6건은 기해결·재현정보 필요·범위 밖 판정 근거를 달아 종결 — 지적 범위 밖 잠재 결함 14건과 QA 시트 오기재 5건을 역으로 발견해 보고',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        heading: '작업 결과물',
        blocks: [
          {
            kind: 'tasks',
            items: [
              {
                text: '넥사크로 레거시 업무시스템의 화면 50여 개를 React로 전환 — 작업 이슈 350여 건을 에이전트 파이프라인으로 처리',
              },
              {
                text: '한 화면씩 수작업으로 옮기던 방식을 여러 화면 동시 진행으로 바꾸고, 자동 보완 루프로 기능 누락을, 공유 컨벤션 스킬로 코드 스타일 불일치를 구조적으로 제거',
              },
              {
                text: '레거시 동작 보존을 검증하는 테스트 374파일 3,867건이 매 수정의 회귀 안전망으로 동작',
              },
              {
                text: '파이프라인 스킬 제작기와 운영 규칙을 사내 문서로 공유해 다른 프로젝트가 같은 방식을 재사용할 수 있게 함',
              },
            ],
          },
        ],
      },
      {
        heading: '프로젝트 구조',
        blocks: [
          {
            kind: 'code',
            language: 'Shell',
            code: `.
├── CHANGELOG.md
├── components.json
├── docs
├── eslint.config.js
├── index.html
├── lint-staged.config.js
├── nexacro-legacy
├── nginx.conf
├── package.json
├── public
│   └── legacy
├── src
│   ├── app            # 4
│   ├── entities       # 119
│   ├── features       # 64
│   ├── pages          # 57
│   ├── shared         # 6
│   ├── vite-env.d.ts
│   └── widgets        # 31
├── tsconfig.json
└── vite.config.ts`,
          },
          {
            kind: 'text',
            text: '숫자는 레이어별 슬라이스 개수다.',
          },
        ],
      },
    ],
  },
];

/** 임포터가 Notion 기대 목록에서 빼려고 읽는다. */
export const manualProjectNames = new Set(manualProjects.map((p) => p.name));

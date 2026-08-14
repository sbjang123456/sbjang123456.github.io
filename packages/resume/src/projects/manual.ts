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
│   ├── app
│   │   ├── app-providers.tsx
│   │   ├── main.tsx
│   │   ├── providers
│   │   └── theme
│   ├── entities
│   │   ├── apply-target
│   │   ├── auth
│   │   ├── bom-ecn
│   │   ├── bom-grid
│   │   ├── bom-manufacture
│   │   ├── bom-sales
│   │   ├── bom-task
│   │   ├── catalog
│   │   ├── closet
│   │   ├── closet-price
│   │   ├── code
│   │   ├── deploy-queue
│   │   ├── download-task
│   │   ├── field
│   │   ├── file
│   │   ├── generate
│   │   ├── goods
│   │   ├── goods-dm
│   │   ├── goods-grid
│   │   ├── goods-image
│   │   ├── goods-status-history
│   │   ├── goods-task
│   │   ├── goods-task-deletion
│   │   ├── grid
│   │   ├── grid-preset
│   │   ├── history
│   │   ├── info-source
│   │   ├── info-source-grid
│   │   ├── info-source-task
│   │   ├── menu
│   │   ├── metadata
│   │   ├── moving-average-price
│   │   ├── non-sap-history
│   │   ├── non-sap-task
│   │   ├── non-sap-task-template
│   │   ├── non-sap-task-unit
│   │   ├── non-standard-price
│   │   ├── price
│   │   ├── price-grid
│   │   ├── price-task
│   │   ├── reference
│   │   ├── sales-office
│   │   ├── sales-office-grid
│   │   ├── task
│   │   ├── task-target
│   │   ├── vendor
│   │   └── vendor-grid
│   ├── features
│   │   ├── auth
│   │   ├── bom-ecn-list
│   │   ├── bom-manufacture-list
│   │   ├── bom-sales-list
│   │   ├── bom-task
│   │   ├── catalog
│   │   ├── catalog-task
│   │   ├── closet-explosion-verify
│   │   ├── closet-price-extract
│   │   ├── code-list
│   │   ├── code-search
│   │   ├── download-list
│   │   ├── excel-download
│   │   ├── field
│   │   ├── field-metadata
│   │   ├── field-rule
│   │   ├── file
│   │   ├── generate
│   │   ├── goods-auth-search
│   │   ├── goods-dm-task
│   │   ├── goods-hierarchy-list
│   │   ├── goods-image-task
│   │   ├── goods-list
│   │   ├── goods-status-history-task
│   │   ├── goods-task
│   │   ├── grid-preset
│   │   ├── history-list
│   │   ├── info-source-list
│   │   ├── info-source-task
│   │   ├── moving-average-price
│   │   ├── non-sap-data-list
│   │   ├── non-sap-download
│   │   ├── non-sap-history-list
│   │   ├── non-sap-task
│   │   ├── non-sap-task-template
│   │   ├── non-standard-price-verify
│   │   ├── price-list
│   │   ├── price-plan
│   │   ├── price-task
│   │   ├── sales-office-list
│   │   ├── search-condition
│   │   ├── task
│   │   └── vendor-list
│   ├── pages
│   │   ├── bom-ecn-list
│   │   ├── bom-manufacture-list
│   │   ├── bom-sales-list
│   │   ├── catalog-goods-mapping-list
│   │   ├── catalog-goods-sprn-mapping-list
│   │   ├── catalog-goods-sprn-mapping-task
│   │   ├── catalog-group-mapping-list
│   │   ├── catalog-item-mapping-list
│   │   ├── catalog-list
│   │   ├── catalog-task
│   │   ├── closet-explosion-verify
│   │   ├── closet-price-extract
│   │   ├── code-list
│   │   ├── deploy-queue
│   │   ├── download-list
│   │   ├── error
│   │   ├── field-metadata-list
│   │   ├── field-rule-list
│   │   ├── generate-list
│   │   ├── generate-register
│   │   ├── goods-auth-search
│   │   ├── goods-dm-list
│   │   ├── goods-dm-task
│   │   ├── goods-hierarchy-list
│   │   ├── goods-image-list
│   │   ├── goods-image-task
│   │   ├── goods-list
│   │   ├── goods-status-history-list
│   │   ├── goods-status-history-task
│   │   ├── history-list
│   │   ├── home
│   │   ├── info-source-list
│   │   ├── layout
│   │   ├── non-sap-data-list
│   │   ├── non-sap-history-list
│   │   ├── non-sap-task-detail
│   │   ├── non-sap-task-list
│   │   ├── non-sap-task-register
│   │   ├── non-sap-template-list
│   │   ├── nonstandard-price-verify
│   │   ├── price-list
│   │   ├── price-plan
│   │   ├── sales-office-list
│   │   ├── sap-moving-price-list
│   │   ├── search-condition-list
│   │   ├── task
│   │   ├── task-list
│   │   ├── task-register
│   │   └── vendor-list
│   ├── shared
│   │   ├── apis
│   │   ├── env
│   │   ├── lib
│   │   ├── session
│   │   └── ui
│   ├── vite-env.d.ts
│   └── widgets
│       ├── catalog-task
│       ├── closet-explosion-verify
│       ├── closet-price-extract
│       ├── condition-field
│       ├── field
│       ├── goods-auth-search
│       ├── goods-dm-task
│       ├── goods-image-task
│       ├── goods-status-history-task
│       ├── layout
│       ├── moving-average-price
│       ├── non-sap-task
│       ├── non-standard-price-verify
│       ├── price-plan
│       └── task
├── tsconfig.json
└── vite.config.ts`,
          },
        ],
      },
    ],
  },
];

/** 임포터가 Notion 기대 목록에서 빼려고 읽는다. */
export const manualProjectNames = new Set(manualProjects.map((p) => p.name));

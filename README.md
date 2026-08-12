# sbjang123456.github.io

Astro 아일랜드 아키텍처 기반 개인 사이트. pnpm 모노레포로 구성하고 GitHub Actions로 GitHub Pages에 배포한다.

## 아키텍처

Astro가 메인 컨테이너로 모든 페이지를 빌드 타임에 정적 HTML로 생성하고, 인터랙션이 필요한 조각만 프레임워크 아일랜드로 하이드레이션한다. 아일랜드 컴포넌트는 워크스페이스 패키지로 분리해 **빌드 타임에 import로 통합**된다.

```
├── apps/
│   └── site/                 # Astro 호스트 — 유일한 배포 단위 (dev :4321)
│       └── src/
│           ├── pages/        # /, /resume/, /retrospect/, /retrospect/[id]/
│           ├── content/      # 회고 MDX (콘텐츠 컬렉션)
│           └── layouts/      # 공통 레이아웃 (헤더 네비 + 테마)
├── packages/
│   ├── ui/                   # shadcn/ui 컴포넌트 (CLI 생성물 그대로)
│   ├── post-search/          # React 아일랜드 — 회고 목록 검색
│   └── theme-toggle/         # Svelte 아일랜드 — 다크/라이트 전환
└── .github/workflows/deploy.yml  # main 푸시 시 build → Pages 배포 (apps/site/dist)
```

- **회고**: `src/content/retrospect/*.mdx` 파일이 곧 글. frontmatter(`title`, `date`)를 콘텐츠 컬렉션 스키마로 검증하고, 목록·본문 모두 정적 HTML로 생성된다. JS 없이도 콘텐츠 전체가 보인다.
- **아일랜드**: 한 페이지에 React(`client:load` 검색창)와 Svelte(테마 토글)가 공존하며 각자 독립적으로 하이드레이션된다. 아일랜드에 넘기는 props는 직렬화 가능해야 한다.
- **이력서**: 순수 정적 페이지.
- **디자인 시스템**: Tailwind CSS v4 + shadcn/ui. 컴포넌트는 `packages/ui`에 두고 Astro 페이지와 React 아일랜드가 함께 쓴다. Astro에서 쓰면 하이드레이션 없이 정적 HTML로만 렌더된다.

> 이전 구조(런타임 Module Federation 셸/리모트)는 `mfa-runtime` 브랜치에 보존되어 있다. 런타임 통합 실험은 그 브랜치 README 참고.

## 명령어

```sh
pnpm install        # 의존성 설치
pnpm dev            # dev 서버 (http://localhost:4321)
pnpm build          # 빌드 → apps/site/dist
pnpm lint           # Biome 검사
pnpm lint:fix       # Biome 자동 수정
```

로컬에서 배포 산출물 확인:

```sh
pnpm build
python3 -m http.server 8080 -d apps/site/dist
```

## 글 쓰기

`apps/site/src/content/retrospect/`에 `.mdx` 파일 추가:

```mdx
---
title: '글 제목'
date: 2026-08-11
---

본문…
```

파일명이 URL이 된다: `2026-08-11-foo.mdx` → `/retrospect/2026-08-11-foo/`

## 아일랜드 추가 방법

1. `packages/<이름>/`에 컴포넌트 패키지 생성 (React `.tsx` 또는 Svelte `.svelte`, `exports`가 소스를 직접 가리킴)
2. `apps/site/package.json`에 `"@site/<이름>": "workspace:*"` 추가
3. 페이지/레이아웃에서 import 후 `client:*` 디렉티브로 사용 (`client:load`, `client:visible`, `client:idle`)
4. 새 프레임워크라면 `astro.config.mjs`의 `integrations`에 해당 통합 추가

## 파일명 규칙

소스 파일명은 케밥 케이스를 쓴다 — `post-search.tsx`, `theme-toggle.svelte`, `base.astro`. 컴포넌트 **식별자**는 프레임워크 관례대로 파스칼 케이스를 유지한다 (`export function PostSearch`).

패키지 이름(`@site/post-search`), 회고 슬러그(`2026-08-11-foo.mdx` → `/retrospect/2026-08-11-foo/`), shadcn CLI 생성물(`dropdown-menu.tsx`)이 모두 같은 표기라 저장소 전체가 한 규칙으로 맞는다. 프레임워크가 이름을 정하는 파일(`astro.config.mjs`, `content.config.ts`, `index.astro`, `[id].astro`)만 그대로 둔다.

## shadcn/ui 컴포넌트 추가

컴포넌트는 `packages/ui`에 설치한다. 워크스페이스 루트가 아니라 **패키지 디렉터리에서** 실행해야 `components.json`을 찾는다.

```sh
cd packages/ui
pnpm dlx shadcn@latest add dialog tabs
```

- 생성된 파일은 `packages/ui/src/components/*.tsx`. import 별칭은 `@site/ui/components/<이름>`
- 소비 측에서 `className`으로만 조정하고 **생성물 자체는 수정하지 않는다**. 그래야 `shadcn add --overwrite`로 언제든 갱신할 수 있다
- 이 원칙을 강제하려고 `biome.json`에서 `packages/ui/src/components`를 검사 대상에서 제외했다 (shadcn 원본 포맷 유지)
- 디자인 토큰은 `apps/site/src/styles/global.css` 한 곳에 있다

## 주의점

- 아일랜드끼리는 격리된다 — React 컨텍스트/Svelte 컨텍스트가 아일랜드 경계를 넘지 않는다. 아일랜드 간 상태 공유가 필요하면 nanostores 같은 외부 스토어를 쓴다
- React와 Svelte를 함께 쓰면 두 런타임이 모두 브라우저에 내려간다 — 아일랜드는 작게 유지할 것
- Biome은 `.mdx` 미지원(스킵), `.astro`/`.svelte`는 부분 지원
- 이 저장소의 `.npmrc`는 공개 npm 레지스트리(`registry.npmjs.org`)를 강제한다

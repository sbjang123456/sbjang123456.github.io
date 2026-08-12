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
│           ├── layouts/      # 공통 레이아웃 (헤더 네비 + 테마)
│           └── test/         # Container API 헬퍼 + 페이지 테스트
├── packages/
│   ├── ui/                   # shadcn/ui 컴포넌트 (CLI 생성물 그대로)
│   ├── resume/               # Astro 패키지 — 이력 데이터 + 섹션 컴포넌트
│   ├── post-search/          # React 아일랜드 — 회고 목록 검색
│   └── theme-toggle/         # Svelte 아일랜드 — 다크/라이트 전환
├── e2e/                      # Playwright — 빌드 산출물 대상 E2E
└── .github/workflows/deploy.yml  # main 푸시 시 lint → test → build → Pages 배포
```

- **회고**: `src/content/retrospect/*.mdx` 파일이 곧 글. frontmatter(`title`, `date`)를 콘텐츠 컬렉션 스키마로 검증하고, 목록·본문 모두 정적 HTML로 생성된다. JS 없이도 콘텐츠 전체가 보인다.
- **아일랜드**: 한 페이지에 React(`client:load` 검색창)와 Svelte(테마 토글)가 공존하며 각자 독립적으로 하이드레이션된다. 아일랜드에 넘기는 props는 직렬화 가능해야 한다.
- **이력서**: 순수 정적 페이지. 내용(`packages/resume/src/data.ts`)과 마크업(`src/sections/*.astro`)을 갈라 뒀다 — 내용을 고칠 때 `.astro`를 열 필요가 없고, 나중에 PDF나 JSON Resume 같은 다른 렌더러를 붙일 때 데이터만 읽으면 된다. 아일랜드가 아니라 클라이언트 JS는 0바이트다. 내용의 원본은 Notion 이력서고, 회사별 프로젝트는 이름만 옮겨 왔다(상세는 아직 없음).
- **디자인 시스템**: Tailwind CSS v4 + shadcn/ui. 컴포넌트는 `packages/ui`에 두고 Astro 페이지와 React 아일랜드가 함께 쓴다. Astro에서 쓰면 하이드레이션 없이 정적 HTML로만 렌더된다.

> 이전 구조(런타임 Module Federation 셸/리모트)는 `mfa-runtime` 브랜치에 보존되어 있다. 런타임 통합 실험은 그 브랜치 README 참고.

## 명령어

```sh
pnpm install        # 의존성 설치
pnpm dev            # dev 서버 (http://localhost:4321)
pnpm build          # 빌드 → apps/site/dist
pnpm lint           # Biome 검사
pnpm lint:fix       # Biome 자동 수정
pnpm test           # 유닛 + E2E 전부
pnpm test:unit      # Vitest만 (빠름, ~3초)
pnpm test:watch     # Vitest 워치 모드
pnpm test:e2e       # 빌드 후 Playwright
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

## 패키지 추가 방법

1. `packages/<이름>/`에 패키지 생성. `exports`가 소스를 직접 가리킨다 (빌드 단계 없음)
2. `apps/site/package.json`에 `"@site/<이름>": "workspace:*"` 추가
3. **`apps/site/src/styles/global.css`에 `@source`를 추가한다** — 빠뜨리면 그 패키지의 Tailwind 클래스가 CSS에 생성되지 않는다. 빌드는 통과하고 스타일만 조용히 빠진다
4. 테스트가 있으면 루트 `vitest.config.ts`의 `projects`에 등록

**아일랜드**(React `.tsx` / Svelte `.svelte`)라면 추가로:

- 페이지에서 `client:*` 디렉티브로 사용 (`client:load`, `client:visible`, `client:idle`)
- 새 프레임워크면 `astro.config.mjs`의 `integrations`에 통합 추가

**Astro 패키지**(`.astro`)라면 — `packages/resume`가 예시다:

- `exports`가 `.astro`를 직접 가리켜도 된다. Astro 자신도 `astro/components/*`로 그렇게 한다
- `astro`를 `peerDependencies`에 둔다
- **라우트는 `apps/site/src/pages/`에만 살 수 있다.** 페이지 파일은 패키지를 부르는 껍데기로 남는다
- 하이드레이션이 없어 클라이언트 JS가 늘지 않는다

## 테스트

Vitest(유닛·컴포넌트) + Playwright(E2E). 테스트 파일은 대상 소스 옆에 두고, E2E만 `e2e/`에 모은다.

루트 `vitest.config.ts`가 5개 프로젝트를 묶는다 — 실행 환경과 컴파일러가 서로 달라 하나로 합칠 수 없다.

| 프로젝트 | 환경 | 대상 |
|---|---|---|
| `ui` | node | `cn()` — 순수 함수 |
| `post-search` | happy-dom + React | 검색 아일랜드 (Testing Library) |
| `theme-toggle` | happy-dom + Svelte | 테마 토글 아일랜드 |
| `resume` | node | 이력 데이터 — `formatPeriod`, 스키마 |
| `site` | node + Astro | `.astro` 레이아웃·페이지 (Container API) |

`site` 프로젝트는 `apps/site/vitest.config.ts`에서 `getViteConfig`로 `astro.config.mjs`의 통합(mdx·react·svelte·tailwind)을 그대로 물려받는다 — 실제 빌드와 같은 파이프라인으로 `.astro`가 변환된다. 헬퍼는 `apps/site/src/test/container.ts`.

E2E는 `astro dev`가 아니라 **`astro preview`** 위에서 돈다. Pages에 실제로 올라가는 산출물(디렉터리 포맷, 트레일링 슬래시)을 그대로 재현해야 하기 때문이다.

### 함정

- **`src/pages/` 안에는 테스트 파일을 두지 말 것.** Astro가 라우트로 취급해 `astro build`가 `/retrospect/index.test`를 렌더하려다 죽는다. 페이지 테스트는 `apps/site/src/test/pages/`에 둔다. 레이아웃·컴포넌트는 라우팅 대상이 아니라 옆에 둬도 된다.
- **Container API에서 `getCollection`은 글을 못 읽는다.** 콘텐츠 스토어(`.astro/data-store.json`)는 **dev 서버만** 만든다 — `astro sync`도 `astro build`도 만들지 않는다. 그래서 컬렉션을 쓰는 페이지 테스트는 `vi.mock('astro:content')`로 고정 데이터를 주입하고, 페이지 자신의 로직(정렬·직렬화·마크업)만 본다. 실제 MDX가 렌더되는지는 E2E가 본다. dev 서버를 한 번이라도 띄운 로컬에선 스토어가 남아 있어 진짜 컬렉션으로도 통과하니, **이 차이를 모르면 CI에서만 깨진다.**
- **Container API에서 `Astro.site`는 항상 `undefined`다.** astro 7.2.0의 `AstroContainer.create()`는 `astroConfig` 옵션을 타입으로만 받고 구현에서 버리며, 컨테이너 매니페스트에 `site` 필드 자체가 없다. 그래서 `base.astro`는 `Astro.site ?? Astro.url`로 되돌린다. 테스트는 `request`에 절대 URL을 넘겨 origin을 정한다.
- **E2E에서 아일랜드를 건드리기 전에 하이드레이션을 기다릴 것.** Astro는 `<astro-island>`에 `ssr` 속성을 달아 보내고 하이드레이션 후 지운다. `e2e/site.spec.ts`의 `hydrated()` 헬퍼가 `:not([ssr])`로 이걸 기다린다. 안 기다리면 React가 리스너를 붙이기 전에 입력이 들어가 조용히 실패한다.
- **Svelte 컴포넌트 테스트엔 설정 두 줄이 필요하다** — `resolve.conditions: ['browser']`(없으면 `svelte/index-server.js`가 잡혀 `mount()`가 없다)와 `server.deps.inline`(testing-library의 `.svelte.js` 헬퍼가 룬을 써서 컴파일을 거쳐야 한다).

### CI

`deploy.yml`의 build 잡에서 `lint → test:unit → build → playwright test` 순으로 돈다. 실패하면 `upload-pages-artifact`까지 못 가서 배포가 막힌다. Playwright 브라우저는 락파일 해시로 캐시하고 Chromium만 받는다. 실패 시 리포트가 아티팩트로 올라간다.

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

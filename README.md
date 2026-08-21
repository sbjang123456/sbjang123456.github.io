# sbjang123456.github.io

Astro 아일랜드 아키텍처 기반 개인 사이트. pnpm 모노레포로 구성하고 GitHub Actions로 GitHub Pages에 배포한다.

## 아키텍처

Astro가 메인 컨테이너로 모든 페이지를 빌드 타임에 정적 HTML로 생성하고, 인터랙션이 필요한 조각만 프레임워크 아일랜드로 하이드레이션한다. 아일랜드 컴포넌트는 워크스페이스 패키지로 분리해 **빌드 타임에 import로 통합**된다.

```
├── apps/
│   └── site/                 # Astro 호스트 — 유일한 배포 단위 (dev :4321)
│       └── src/
│           ├── pages/        # /, /resume/, /resume/all/, /retrospect/, /retrospect/[id]/
│           ├── layouts/      # 공통 레이아웃 (헤더 네비 + 테마)
│           └── test/         # Container API 헬퍼 + 페이지 테스트
├── packages/
│   ├── ui/                   # shadcn/ui 컴포넌트 (CLI 생성물 그대로)
│   ├── resume/               # Astro 패키지 — 이력 데이터 + 프로젝트 상세 + 섹션
│   ├── retrospect/           # Astro 패키지 — 회고 MDX + 목록·상세 마크업
│   ├── post-search/          # React 아일랜드 — 회고 목록 검색
│   └── theme-toggle/         # Svelte 아일랜드 — 다크/라이트 전환
├── scripts/                  # Notion 임포터 (수동) + 이력서 PDF·OG 카드 굽기 (빌드에 붙는다)
├── e2e/                      # Playwright — 빌드 산출물 대상 E2E
└── .github/workflows/deploy.yml  # main 푸시 시 lint → test → build → Pages 배포
```

- **회고**: `packages/retrospect/content/*.mdx` 파일이 곧 글. frontmatter(`title`, `date`, `description`)를 콘텐츠 컬렉션 스키마로 검증하고, 목록·본문 모두 정적 HTML로 생성된다. JS 없이도 콘텐츠 전체가 보인다.
- **아일랜드**: 한 페이지에 React(`client:load` 검색창)와 Svelte(테마 토글)가 공존하며 각자 독립적으로 하이드레이션된다. 아일랜드에 넘기는 props는 직렬화 가능해야 한다.
- **이력서**: 두 밀도로 나뉜 정적 페이지다. `/resume/`는 훑어보기 — 재직 중인 회사의 프로젝트만 펼쳐 볼 수 있고 나머지는 이름만 나열한다. `/resume/all/`은 회사·기간·역할만 늘어놓고 회사를 누르면 그 회사 프로젝트가 펼쳐진다. 내용(`data.ts` + `projects/`)과 마크업(`sections/`·`career/`·`project/`)을 갈라 뒀다 — 내용을 고칠 때 `.astro`를 열 필요가 없고, 나중에 PDF나 JSON Resume 같은 다른 렌더러를 붙일 때 데이터만 읽으면 된다.
- **펼침은 `<details>`다** — shadcn accordion(React)이 아니다. Radix Collapsible은 닫힌 콘텐츠를 아예 렌더하지 않아(`children: isOpen && children`) 상세 18,000자가 서버 HTML에서 통째로 사라진다. 크롤러·Cmd+F·인쇄·JS 미사용자가 모두 못 본다. `<details>`는 상세가 항상 HTML에 있고, 키보드·스크린리더·인쇄·아코디언 묶기(`name` 속성)를 브라우저가 책임진다. **덕분에 이력서의 클라이언트 JS는 상세를 다 싣고도 여전히 0바이트다** — 페이지 테스트가 `astro-island` 개수 1(헤더 테마 토글)을 못 박아 지킨다.
- **디자인 시스템**: Tailwind CSS v4 + shadcn/ui. 컴포넌트는 `packages/ui`에 두고 Astro 페이지와 React 아일랜드가 함께 쓴다. Astro에서 쓰면 하이드레이션 없이 정적 HTML로만 렌더된다.

> 이전 구조(런타임 Module Federation 셸/리모트)는 `mfa-runtime` 브랜치에 보존되어 있다. 런타임 통합 실험은 그 브랜치 README 참고.

## 명령어

```sh
pnpm install        # 의존성 설치
pnpm dev            # dev 서버 (http://localhost:4321)
pnpm build          # 빌드 → apps/site/dist (+ resume.pdf·og/*.png, 크로미움 필요)
pnpm lint           # Biome 검사
pnpm lint:fix       # Biome 자동 수정
pnpm test           # 유닛 + E2E 전부
pnpm test:unit      # Vitest만 (빠름, ~4초)
pnpm test:watch     # Vitest 워치 모드
pnpm test:e2e       # 빌드 후 Playwright
pnpm import:notion  # Notion 이력서 → packages/resume (수동)
```

로컬에서 배포 산출물 확인:

```sh
pnpm build
python3 -m http.server 8080 -d apps/site/dist
```

## 글 쓰기

`packages/retrospect/content/`에 `.mdx` 파일 추가:

```mdx
---
title: '글 제목'
date: 2026-08-11
description: '검색 결과에 그대로 나갈 한 줄. 80~120자, 글의 결론이 드러나게.'
---

본문…
```

파일명이 URL이 된다: `2026-08-11-foo.mdx` → `/retrospect/2026-08-11-foo/`

## 이력서 PDF

`/resume/all/` 화면의 **PDF 내려받기** 버튼은 빌드 때 구워 둔 `dist/resume.pdf`를 가리킨다. 브라우저에서 만드는 방식(html2canvas 류)은 글자가 이미지로 바뀌어 검색·복사가 안 되고, 정적 사이트라 서버에서 만들 수도 없다. 그래서 E2E에 이미 쓰는 크로미움으로 빌드 시점에 한 번만 인쇄한다.

```
astro build → scripts/build-resume-pdf.ts → dist/resume.pdf
```

- 스크립트가 `dist`를 최소 정적 서버(포트 0)로 띄우고 `/resume/all/`을 연다. `astro preview`를 안 띄우는 이유는 자식 프로세스 뒷정리가 필요 없고 개발 서버와 포트가 부딪히지 않아서다.
- **다 펼친 상태는 DOM으로 만든다.** 회사 `<details>`는 `name`으로 묶인 아코디언이라 속성을 먼저 떼야 여럿이 열리고, 닫혀 있는 동안은 `loading="lazy"` 이미지가 요청조차 되지 않아 `eager`로 바꿔 받아 온다.
- **종이 모양은 `packages/resume/src/print.css`가 맡는다.** 전부 `@media print` 안이라 화면에는 영향이 없다. 사이트 헤더·푸터와 `[data-print-hidden]`을 숨기고, 화면에선 `max-h-96` 안에서 스크롤하던 코드 블록을 풀어 준다 — 안 풀면 119줄짜리 디렉터리 트리가 앞부분만 찍힌다.
- 테마는 `localStorage`에 `light`를 심어 고정한다. 안 그러면 CI 머신의 시스템 설정에 따라 검은 종이가 나온다.

버튼은 `import.meta.env.PROD`일 때만 그린다 — dev 서버에는 PDF가 없다. 화면에서 확인하려면 `pnpm build && pnpm --filter @site/main preview`.

빌드가 `Executable doesn't exist`로 죽으면 브라우저가 없는 것이다:

```sh
pnpm exec playwright install chromium
```

## 검색엔진·링크 미리보기

메타는 `base.astro` 한 곳에서만 나간다. 페이지는 `title`·`description`·`image`·`article`을 props로 넘기고, 레이아웃이 그걸 OG·Twitter·JSON-LD로 편다. `article`(발행일)을 넘긴 페이지만 글로 취급해 `og:type=article`과 `BlogPosting` 구조화 데이터를 붙인다.

사이트 이름·주소·설명은 `apps/site/src/site.ts`에 모여 있다 — 레이아웃·sitemap·RSS·OG 카드가 같은 값을 봐야 해서다. `SITE.url`은 `astro.config.mjs`의 `site`를 따라 적은 사본이니 한쪽만 고치면 canonical과 sitemap이 갈라진다.

```
astro build → scripts/build-og-images.ts → dist/og/{글 슬러그}.png
```

- **OG 카드는 빌드 때 크로미움으로 굽는다.** 글마다 한 장 + 목록용(`retrospect.png`) + 공용(`default.png`). 이미지 서비스나 폰트 의존성 없이 이력서 PDF와 같은 브라우저를 빌려 쓴다.
- **카드는 라우트가 아니라 스크립트 안의 템플릿을 `setContent`로 그린다.** `/og/[id]/` 같은 페이지를 만들면 dist에 크롤러가 주워 갈 빈 페이지가 생기고 sitemap에서 도로 빼야 한다. 라우트가 없으니 글 목록도 `packages/retrospect/content/`의 MDX frontmatter에서 직접 읽는다.
- 카드 색은 `global.css`의 라이트 토큰을 스크립트 안에 옮겨 적었다. 사이트 CSS를 끌어오면 해시 붙은 Tailwind 산출물 경로에 묶인다.
- `sitemap.xml`·`rss.xml`은 통합 패키지 없이 `src/pages/*.xml.ts` 엔드포인트로 만든다. 페이지가 여섯 개뿐이라 트레일링 슬래시와 `lastmod`를 직접 쥐는 편이 낫다. XML 이스케이프는 `src/pages/_xml.ts`가 공유한다(언더스코어 = 라우트 아님).
- **글 상세가 `description`을 안 넘기면 모든 글이 사이트 기본 설명을 공유한다** — 구글이 중복 스니펫으로 보는 모양이다. 스키마가 `description`을 필수로 잡고, `src/test/pages/retrospect-detail.test.ts`가 실제로 나가는지 지킨다.

## Notion 가져오기

이력서 본문은 Notion(`Subin's Resume`)이 원본이다. 회사별 프로젝트 상세 38쪽을 `scripts/import-notion.ts`가 저장소로 옮긴다.

```sh
pnpm import:notion              # 전체 (글 + 이미지)
pnpm import:notion --no-images  # 글만 — 빠른 반복
pnpm import:notion --refresh    # .notion-cache 무시하고 다시 받는다
pnpm import:notion:check        # 재생성해 커밋본과 비교만 (쓰기 없음)
```

**콘텐츠 컬렉션 로더로 상시 연결하지 않고 수동 실행으로 둔 이유**: 그렇게 하면 `astro build`가 Notion에 의존하고, `deploy.yml`이 빌드 성공에 배포를 걸어 두었으므로 Notion 장애가 곧 배포 장애가 된다. 이력서는 1년에 몇 번 바뀐다.

- 원본 응답과 원본 이미지는 `.notion-cache/`에 남는다(git 제외). 재실행과 `--check`가 오프라인·무료가 된다.
- 이미지는 `notion.site/image/` 프록시로만 받힌다 — S3 원본 URL은 직접 열면 403이다. `sharp`로 webp 1280px q80(애니메이션은 768px q60)으로 줄여 `packages/resume/src/assets/projects/`에 넣는다.
- 임포터는 node의 타입 스트리핑으로 `.ts`를 그대로 실행한다. 그래서 `engines.node`가 `>=22.18`이다.

### 스크린샷 가리기

Notion 원본에는 사내 시스템 화면이 그대로 담겨 있다. 공개 사이트로 나가면 안 되는 부분은 `scripts/notion/redactions.ts`에 좌표로 적어 두고 임포터가 검은 막대로 덮는다. 컬럼 제목은 남겨 무엇을 가렸는지 알 수 있게 한다.

- 좌표는 **리사이즈를 마친 뒤**(가로 1280px) 기준이다. 규칙에 이미지 크기를 함께 적고, 임포터가 대조해 다르면 **멈춘다** — Notion에서 스크린샷을 갈아 끼웠을 때 엉뚱한 곳을 가린 채 공개되는 일을 막는다.
- `redactions.test.ts`가 커밋된 webp를 열어 그 영역이 정말 덮였는지 픽셀로 잰다. 규칙만 검사하면 임포터를 안 돌리고 커밋한 경우를 놓친다.
- 지금 가리는 것: 시공협력기사 성명·휴대전화번호(`homefurnishing-install-1`), 작업자 사번(`mds-1`), 농지 지번 주소·농가고유번호(`farmland-info-1`).

**손으로 고칠 자리는 `packages/resume/src/projects/slugs.ts` 하나다.** 프로젝트 이름이 대부분 한글이라 자동 슬러그화는 빈 문자열이나 퍼센트 인코딩을 낳는다. `이름 → ascii 슬러그` 38줄을 손으로 쓰고 임포터는 **읽기만** 한다. 슬러그가 이미지 파일명·`#앵커`·`<details>` id에 함께 쓰여 재실행이 바이트 단위로 결정적이다.

이름은 `data.ts`의 `Career.projects`와 상세를 잇는 조인 키다(공백 차이는 임포터가 흡수한다). 어긋나면 화면이 조용히 비는 대신 `projects/index.test.ts`가 이름을 찍어 실패한다.

**생성물은 `packages/resume/src/projects/generated/`에만 둔다.** 최상단에 `@generated` 표시가 있고, `.gitattributes`가 `linguist-generated`로, `biome.json`이 검사 제외로 잡아 둔다. 타임스탬프는 넣지 않는다 — 매 실행마다 diff가 생기면 `--check`가 무의미해진다.

## 패키지 추가 방법

1. `packages/<이름>/`에 패키지 생성. `exports`가 소스를 직접 가리킨다 (빌드 단계 없음)
2. `apps/site/package.json`에 `"@site/<이름>": "workspace:*"` 추가
3. **`apps/site/src/styles/global.css`에 `@source`를 추가한다** — 빠뜨리면 그 패키지의 Tailwind 클래스가 CSS에 생성되지 않는다. 빌드는 통과하고 스타일만 조용히 빠진다
4. 테스트가 있으면 루트 `vitest.config.ts`의 `projects`에 등록

**아일랜드**(React `.tsx` / Svelte `.svelte`)라면 추가로:

- 페이지에서 `client:*` 디렉티브로 사용 (`client:load`, `client:visible`, `client:idle`)
- 새 프레임워크면 `astro.config.mjs`의 `integrations`에 통합 추가

**Astro 패키지**(`.astro`)라면 — `packages/resume`·`packages/retrospect`가 예시다:

- `exports`가 `.astro`를 직접 가리켜도 된다. Astro 자신도 `astro/components/*`로 그렇게 한다
- `astro`를 `peerDependencies`에 둔다
- **라우트는 `apps/site/src/pages/`에만 살 수 있다.** 페이지 파일은 패키지를 부르는 껍데기로 남는다
- **패키지 안에서 아일랜드를 쓰면 그 아일랜드 패키지는 `apps/site/package.json`에도 남겨 둔다.** Astro는 `client:*` 컴포넌트의 임포트 경로를 해석하지 않고 bare specifier(`@site/post-search`) 그대로 클라이언트 빌드 엔트리로 넘긴다 — 해석은 앱 루트에서 일어나므로 앱이 그 패키지를 모르면 `astro build`가 `UNRESOLVED_ENTRY`로 죽는다
- **`astro.config.mjs`의 `ssr.noExternal`이 `@site/*`를 잡아 둔다.** 앱 밖(`packages/*`)에 사는 `.astro`가 워크스페이스 패키지를 부르면 Vite가 SSR external로 넘기고, Node가 소스를 직접 읽다 확장자 없는 상대 임포트에서 죽는다. **dev만 500이고 빌드는 멀쩡해 더 늦게 들킨다**

## 테스트

Vitest(유닛·컴포넌트) + Playwright(E2E). 테스트 파일은 대상 소스 옆에 두고, E2E만 `e2e/`에 모은다.

루트 `vitest.config.ts`가 6개 프로젝트를 묶는다 — 실행 환경과 컴파일러가 서로 달라 하나로 합칠 수 없다.

| 프로젝트 | 환경 | 대상 |
|---|---|---|
| `ui` | node | `cn()` — 순수 함수 |
| `post-search` | happy-dom + React | 검색 아일랜드 (Testing Library) |
| `theme-toggle` | happy-dom + Svelte | 테마 토글 아일랜드 |
| `resume` | node | 이력 데이터 — `formatPeriod`, 스키마, 상세와의 정합 |
| `scripts` | node | Notion 블록 → `Project` 정규화 (커밋된 픽스처) |
| `site` | node + Astro | `.astro` 레이아웃·페이지 (Container API) |

`site` 프로젝트는 `apps/site/vitest.config.ts`에서 `getViteConfig`로 `astro.config.mjs`의 통합(mdx·react·svelte·tailwind)을 그대로 물려받는다 — 실제 빌드와 같은 파이프라인으로 `.astro`가 변환된다. 헬퍼는 `apps/site/src/test/container.ts`.

E2E는 `astro dev`가 아니라 **`astro preview`** 위에서 돈다. Pages에 실제로 올라가는 산출물(디렉터리 포맷, 트레일링 슬래시)을 그대로 재현해야 하기 때문이다. 포트는 dev(4321)와 갈라 **4322**를 쓰고, 그 서버의 생명주기는 Playwright의 `webServer`가 아니라 `e2e/preview-server.ts`가 쥔다.

### 함정

- **`src/pages/` 안에는 테스트 파일을 두지 말 것.** Astro가 라우트로 취급해 `astro build`가 `/retrospect/index.test`를 렌더하려다 죽는다. 페이지 테스트는 `apps/site/src/test/pages/`에 둔다. 레이아웃·컴포넌트는 라우팅 대상이 아니라 옆에 둬도 된다.
- **Container API에서 `getCollection`은 글을 못 읽는다.** 콘텐츠 스토어(`.astro/data-store.json`)는 **dev 서버만** 만든다 — `astro sync`도 `astro build`도 만들지 않는다. 그래서 컬렉션을 쓰는 페이지 테스트는 `vi.mock('astro:content')`로 고정 데이터를 주입하고, 페이지 자신의 로직(정렬·직렬화·마크업)만 본다. 실제 MDX가 렌더되는지는 E2E가 본다. dev 서버를 한 번이라도 띄운 로컬에선 스토어가 남아 있어 진짜 컬렉션으로도 통과하니, **이 차이를 모르면 CI에서만 깨진다.**
- **Container API에서 `Astro.site`는 항상 `undefined`다.** astro 7.2.0의 `AstroContainer.create()`는 `astroConfig` 옵션을 타입으로만 받고 구현에서 버리며, 컨테이너 매니페스트에 `site` 필드 자체가 없다. 그래서 `base.astro`는 `Astro.site ?? Astro.url`로 되돌린다. 테스트는 `request`에 절대 URL을 넘겨 origin을 정한다.
- **`astro preview`는 Playwright의 `webServer`로 못 다룬다.** 부모를 죽여도 혼자 살아남아 포트를 붙들고(실행마다 하나씩 흘린다), 프로젝트당 하나만 도는 데몬이라 그 찌꺼기가 남아 있으면 다음 실행은 포트를 바꿔도 `already running`만 남기고 즉시 끝난다 — Playwright에는 `webServer exited early`로 보인다. 포트가 dev와 겹치면 더 조용히 깨진다. `reuseExistingServer`가 dev 서버를 그대로 붙잡는데 dev는 `dist/`를 서빙하지 않아, 페이지는 멀쩡하고 og PNG와 `resume.pdf`만 404 HTML로 온다. 그래서 `globalSetup`에서 `astro preview stop` → `--background`로 열고 끝나면 다시 `stop`한다. `stop`은 떠 있지 않아도 0으로 끝나고 `--background`는 리슨을 시작한 뒤 반환하므로, 정리와 준비 대기가 이 두 명령으로 끝난다.
- **E2E에서 아일랜드를 건드리기 전에 하이드레이션을 기다릴 것.** Astro는 `<astro-island>`에 `ssr` 속성을 달아 보내고 하이드레이션 후 지운다. `e2e/site.spec.ts`의 `hydrated()` 헬퍼가 `:not([ssr])`로 이걸 기다린다. 안 기다리면 React가 리스너를 붙이기 전에 입력이 들어가 조용히 실패한다.
- **`<details>`를 `:target`으로 열지 말 것.** `#슬러그` 앵커로 들어온 항목을 `[data-disclosure]:target::details-content { block-size: auto }`로 펼치면 화면엔 열려 보이지만 `[open]` 속성은 그대로다 — 사용자가 눌러도 접히지 않는 상태가 된다(직접 확인). Chromium은 조각 이동 시 조상 `<details>`를 알아서 열어 주므로 앵커는 그쪽에 맡긴다. 그 기능이 없는 브라우저에선 앵커가 아무 일도 하지 않을 뿐, 잘못 동작하지는 않는다.
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

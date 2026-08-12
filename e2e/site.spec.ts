import { expect, type Page, test } from '@playwright/test';

const theme = (page: Page) => page.locator('html').getAttribute('data-theme');

/**
 * 아일랜드가 하이드레이션될 때까지 기다린다.
 *
 * Astro는 `<astro-island>`에 `ssr` 속성을 달아 보내고 하이드레이션이 끝나면
 * 지운다. 이걸 기다리지 않으면 React가 리스너를 붙이기 전에 입력이 들어가
 * 상태가 갱신되지 않는다.
 */
const hydrated = (page: Page, component: string) =>
  page.locator(`astro-island[opts*="${component}"]:not([ssr])`).waitFor();

/** 헤더 네비게이션. 본문에도 같은 이름의 링크가 있어 범위를 좁혀야 한다. */
const nav = (page: Page) => page.getByRole('navigation', { name: '주요' });

test.describe('네비게이션', () => {
  test('헤더로 주요 페이지를 오갈 수 있다', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('sbjang');

    await nav(page).getByRole('link', { name: '회고' }).click();
    await expect(page).toHaveURL('/retrospect/');

    await nav(page).getByRole('link', { name: '이력서' }).click();
    await expect(page).toHaveURL('/resume/');

    await page
      .getByRole('banner')
      .getByRole('link', { name: 'sbjang' })
      .click();
    await expect(page).toHaveURL('/');
  });

  test('현재 페이지를 네비게이션에 표시한다', async ({ page }) => {
    await page.goto('/retrospect/');

    await expect(nav(page).getByRole('link', { name: '회고' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(
      nav(page).getByRole('link', { name: '이력서' }),
    ).not.toHaveAttribute('aria-current', 'page');
  });

  test('회고 목록에서 상세로 들어간다', async ({ page }) => {
    await page.goto('/retrospect/');

    const first = page.locator('main ul a[href^="/retrospect/"]').first();
    const href = await first.getAttribute('href');
    await first.click();

    await expect(page).toHaveURL(href as string);
    await expect(page.locator('article h1')).toBeVisible();
    await expect(page.locator('article .prose')).not.toBeEmpty();
  });
});

test.describe('테마 토글 (Svelte 아일랜드)', () => {
  test('클릭하면 테마가 바뀌고 새로고침해도 유지된다', async ({ page }) => {
    await page.goto('/');
    await hydrated(page, 'ThemeToggle');

    const before = await theme(page);
    await page.getByRole('button', { name: /모드로 전환$/ }).click();

    const after = await theme(page);
    expect(after).not.toBe(before);
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(
      after,
    );

    // FOUC 방지 인라인 스크립트가 첫 페인트 전에 같은 값을 복원해야 한다
    await page.reload();
    expect(await theme(page)).toBe(after);
  });

  test('저장된 테마가 있으면 그 값으로 그려진다', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await page.goto('/');

    // 인라인 스크립트가 먼저 <html>을 칠하고,
    expect(await theme(page)).toBe('dark');

    // 하이드레이션된 버튼이 그 상태를 따라잡는다 (SSR 시점엔 light로 그려진다)
    await hydrated(page, 'ThemeToggle');
    await expect(
      page.getByRole('button', { name: '라이트 모드로 전환' }),
    ).toBeVisible();
  });
});

test.describe('검색 (React 아일랜드)', () => {
  const results = (page: Page) => page.locator('[aria-live="polite"] a');

  test('하이드레이션 후 제목으로 거른다', async ({ page }) => {
    await page.goto('/retrospect/');
    await hydrated(page, 'PostSearch');

    await page.getByRole('searchbox', { name: '회고 검색' }).fill('아일랜드');

    await expect(results(page)).toHaveCount(1);
    await expect(results(page).first()).toContainText('아일랜드');
  });

  test('결과가 없으면 안내를 보여준다', async ({ page }) => {
    await page.goto('/retrospect/');
    await hydrated(page, 'PostSearch');

    await page.getByRole('searchbox', { name: '회고 검색' }).fill('없는글');

    await expect(page.locator('[aria-live="polite"]')).toContainText('없는글');
    await expect(results(page)).toHaveCount(0);
  });
});

test.describe('점진적 향상', () => {
  test.use({ javaScriptEnabled: false });

  test('JS가 없어도 콘텐츠 전체가 보인다', async ({ page }) => {
    await page.goto('/retrospect/');

    // 정적 목록은 아일랜드와 무관하게 서버에서 이미 그려져 있다
    await expect(
      page.locator('main ul a[href^="/retrospect/"]').first(),
    ).toBeVisible();

    await page.goto('/');
    await expect(page.locator('h1')).toContainText('sbjang의 홈');
  });
});

import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import ThemeToggle from './theme-toggle.svelte';

// 레이아웃의 인라인 스크립트가 첫 페인트 전에 심어두는 값을 흉내낸다
const setDocumentTheme = (theme: string | undefined) => {
  if (theme === undefined) delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
};

const button = () => screen.getByRole('button');

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    setDocumentTheme(undefined);
  });

  it('초기 상태를 <html data-theme>에서 읽는다', () => {
    setDocumentTheme('dark');
    render(ThemeToggle);

    // 다크일 때 버튼은 "라이트로 갈 수 있다"고 알려야 한다
    expect(button()).toHaveAccessibleName('라이트 모드로 전환');
  });

  it('data-theme이 없으면 라이트로 시작한다', () => {
    render(ThemeToggle);

    expect(button()).toHaveAccessibleName('다크 모드로 전환');
  });

  it('클릭하면 <html data-theme>과 localStorage를 함께 갱신한다', async () => {
    setDocumentTheme('light');
    render(ThemeToggle);

    await fireEvent.click(button());

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(button()).toHaveAccessibleName('라이트 모드로 전환');
  });

  it('두 번 누르면 원래 테마로 돌아온다', async () => {
    setDocumentTheme('light');
    render(ThemeToggle);

    await fireEvent.click(button());
    await fireEvent.click(button());

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('아이콘은 장식이라 접근성 이름에 끼어들지 않는다', () => {
    setDocumentTheme('light');
    render(ThemeToggle);

    const svg = button().querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});

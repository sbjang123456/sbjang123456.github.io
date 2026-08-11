<script>
// 초기 테마는 레이아웃의 인라인 스크립트가 이미 <html data-theme>에 반영해둔 값.
// 프리렌더(SSR) 시점에는 document가 없으므로 가드한다.
let theme = $state(
  typeof document === 'undefined'
    ? 'light'
    : (document.documentElement.dataset.theme ?? 'light'),
);

function toggle() {
  theme = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
}
</script>

<button type="button" onclick={toggle} aria-label="테마 전환">
  {theme === 'dark' ? '🌙 다크' : '☀️ 라이트'}
</button>

<style>
  button {
    background: none;
    border: 1px solid var(--border);
    border-radius: 0.375rem;
    color: inherit;
    cursor: pointer;
    font: inherit;
    padding: 0.25rem 0.625rem;
  }
</style>

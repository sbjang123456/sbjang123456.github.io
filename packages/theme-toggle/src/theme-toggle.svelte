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

// shadcn Button의 `ghost` + `icon` 변형과 동일한 클래스.
// React 런타임을 들이지 않으려고 buttonVariants()를 import하지 않고 문자열로 둔다.
const buttonClass =
  'inline-flex size-9 shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-accent/50 [&_svg]:pointer-events-none [&_svg]:shrink-0';
</script>

<button
  type="button"
  onclick={toggle}
  class={buttonClass}
  aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
  title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
>
  {#if theme === 'dark'}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  {:else}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  {/if}
</button>

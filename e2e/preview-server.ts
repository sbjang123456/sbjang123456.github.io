import { execFileSync } from 'node:child_process';

/**
 * `astro dev`의 기본 포트(4321)를 피한다. 같은 포트를 쓰면 켜 둔 dev 서버를
 * 그대로 붙잡는데, dev는 `dist/`를 서빙하지 않아 빌드 산출물(og PNG,
 * resume.pdf)이 404 HTML로 돌아온다.
 */
const HOST = '127.0.0.1';
const PORT = 4322;

/** IP를 박아 둔다 — `localhost`는 IPv4/IPv6 어느 쪽으로 풀리느냐에 따라 붙는 곳이 달라진다. */
export const PREVIEW_URL = `http://${HOST}:${PORT}`;

const astroPreview = (...args: string[]) =>
  execFileSync(
    'pnpm',
    ['--filter', '@site/main', 'exec', 'astro', 'preview', ...args],
    // 실패해도 메시지가 남아야 CI에서 원인을 본다. 성공 시 출력은 두 줄뿐이다.
    { stdio: 'inherit' },
  );

/**
 * preview 데몬을 열고, 테스트가 끝나면 닫는다.
 *
 * Playwright의 `webServer`를 쓰지 않는 이유가 둘이다. `astro preview`는 부모를
 * 죽여도 혼자 살아남아 포트를 붙들고(Playwright가 매 실행마다 하나씩 흘린다),
 * 프로젝트당 하나만 도는 데몬이라 그 찌꺼기가 남아 있으면 다음 실행의 preview는
 * 포트를 바꿔도 "already running"만 남기고 즉시 끝난다 — `webServer exited early`다.
 *
 * 대신 astro가 주는 데몬 명령을 그대로 쓴다. `stop`은 떠 있지 않아도 0으로
 * 끝나고, `--background`는 리슨을 시작한 뒤에 반환하므로 별도의 준비 대기가 없다.
 */
export default function globalSetup() {
  astroPreview('stop');
  astroPreview('--background', '--host', HOST, '--port', String(PORT));

  return () => astroPreview('stop');
}

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PostSearch, type PostSummary } from './post-search';

const posts: PostSummary[] = [
  {
    id: 'pivot',
    title: 'Astro 아일랜드로 갈아타기',
    date: '2026-08-11',
    url: '/retrospect/pivot/',
  },
  {
    id: 'mfa',
    title: '런타임 MFA 스캐폴딩을 시작하며',
    date: '2026-08-10',
    url: '/retrospect/mfa/',
  },
];

const searchbox = () => screen.getByRole('searchbox', { name: '회고 검색' });

describe('PostSearch', () => {
  it('검색어가 없으면 결과 목록을 렌더하지 않는다', () => {
    render(<PostSearch posts={posts} />);

    expect(searchbox()).toHaveValue('');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('제목 부분일치로 거른다', async () => {
    render(<PostSearch posts={posts} />);
    await userEvent.type(searchbox(), '아일랜드');

    expect(
      screen.getByRole('link', { name: /Astro 아일랜드로 갈아타기/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /MFA/ })).not.toBeInTheDocument();
  });

  it('대소문자를 무시한다', async () => {
    render(<PostSearch posts={posts} />);
    await userEvent.type(searchbox(), 'mfa');

    expect(
      screen.getByRole('link', { name: /런타임 MFA 스캐폴딩을 시작하며/ }),
    ).toBeInTheDocument();
  });

  it('공백만 입력하면 검색하지 않는다', async () => {
    render(<PostSearch posts={posts} />);
    await userEvent.type(searchbox(), '   ');

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('결과가 없으면 검색어를 담은 안내를 보여준다', async () => {
    render(<PostSearch posts={posts} />);
    await userEvent.type(searchbox(), '없는글');

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(/없는글/)).toBeInTheDocument();
  });

  it('결과 링크가 url과 date를 그대로 싣는다', async () => {
    render(<PostSearch posts={posts} />);
    await userEvent.type(searchbox(), '아일랜드');

    const link = screen.getByRole('link', {
      name: /Astro 아일랜드로 갈아타기/,
    });
    expect(link).toHaveAttribute('href', '/retrospect/pivot/');
    expect(link.querySelector('time')).toHaveAttribute(
      'datetime',
      '2026-08-11',
    );
  });

  it('결과 영역이 스크린리더에 갱신을 알린다', async () => {
    render(<PostSearch posts={posts} />);
    await userEvent.type(searchbox(), '아일랜드');

    // 검색창의 aria-controls가 결과 컨테이너를 가리키고, 그 컨테이너가 live region이다
    const controls = searchbox().getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(document.getElementById(controls as string)).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });
});

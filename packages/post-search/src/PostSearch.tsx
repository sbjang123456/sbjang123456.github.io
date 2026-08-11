import { useMemo, useState } from 'react';

export type PostSummary = {
  id: string;
  title: string;
  date: string;
  url: string;
};

/**
 * 회고 목록 검색 아일랜드.
 * 정적 목록 위에 얹히는 점진적 향상 — JS가 없어도 목록 자체는 보인다.
 */
export function PostSearch({ posts }: { posts: PostSummary[] }) {
  const [query, setQuery] = useState('');
  const trimmed = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!trimmed) return [];
    return posts.filter((post) => post.title.toLowerCase().includes(trimmed));
  }, [trimmed, posts]);

  return (
    <div className="post-search">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="글 제목 검색…"
        aria-label="회고 검색"
      />
      {trimmed && (
        <ul>
          {results.length ? (
            results.map((post) => (
              <li key={post.id}>
                <a href={post.url}>{post.title}</a>{' '}
                <time dateTime={post.date}>{post.date}</time>
              </li>
            ))
          ) : (
            <li>"{query.trim()}"에 대한 결과가 없습니다</li>
          )}
        </ul>
      )}
    </div>
  );
}

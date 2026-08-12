import { Input } from '@site/ui/components/input';
import { useId, useMemo, useState } from 'react';

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
  const listId = useId();
  const trimmed = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!trimmed) return [];
    return posts.filter((post) => post.title.toLowerCase().includes(trimmed));
  }, [trimmed, posts]);

  return (
    <div className="flex flex-col gap-3">
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="글 제목 검색…"
        aria-label="회고 검색"
        aria-controls={listId}
      />

      {trimmed && (
        <div
          id={listId}
          aria-live="polite"
          className="rounded-xl border bg-card p-1 text-card-foreground shadow-sm"
        >
          {results.length ? (
            <ul className="flex flex-col">
              {results.map((post) => (
                <li key={post.id}>
                  <a
                    href={post.url}
                    className="flex items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <span className="font-medium">{post.title}</span>
                    <time
                      dateTime={post.date}
                      className="shrink-0 text-xs text-muted-foreground tabular-nums"
                    >
                      {post.date}
                    </time>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              “{query.trim()}”에 대한 결과가 없습니다
            </p>
          )}
        </div>
      )}
    </div>
  );
}

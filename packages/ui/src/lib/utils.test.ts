import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('클래스를 공백으로 잇는다', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center');
  });

  it('falsy 값을 버린다', () => {
    expect(cn('flex', false, undefined, null, '', 'gap-2')).toBe('flex gap-2');
  });

  it('조건부 객체 표기를 지원한다', () => {
    expect(cn('flex', { 'gap-2': true, hidden: false })).toBe('flex gap-2');
  });

  it('같은 Tailwind 속성이 겹치면 뒤쪽이 이긴다', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('다른 속성끼리는 둘 다 남는다', () => {
    // text-sm은 글자 크기, text-muted-foreground는 색 — 충돌하지 않는다
    expect(cn('text-sm text-muted-foreground', 'text-lg')).toBe(
      'text-muted-foreground text-lg',
    );
  });

  it('변형(variant)이 붙은 클래스는 별개로 취급한다', () => {
    expect(cn('bg-accent', 'hover:bg-accent')).toBe(
      'bg-accent hover:bg-accent',
    );
  });

  it('소비 측 className이 컴포넌트 기본값을 덮어쓴다', () => {
    // shadcn 컴포넌트가 cn(기본값, className) 형태로 쓰는 실제 패턴
    expect(cn('rounded-xl border py-6', 'rounded-none')).toBe(
      'border py-6 rounded-none',
    );
  });
});

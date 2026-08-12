import { describe, expect, it } from 'vitest';
import { formatPeriod, resume } from './data';

describe('formatPeriod', () => {
  it('종료일이 있으면 기간을 잇는다', () => {
    expect(formatPeriod({ from: '2023-03', to: '2025-08' })).toBe(
      '2023-03 — 2025-08',
    );
  });

  it('종료일이 없으면 재직 중으로 본다', () => {
    expect(formatPeriod({ from: '2025-09' })).toBe('2025-09 — 재직 중');
  });
});

describe('resume 데이터', () => {
  it('스택 그룹이 비어 있지 않다', () => {
    expect(resume.stack.length).toBeGreaterThan(0);
    for (const group of resume.stack) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });

  it('경력의 기간이 YYYY-MM 형식이다', () => {
    for (const career of resume.careers) {
      expect(career.from).toMatch(/^\d{4}-\d{2}$/);
      if (career.to) expect(career.to).toMatch(/^\d{4}-\d{2}$/);
    }
  });
});

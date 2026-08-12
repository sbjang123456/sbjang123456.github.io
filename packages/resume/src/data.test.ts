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

  it('경력을 최신순으로 둔다', () => {
    const from = resume.careers.map((career) => career.from);

    expect(from).toEqual([...from].sort().reverse());
  });

  it('경력마다 한 일이 적혀 있다', () => {
    expect(resume.careers.length).toBeGreaterThan(0);
    for (const career of resume.careers) {
      expect(career.highlights.length).toBeGreaterThan(0);
    }
  });

  it('재직 중인 경력은 가장 최근 하나뿐이다', () => {
    // `to`가 없다는 건 현재 다니는 곳이라는 뜻 — 과거 경력에 빠뜨리면 잡는다
    const current = resume.careers.filter((career) => !career.to);

    expect(current).toHaveLength(1);
    expect(current[0]).toBe(resume.careers[0]);
  });

  it('연락처가 링크로 열린다', () => {
    expect(resume.contacts.length).toBeGreaterThan(0);
    for (const contact of resume.contacts) {
      expect(contact.href).toMatch(/^(https:\/\/|mailto:)/);
    }
  });

  it('소개가 문단으로 나뉘어 있다', () => {
    expect(resume.summary.length).toBeGreaterThan(0);
    for (const paragraph of resume.summary) {
      expect(paragraph.trim()).not.toBe('');
    }
  });
});

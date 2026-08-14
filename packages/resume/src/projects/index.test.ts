import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resume } from '../data';
import { generatedProjects } from './generated/projects';
import { findProject, projectSlugs, projects, projectsByOrg } from './index';
import { manualProjects } from './manual';

// 상세는 기계가 만든다(`scripts/import-notion.ts`). 사람이 쓴 data.ts와
// 어긋나면 화면이 조용히 비므로, 여기서 두 데이터를 양방향으로 맞춰 본다.
const names = resume.careers.flatMap((career) => career.projects);

const assetPath = (file: string) =>
  fileURLToPath(new URL(`../assets/projects/${file}`, import.meta.url));

describe('프로젝트 상세', () => {
  it('data.ts의 프로젝트 수만큼 있다', () => {
    expect(projects).toHaveLength(names.length);
  });

  it('수기 상세와 생성 상세의 이름이 겹치지 않는다', () => {
    // 수기 프로젝트가 나중에 Notion에도 생기면 상세가 둘로 늘어 개수 검사가
    // 깨진다. 그때 원인이 바로 보이도록 여기서 먼저 잡는다.
    const generated = new Set(generatedProjects.map((project) => project.name));
    const both = manualProjects
      .map((project) => project.name)
      .filter((name) => generated.has(name));

    expect(both).toEqual([]);
  });

  it('슬러그가 유일하고 ascii 케밥 케이스다', () => {
    const slugs = projects.map((project) => project.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it('data.ts의 모든 프로젝트에 상세가 있다', () => {
    const missing = names.filter(
      (name) => !projects.some((project) => project.name === name),
    );

    expect(missing).toEqual([]);
  });

  it('모든 상세가 data.ts의 어느 경력엔가 속한다', () => {
    const orphans = projects
      .filter((project) => !names.includes(project.name))
      .map((project) => project.name);

    expect(orphans).toEqual([]);
  });

  it('상세의 org가 그 프로젝트를 담은 경력의 slug와 같다', () => {
    for (const career of resume.careers) {
      for (const name of career.projects) {
        expect(findProject(name).org).toBe(career.slug);
      }
    }
  });

  it('회사별 순서가 data.ts의 표시 순서와 같다', () => {
    for (const career of resume.careers) {
      const ordered = projectsByOrg.get(career.slug) ?? [];

      expect(ordered.map((project) => project.name)).toEqual(career.projects);
    }
  });

  it('요약이 비어 있지 않다', () => {
    for (const project of projects) {
      expect(project.summary.trim(), project.name).not.toBe('');
    }
  });

  it('이미지 블록이 가리키는 파일이 실제로 있다', () => {
    const files = projects.flatMap((project) =>
      project.sections.flatMap((section) =>
        section.blocks.flatMap((block) =>
          block.kind === 'image' ? [block.file] : [],
        ),
      ),
    );

    for (const file of files) {
      expect(file, file).toMatch(/^[a-z0-9-]+\.webp$/);
      expect(existsSync(assetPath(file)), file).toBe(true);
    }
  });

  it('본문에 미해결 Notion 멘션이 남아 있지 않다', () => {
    // 페이지 멘션은 본문에 "‣" 한 글자 + UUID 어노테이션으로 온다.
    // 변환에서 놓치면 의미 없는 글자나 날 UUID가 화면에 그대로 나간다.
    const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
    const text = JSON.stringify(projects);

    expect(text).not.toMatch(uuid);
    expect(text).not.toContain('‣');
  });

  it('slugs.ts에 쓰이지 않는 항목이 없다', () => {
    const orphans = Object.keys(projectSlugs).filter(
      (name) => !names.includes(name),
    );

    expect(orphans).toEqual([]);
  });

  it('data.ts의 모든 프로젝트에 슬러그가 정해져 있다', () => {
    const missing = names.filter((name) => !projectSlugs[name]);

    expect(missing).toEqual([]);
  });
});

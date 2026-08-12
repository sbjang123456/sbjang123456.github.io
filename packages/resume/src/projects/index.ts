import { generatedProjects } from './generated/projects';
import type { Project } from './types';

export { projectSlugs } from './slugs';
export type {
  Project,
  ProjectBlock,
  ProjectSection,
  TaskNode,
} from './types';

/** Notion에서 가져온 프로젝트 상세 전부. 순서는 이력서 표시 순서와 같다. */
export const projects: Project[] = generatedProjects;

export const projectsByName = new Map(projects.map((p) => [p.name, p]));

/** 회사 슬러그(`Career.slug`) → 그 회사의 프로젝트들. */
export const projectsByOrg = projects.reduce<Map<string, Project[]>>(
  (acc, project) => {
    const bucket = acc.get(project.org);
    if (bucket) bucket.push(project);
    else acc.set(project.org, [project]);
    return acc;
  },
  new Map(),
);

/**
 * 이름으로 상세를 찾는다. 없으면 이름을 담아 던진다 —
 * `data.ts`와 상세가 어긋난 걸 조용히 빈 화면으로 넘기지 않으려는 것.
 */
export function findProject(name: string): Project {
  const project = projectsByName.get(name);
  if (!project) throw new Error(`프로젝트 상세를 찾을 수 없다: ${name}`);
  return project;
}

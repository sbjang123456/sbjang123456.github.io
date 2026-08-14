import { resume } from '../data';
import { generatedProjects } from './generated/projects';
import { manualProjects } from './manual';
import type { Project } from './types';

export { projectSlugs } from './slugs';
export type {
  Project,
  ProjectBlock,
  ProjectSection,
  TaskNode,
} from './types';

// 임포터가 생성물을 data.ts 순서로 정렬해 두지만 수기 상세는 그 밖에 있다.
// 둘을 합칠 때 여기서 한 번 더 맞춰야 표시 순서가 흐트러지지 않는다.
const order = resume.careers.flatMap((career) => career.projects);

/** 프로젝트 상세 전부(Notion 생성 + 수기). 순서는 이력서 표시 순서와 같다. */
export const projects: Project[] = [
  ...generatedProjects,
  ...manualProjects,
].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

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

import TodoistApiREST, { TodoistProject } from "@kory-smith/todoist-api-ts"
import { keyBy } from "lodash";


const todoist = new TodoistApiREST(process.env.TODOIST_TOKEN!);

async function getAllProjects() {
  return await todoist.getAllProjects();
}

function getProjectIdFromName(projectName: string, projects: TodoistProject[]) {
  const project = projects.find((project) => project.name === projectName);
  return project?.id;
}

const projects: TodoistProject[] = await getAllProjects();

const WORK_PROJECT_ID = getProjectIdFromName("Work", projects);
const PERSONAL_PROJECT_ID = getProjectIdFromName("Personal", projects);

const projectsWithHelperData = projects.map((project) => {
  return {
    ...project,
    work: project.parent_id === WORK_PROJECT_ID,
    personal: project.parent_id === PERSONAL_PROJECT_ID,
  };
});

const onlyRelevantProjects = projectsWithHelperData.filter(
  (project) => project.work || project.personal
);

export const allTodoistProjectsKeyed = keyBy(
  onlyRelevantProjects,
  (project) => project.name
);

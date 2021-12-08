import { TodoistApi, Project } from "@doist/todoist-api-typescript";
import { keyBy } from "lodash";

const todoist = new TodoistApi(process.env.TODOIST_TOKEN!);

async function getAllProjects() {
  return await todoist.getProjects();
}

function getProjectIdFromName(projectName: string, projects: Project[]) {
  const project = projects.find((project) => project.name === projectName);
  return project?.id;
}

export const getAllTodoistProjectsKeyed = async () => {
  const projects = await getAllProjects();
  const WORK_PROJECT_ID = getProjectIdFromName("Work", projects);
  const PERSONAL_PROJECT_ID = getProjectIdFromName("Personal", projects);

  const projectsWithHelperData = projects.map((project) => {
    return {
      ...project,
      work: project.parentId === WORK_PROJECT_ID,
      personal: project.parentId === PERSONAL_PROJECT_ID,
    };
  });

  // TODO: RENAME ME
  const onlyRelevantProjects = projectsWithHelperData.filter(
    (project) => project.work || project.personal
  );

  return keyBy(onlyRelevantProjects, (project) => project.name);
};

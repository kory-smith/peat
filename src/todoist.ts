import { TodoistApi, type PersonalProject } from "@doist/todoist-api-typescript";
import { Dictionary, keyBy } from "lodash";

const todoist = new TodoistApi(process.env.TODOIST_TOKEN!);

async function getAllProjects(): Promise<PersonalProject[]> {
  const response = await todoist.getProjects();
  return response.results.filter(
    (p): p is PersonalProject => "parentId" in p
  );
}

function getProjectIdFromName(projectName: string, projects: PersonalProject[]) {
  const project = projects.find((project) => project.name === projectName);
  return project?.id;
}

export async function addURLToTodoistProjectAsTask(
  url: string,
  projectId: string
  ) {
  const response = await todoist.getLabels()
  const headerNoteLabel = response.results.find(label => label.name === "Header/Note")!
  return await todoist.addTask({
    content: `* [Link to Notion project](${url})`,
    projectId,
    order: 0,
    labels: [headerNoteLabel.name]
  });
}

export type enhancedTodoistProject = PersonalProject & {
  work: Boolean;
  personal: Boolean;
};

export const getAllTodoistProjectsKeyed = async (): Promise<
  Dictionary<enhancedTodoistProject>
> => {
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

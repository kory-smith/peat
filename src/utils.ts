import { Dictionary } from "lodash";
import {
  applyStatusToNotionPage,
  createNotionChildPage,
  createResourceDatabase,
  getAllNotionProjectsKeyed,
  MassagedNotionDatabase,
  PROJECTS_DATABASE_ID,
  WROJECTS_DATABASE_ID,
} from "./notion";
import {
  addURLToTodoistProjectAsTask,
  enhancedTodoistProject,
} from "./todoist";
import assert from "assert";

export const createMasterObject = (
  exclusions: string[],
  ...allProjects: Array<
    | Dictionary<MassagedNotionDatabase>
    | Dictionary<enhancedTodoistProject>
    | Dictionary<any>
  >
) => {
  const masterObject: any = {};
  for (const projectDictionary of allProjects) {
    for (const key in projectDictionary) {
      if (key in masterObject) continue;
      masterObject[key] = { directives: [] };
    }
  }

  for (const projectDictionary of allProjects) {
    for (const key in projectDictionary) {
      const currentProject = projectDictionary[key];
      if ("commentCount" in currentProject) {
        masterObject[key]["todoist"] = currentProject;
      }
      if ("status" in currentProject) {
        masterObject[key]["notion"] = currentProject;
      }
    }
  }
  for (const exclusion of exclusions) {
    delete masterObject[exclusion];
  }
  return masterObject;
};

export const getProjectTitlesFromProjects = (
  todoistProjects: Dictionary<enhancedTodoistProject>,
  notionProjects: Dictionary<MassagedNotionDatabase>,
  exclusions?: string[]
) => {
  const mergedProductTitles = [
    ...Object.keys(todoistProjects),
    ...Object.keys(notionProjects),
  ];

  const uniqueProjectTitles = new Set<string>(mergedProductTitles);

  if (exclusions) {
    exclusions.forEach((excludedProjectName) =>
      uniqueProjectTitles.delete(excludedProjectName)
    );
  }

  const uniqueProjectTitlesArray = Array.from(uniqueProjectTitles);

  return uniqueProjectTitlesArray;
};

enum directives {
  doNothing,
  createInNotionAndLinkInTodoist,
  markCompleteInNotion,
  markInProgressInNotion,
}

type ProjectsWithDirectives = {
  [project: string]: {
    directives: directives[];
    notionId?: string;
    todoistId?: number;
    work?: Boolean;
  };
};

export const generateDirectives = (masterObj: any) => {
  const executionList: any = [];
  for (const projectTitle in masterObj) {
    executionList[projectTitle] = { directives: [] };
    const currentExecutionObj = executionList[projectTitle];
    const currentProject = masterObj[projectTitle];
    const todoistProjectExists = "todoist" in currentProject;

    const notionProjectExists = "notion" in currentProject;
    let notionProjectIsComplete;
    let notionProjectIsInProgress;

    if (notionProjectExists) {
      assert(
        currentProject.notion.status === "In-progress" ||
          currentProject.notion.status === "Completed",
        "Notion project status should either be 'Completed' or 'In-progress'"
      );
      notionProjectIsComplete = currentProject.notion.status === "Completed";
      notionProjectIsInProgress =
        currentProject.notion.status === "In-progress";
    }
    if (todoistProjectExists && !notionProjectExists) {
      currentExecutionObj.directives.push(
        directives.createInNotionAndLinkInTodoist
      );
      currentExecutionObj.todoistId = currentProject.todoist.id;
      currentExecutionObj.work = currentProject.todoist.work;
    }
    if (!todoistProjectExists && notionProjectIsInProgress) {
      currentExecutionObj.directives.push(directives.markCompleteInNotion),
        (currentExecutionObj.notionId = currentProject.notion.id);
    }
    if (todoistProjectExists && notionProjectIsComplete) {
      currentExecutionObj.directives.push(directives.markInProgressInNotion);
      currentExecutionObj.notionId = currentProject.notion.id;
    }
  }
  return executionList;
};

export const executeDirectives = async (
  projectsWithDirectives: ProjectsWithDirectives
) => {
  for (const projectName in projectsWithDirectives) {
    const project = projectsWithDirectives[projectName];
    for (const directive of project.directives) {
      switch (directive) {
        case directives.createInNotionAndLinkInTodoist:
          if (project.todoistId) {
            const databaseIdToUse = project.work
              ? WROJECTS_DATABASE_ID
              : PROJECTS_DATABASE_ID;

            // Double-check if project exists before creating (race condition protection)
            const freshNotionProjects = await getAllNotionProjectsKeyed();
            if (projectName in freshNotionProjects) {
              console.log(`Project "${projectName}" already exists in Notion. Skipping creation.`);
              break;
            }

            const createNotionPageResponse: any = await createNotionChildPage(
              databaseIdToUse,
              projectName,
              "In-progress"
            );
            createResourceDatabase(createNotionPageResponse.id);
            const nativeURL = createNotionPageResponse.url.replace(
              "https://www.notion.so/",
              "notion://native/"
            );
            const _ = await addURLToTodoistProjectAsTask(
              nativeURL,
              project.todoistId
            );
            break;
          }
        case directives.markInProgressInNotion:
          if (project.notionId) {
            await applyStatusToNotionPage(project.notionId, "In-progress");
            break;
          }
        case directives.markCompleteInNotion:
          if (project.notionId) {
            await applyStatusToNotionPage(project.notionId, "Completed");
            break;
          }
          break;
        default:
          throw "Expected directive. Got nothing";
      }
    }
  }
};

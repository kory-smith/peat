import { Dictionary } from "lodash";
import {
  applyStatusToNotionPage,
  createNotionChildPage,
  createResourceDatabase,
  MassagedNotionDatabase,
  PROJECTS_DATABASE_ID,
  WROJECTS_DATABASE_ID,
} from "./notion";
import {
  addURLToTodoistProjectAsTask,
  enhancedTodoistProject,
} from "./todoist";
import assert from "assert";
import { Project } from "@doist/todoist-api-typescript";
import { setTogglProjectActiveState, createTogglProject } from "./toggl";

type ProjectCollection = {
  [appName: string]:
    | Dictionary<MassagedNotionDatabase>
    | Dictionary<enhancedTodoistProject>
    | any;
};

const foo = {
  "Wone-offs": {
    //commentCount
    todoist: {},
    //status
    notion: {},
    //wid
    toggl: {},
  },
};

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
      if ("wid" in currentProject) {
        masterObject[key]["toggl"] = currentProject;
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
  togglProjects: Dictionary<any>,
  exclusions?: string[]
) => {
  const mergedProductTitles = [
    ...Object.keys(todoistProjects),
    ...Object.keys(notionProjects),
    ...Object.keys(togglProjects),
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
  createInToggl,
  markActiveInToggl,
  markInactiveInToggl,
}

type ProjectsWithDirectives = {
  [project: string]: {
    directives: directives[];
    notionId?: string;
    todoistId?: number;
    togglId?: number;
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

    const togglProjectExists = "toggl" in currentProject;
    let togglProjectIsInProgress;
    if (togglProjectExists) {
      togglProjectIsInProgress = currentProject.toggl.active;
    }

    if (
      !todoistProjectExists &&
      togglProjectExists &&
      togglProjectIsInProgress
    ) {
      currentExecutionObj.directives.push(directives.markInactiveInToggl);
      currentExecutionObj.togglId = currentProject.toggl.id;
    }
    if (
      todoistProjectExists &&
      togglProjectExists &&
      !togglProjectIsInProgress
    ) {
      currentExecutionObj.directives.push(directives.markActiveInToggl);
      currentExecutionObj.togglId = currentProject.toggl.id;
    }
    if (todoistProjectExists && !togglProjectExists) {
      currentExecutionObj.directives.push(directives.createInToggl);
      currentExecutionObj.work = currentProject.todoist.work;
    }
  }
  return executionList;
};

export const executeDirectives = async (
  projectsWithDirectives: ProjectsWithDirectives
) => {
  for (const projectName in projectsWithDirectives) {
    const project = projectsWithDirectives[projectName];
    project.directives.forEach(async (directive) => {
      switch (directive) {
        case directives.createInToggl:
          await createTogglProject(projectName, { work: project.work! });
          break;
        case directives.markActiveInToggl:
          await setTogglProjectActiveState(project.togglId!, "active");
          break;
        case directives.markInactiveInToggl:
          await setTogglProjectActiveState(project.togglId!, "inactive");
          break;
        case directives.createInNotionAndLinkInTodoist:
          if (project.todoistId) {
            const databaseIdToUse = project.work
              ? WROJECTS_DATABASE_ID
              : PROJECTS_DATABASE_ID;

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
            applyStatusToNotionPage(project.notionId, "In-progress");
            break;
          }
        case directives.markCompleteInNotion:
          if (project.notionId) {
            applyStatusToNotionPage(project.notionId, "Completed");
            break;
          }
          break;
        default:
          throw "Expected directive. Got nothing";
      }
    });
  }
};

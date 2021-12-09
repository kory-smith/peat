import { Dictionary } from "lodash";
import {
  createNotionChildPage,
  getAllNotionProjectsKeyed,
  MassagedNotionDatabase,
  notionClient,
  PROJECTS_DATABASE_ID,
  WROJECTS_DATABASE_ID,
} from "./notion";
import { enhancedTodoistProject, getAllTodoistProjectsKeyed } from "./todoist";
import assert from "assert";
import got from "got"

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
  createInNotionAndLinkInTodoist,
  markCompleteInNotion,
  markInProgressInNotion,
}

type ProjectsWithDirectives = {
  [project: string]: {
    directives: directives[];
    notionId?: string;
    todoistId?: number;
    work?: Boolean
  };
};

export const generateDirectives = (
  projectTitles: string[],
  keyedTodoistProjects: Dictionary<enhancedTodoistProject>,
  keyedNotionProjects: Dictionary<MassagedNotionDatabase>
) => {
  const executionList: ProjectsWithDirectives = {};

  for (let projectTitle of projectTitles) {
    const todoistProjectExists = projectTitle in keyedTodoistProjects;
    const notionProjectExists = projectTitle in keyedNotionProjects;
    let notionProjectIsComplete;
    let notionProjectIsInProgress;
    if (notionProjectExists) {
      assert(
        keyedNotionProjects[projectTitle].status === "In-progress" ||
          keyedNotionProjects[projectTitle].status === "Completed",
        "Notion project status should either be 'Completed' or 'In-progress'"
      );
      notionProjectIsComplete =
        keyedNotionProjects[projectTitle].status === "Completed";
      notionProjectIsInProgress =
        keyedNotionProjects[projectTitle].status === "In-progress";
    }

    if (!todoistProjectExists && !notionProjectExists) continue;
    if (!todoistProjectExists && notionProjectIsComplete) continue;
    if (todoistProjectExists && notionProjectIsInProgress) continue;

    if (todoistProjectExists && !notionProjectExists) {
      executionList[projectTitle] = { 
        directives: [directives.createInNotionAndLinkInTodoist], 
        todoistId: keyedTodoistProjects[projectTitle].id,
        work: keyedTodoistProjects[projectTitle].work,
      };
    }
    if (!todoistProjectExists && notionProjectIsInProgress) {
      executionList[projectTitle] = {
        directives: [directives.markCompleteInNotion],
				notionId: keyedNotionProjects[projectTitle].id
      };
    }
    if (todoistProjectExists && notionProjectIsComplete) {
      executionList[projectTitle] = {
        directives: [directives.markInProgressInNotion],
				notionId: keyedNotionProjects[projectTitle].id
      };
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
        case directives.createInNotionAndLinkInTodoist:
          if (project.work && project.todoistId) {
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

const applyStatusToNotionPage = async (pageId: string, status: string) => {
  return await notionClient.pages.update({
    archived: false,
    page_id: pageId,
    properties: {
      Status: {
        type: "select",
        select: {
          name: status,
        },
      },
    },
  });
};

function createResourceDatabase(notionId: string) {
  notionClient.databases.create({
    parent: {
      page_id: notionId
    },
    title: [
      {
        type: "text",
        text: {
          content: "Resources",
        },
      },
    ],
    properties: {
      Name: {
        title: {},
      },
      Description: {
        rich_text: {},
      },
    },
  });
}

async function addURLToTodoistProjectAsTask(url: string, projectId: number) {
  return await got.post("https://api.todoist.com/rest/v1/tasks", {
    json: {
      content: `* [Link to Notion project](${url})`,
      project_id: Number(projectId),
    },
    headers: {
      Authorization: `Bearer ${process.env.TODOIST_TOKEN}`,
    },
  });
}

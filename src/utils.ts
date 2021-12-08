import { Dictionary } from "lodash";
import { getAllNotionProjectsKeyed, MassagedNotionDatabase } from "./notion";
import {enhancedTodoistProject, getAllTodoistProjectsKeyed } from "./todoist";
import assert from "assert";

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
  createInNotion,
  markCompleteInNotion,
  markInProgressInNotion,
}

export const addDirectives = async (...projects) => {
  const allTodoistProjectsKeyed = await getAllTodoistProjectsKeyed();

  const allNotionProjectsKeyed = await getAllNotionProjectsKeyed();

  const allProjectTitles = getProjectTitlesFromProjects(
    allTodoistProjectsKeyed,
    allNotionProjectsKeyed
  );

  const executionList: {
    [project: string]: number[];
  } = {};

  for (let projectTitle of allProjectTitles) {
    const todoistProjectExists = projectTitle in allTodoistProjectsKeyed;
    const notionProjectExists = projectTitle in allNotionProjectsKeyed;
    let notionProjectIsComplete;
    let notionProjectIsInProgress;
    if (notionProjectExists) {
      assert.equal(
        allNotionProjectsKeyed[projectTitle].status,
        "In-progress" || "Completed",
        "Test message"
      );
      notionProjectIsComplete =
        allNotionProjectsKeyed[projectTitle].status === "Completed";
      notionProjectIsInProgress =
        allNotionProjectsKeyed[projectTitle].status === "In-progress";
    }

    if (!todoistProjectExists && !notionProjectExists) continue;
    if (!todoistProjectExists && notionProjectIsComplete) continue;
    if (todoistProjectExists && notionProjectIsInProgress) continue;

    if (todoistProjectExists && !notionProjectExists) {
      executionList[projectTitle] = [directives.createInNotion];
    }
    if (!todoistProjectExists && notionProjectIsInProgress) {
      executionList[projectTitle] = [directives.markCompleteInNotion];
    }
    if (todoistProjectExists && notionProjectIsComplete) {
      executionList[projectTitle] = [directives.markInProgressInNotion];
    }
  }
};

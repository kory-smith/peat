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

export const generateDirectives = (
	projectTitles: string[],
	keyedTodoistProjects: Dictionary<enhancedTodoistProject>,
	keyedNotionProjects: Dictionary<MassagedNotionDatabase>
) => {
  const executionList: {
    [project: string]: directives[]
  } = {};

  for (let projectTitle of projectTitles) {
    const todoistProjectExists = projectTitle in keyedTodoistProjects;
    const notionProjectExists = projectTitle in keyedNotionProjects;
    let notionProjectIsComplete;
    let notionProjectIsInProgress;
    if (notionProjectExists) {
      assert.equal(
        keyedNotionProjects[projectTitle].status,
        "In-progress" || "Completed",
        "Test message"
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
      executionList[projectTitle] = [directives.createInNotion];
    }
    if (!todoistProjectExists && notionProjectIsInProgress) {
      executionList[projectTitle] = [directives.markCompleteInNotion];
    }
    if (todoistProjectExists && notionProjectIsComplete) {
      executionList[projectTitle] = [directives.markInProgressInNotion];
    }
  }
	return executionList
};

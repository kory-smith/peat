import { getAllTodoistProjectsKeyed } from "./todoist";
import {
  notionClient,
  createNotionChildPage,
  getAllNotionProjectsKeyed,
  WROJECTS_DATABASE_ID,
  PROJECTS_DATABASE_ID,
} from "./notion";
import got from "got";
import { executeDirectives, generateDirectives, getProjectTitlesFromProjects } from "./utils";

const doWork = async () => {
  const projectsToExclude = [
    "One-offs",
    "Wickler",
    "Someday/Maybe",
    "🎟 Pone-offs",
    "Pickler",
    "🌱 Pomeday/Maybe",
  ];

  const allTodoistProjectsKeyed = await getAllTodoistProjectsKeyed();

  const allNotionProjectsKeyed = await getAllNotionProjectsKeyed();

  const allProjectTitles = getProjectTitlesFromProjects(
    allTodoistProjectsKeyed,
    allNotionProjectsKeyed,
    projectsToExclude
  );

  const projectsWithDirectives = generateDirectives(
    allProjectTitles,
    allTodoistProjectsKeyed,
    allNotionProjectsKeyed
  );

 await executeDirectives(projectsWithDirectives)

};

doWork();

import { getAllTodoistProjectsKeyed } from "./todoist";
import { getAllNotionProjectsKeyed } from "./notion";
import {
  executeDirectives,
  generateDirectives,
  getProjectTitlesFromProjects,
} from "./utils";

const doWork = async () => {
  const projectsToExclude = [
    "Wone-offs",
    "Wickler",
    "Womeday/Maybe",
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

  await executeDirectives(projectsWithDirectives);
};

doWork();

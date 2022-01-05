import { getAllTodoistProjectsKeyed } from "./todoist";
import { getAllNotionProjectsKeyed } from "./notion";
import { getAllTogglProjectsKeyed } from "./toggl";
import {
  generateDirectives,
  createMasterObject,
  executeDirectives,
} from "./utils";

(async () => {
  const projectsToExclude = [
    "Clerical",
    "Pickler",
    "Standby",
    "Wickler",
    "Womeday/Maybe",
    "Wone-offs",
    "🌱 Pomeday/Maybe",
    "🎟 Pone-offs",
  ];

  const allTodoistProjectsKeyed = await getAllTodoistProjectsKeyed();
  const allNotionProjectsKeyed = await getAllNotionProjectsKeyed();
  const allTogglProjectsKeyed = await getAllTogglProjectsKeyed();

  const masterObj = createMasterObject(
    projectsToExclude,
    allTodoistProjectsKeyed,
    allNotionProjectsKeyed,
    allTogglProjectsKeyed
  );

  const projectsWithDirectives = generateDirectives(masterObj)

  await executeDirectives(projectsWithDirectives)
})()
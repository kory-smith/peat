import { getAllTodoistProjectsKeyed } from "./todoist";
import { getAllNotionProjectsKeyed } from "./notion";
import { getAllTogglProjectsKeyed } from "./toggl";
import {
  generateDirectives,
  createMasterObject,
  executeDirectives,
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
  const allTogglProjectsKeyed = await getAllTogglProjectsKeyed();

  const masterObj = createMasterObject(
    projectsToExclude,
    allTodoistProjectsKeyed,
    allNotionProjectsKeyed,
    allTogglProjectsKeyed
  );

  const projectsWithDirectives = generateDirectives(masterObj)

  await executeDirectives(projectsWithDirectives)
};

doWork();

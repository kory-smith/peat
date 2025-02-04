import { getAllTodoistProjectsKeyed } from "./todoist";
import { getAllNotionProjectsKeyed } from "./notion";
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

  // Sleep for a minute to tackle a race condition where the Notion API doesn't respond with the project even though it exists
  await Bun.sleep(60_000)
  const allNotionProjectsKeyed = await getAllNotionProjectsKeyed();

  const masterObj = createMasterObject(
    projectsToExclude,
    allTodoistProjectsKeyed,
    allNotionProjectsKeyed,
  );

  const projectsWithDirectives = generateDirectives(masterObj)

  await executeDirectives(projectsWithDirectives)
})()
import { getAllTodoistProjectsKeyed } from "./todoist";
import {
  notionClient,
  createNotionChildPage,
  getAllNotionProjectsKeyed,
  WROJECTS_DATABASE_ID,
  PROJECTS_DATABASE_ID,
} from "./notion";
import got from "got";
import { getProjectTitlesFromProjects } from "./utils";

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

  const allProjectTitles = getProjectTitlesFromProjects(allTodoistProjectsKeyed, allNotionProjectsKeyed, projectsToExclude)

  // This does the updating
  for (let project in masterObject) {
    const { notion, todoist } = masterObject[project];
    // There's not a page and we should create one
    if (
      !("color" in todoist) &&
      todoist.status === "In-progress" &&
      !notion.status
    ) {
      const databaseIdToUse = todoist.work
        ? WROJECTS_DATABASE_ID
        : PROJECTS_DATABASE_ID;
      const createNotionPageResponse: any = await createNotionChildPage(
        databaseIdToUse,
        todoist.name,
        "In-progress"
      );
      // Might as well make the update while we're here...
      const _ = await got
        .post("https://api.todoist.com/rest/v1/tasks", {
          json: {
            content: `* [Link to Notion project](${createNotionPageResponse.url})`,
            project_id: Number(todoist.id),
          },
          headers: {
            Authorization: `Bearer ${process.env.TODOIST_TOKEN}`,
          },
        })
        .catch((e) => console.log(e));
    } else if (
      todoist.status === "Completed" &&
      notion.status !== "Completed"
    ) {
      notionClient.pages.update({
        archived: false,
        page_id: notion.id,
        properties: {
          Status: {
            type: "select",
            select: {
              name: "Completed",
            },
          },
        },
      });
    } else if (
      todoist.status === "In-progress" &&
      notion.status !== "In-progress"
    ) {
      notionClient.pages.update({
        archived: false,
        page_id: notion.id,
        properties: {
          Status: {
            type: "select",
            select: {
              name: "In-progress",
            },
          },
        },
      });
    }
  }
};

doWork();

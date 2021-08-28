import { getAllTodoistProjectsKeyed } from "./todoist";
import { Client } from "@notionhq/client";
import {
  getAllNotionProjectsKeyed,
  WROJECTS_DATABASE_ID,
  PROJECTS_DATABASE_ID,
} from "./notion";
import got from "got";

const notionClient = new Client({
  auth: process.env.NOTION_TOKEN,
});

async function createNotionChildPage(
  parentDatabaseId: string,
  childTitle: string,
  status: string
) {
  return await notionClient.pages.create({
    parent: {
      database_id: parentDatabaseId,
    },
    properties: {
      Name: {
        type: "title",
        title: [
          {
            type: "text",
            text: {
              content: childTitle,
            },
          },
        ],
      },
      Status: {
        type: "select",
        select: {
          name: status,
        },
      },
    },
  });
}

type NotionProject = {
  name: string;
  id: string;
  status?: string;
  work?: Boolean;
  personal?: Boolean;
};

interface MasterObject {
  [projectTitle: string]: {
    notion: NotionProject;
    todoist: {
      name: string;
      id?: string;
      work: boolean;
      personal: boolean;
      status: "Completed" | "In-progress";
    };
  };
}

const doWork = async () => {
  const projectsToExclude = [
    "One-offs",
    "Wickler",
    "Someday/Maybe",
    "🎟 Pone-offs",
    "Pickler",
    "🌱 Pomeday/Maybe",
  ];

  const allTodoistProjectsKeyed = await getAllTodoistProjectsKeyed()

  projectsToExclude.forEach(
    (excludedProjectName) => delete allTodoistProjectsKeyed[excludedProjectName]
  );

  const allNotionProjectsKeyed = await getAllNotionProjectsKeyed();

  const allProjectTitles = new Set<string>();

  Object.keys(allNotionProjectsKeyed).forEach((projectTitle) =>
    allProjectTitles.add(projectTitle)
  );
  Object.keys(allTodoistProjectsKeyed).forEach((projectTitle) =>
    allProjectTitles.add(projectTitle)
  );

  const masterObject: MasterObject = {};

  for (let projectTitle of allProjectTitles) {
    const todoistProject = allTodoistProjectsKeyed[projectTitle];
    const notionProject = allNotionProjectsKeyed[projectTitle];
    // In this case, we simply change the notion project's status to "Complete"
    if (!todoistProject && notionProject) {
      masterObject[projectTitle] = {
        notion: {
          ...(allNotionProjectsKeyed[projectTitle] as NotionProject),
        },
        todoist: {
          name: projectTitle,
          work: false,
          personal: false,
          status: "Completed",
        },
      };
      // In this case, we need more data.
    } else if (todoistProject && !notionProject) {
      masterObject[projectTitle] = {
        notion: {
          name: projectTitle,
          id: "foo",
        },
        todoist: {
          name: projectTitle,
          id: todoistProject.id.toString(),
          status: "In-progress",
          work: todoistProject.work,
          personal: todoistProject.personal,
        },
      };
    }
    // they're both defined
    else {
      const currentTodoist = allTodoistProjectsKeyed[projectTitle];
      masterObject[projectTitle] = {
        notion: {
          ...(allNotionProjectsKeyed[projectTitle] as NotionProject),
        },
        todoist: {
          name: currentTodoist.name,
          id: currentTodoist.id?.toString(),
          work: currentTodoist.work,
          personal: currentTodoist.personal,
          status: "In-progress",
        },
      };
    }
  }
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

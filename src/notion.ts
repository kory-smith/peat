import { Client } from "@notionhq/client";
import { keyBy } from "lodash";

export const WROJECTS_DATABASE_ID = "a5994ff1-52d0-4827-a47d-253941e69e20";
export const PROJECTS_DATABASE_ID = "27498ca8-235f-4e49-a0f6-ab10b9d40063";

export const notionClient = new Client({
  auth: process.env.NOTION_TOKEN,
});

export type MassagedNotionDatabase = {
  name: string;
  id: string;
  status: string;
  work: Boolean;
  personal: Boolean;
};

async function getDatabaseFromId(id: string): Promise<any[]> {
  let allResults: any[] = [];
  let hasMore = true;
  let startCursor: string | undefined = undefined;

  while (hasMore) {
    const databaseResponse = await notionClient.databases.query({
      database_id: id,
      start_cursor: startCursor,
    });

    allResults = allResults.concat(databaseResponse.results);
    hasMore = databaseResponse.has_more;
    startCursor = databaseResponse.next_cursor || undefined;
  }

  return allResults;
}

function massagePage(page: any): MassagedNotionDatabase {
  // Title properties
  const nameProperty = page.properties.Name as any;

  // Handle missing or empty titles
  if (!nameProperty?.title || nameProperty.title.length === 0) {
    throw Error(
      `Page ${page.id} has no title. All project pages must have a title.`
    );
  }

  const titleObject = nameProperty.title[0] as any;
  const title = titleObject.text.content;

  // Parent properties
  const datbaseParent = page.parent;
  if (datbaseParent.type === "database_id") {
    return {
      name: title,
      id: page.id,
      status: (page.properties.Status as any).select.name!,
      work: datbaseParent.database_id === WROJECTS_DATABASE_ID,
      personal: datbaseParent.database_id === PROJECTS_DATABASE_ID,
    };
  } else
    throw Error(
      `massageDatabase should only be called from pages with database parents.
        You called it with a ${datbaseParent.type} parent`
    );
}

export async function createNotionChildPage(
  parentDatabaseId: string,
  childTitle: string,
  status: "In-progress" | "Completed"
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

export const applyStatusToNotionPage = async (
  pageId: string,
  status: string
) => {
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

export function createResourceDatabase(notionId: string) {
  notionClient.databases.create({
    parent: {
      page_id: notionId,
    },
    is_inline: true,
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

export const getAllNotionProjectsKeyed = async () => {
  const wrojects = await getDatabaseFromId(WROJECTS_DATABASE_ID);
  const massagedWrojects = wrojects.map((wroject) => massagePage(wroject));
  const keyedWrojects = keyBy(massagedWrojects, (page) => page.name);

  const projects = await getDatabaseFromId(PROJECTS_DATABASE_ID);
  const massagedProjects = projects.map((project) => massagePage(project));
  const keyedProjects = keyBy(massagedProjects, (page) => page.name);
  return Object.assign({}, keyedWrojects, keyedProjects);
};

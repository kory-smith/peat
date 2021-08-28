import { Client } from "@notionhq/client";
import {
  RichTextText,
  SelectPropertyValue,
  TitlePropertyValue,
} from "@notionhq/client/build/src/api-types";
import { keyBy } from "lodash";

export const WROJECTS_DATABASE_ID = "a5994ff1-52d0-4827-a47d-253941e69e20";
export const PROJECTS_DATABASE_ID = "27498ca8-235f-4e49-a0f6-ab10b9d40063";

export const notionClient = new Client({
  auth: process.env.NOTION_TOKEN,
});

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

async function getDatabaseFromId(id: string) {
  const databaseResponse = await notionClient.databases.query({
    database_id: id,
  });

  const database = databaseResponse.results;

  const massagedDatabase = database.map((page) => {
    // Title properties
    const nameProperty = page.properties.Name as TitlePropertyValue;
    const titleObject = nameProperty.title[0] as RichTextText;
    const title = titleObject.text.content;
    // Parent properties
    const datbaseParent = page.parent;
    if (datbaseParent.type === "database_id") {
      return {
        name: title,
        id: page.id,
        status: (page.properties.Status as SelectPropertyValue).select.name!,
        work: datbaseParent.database_id === WROJECTS_DATABASE_ID,
        personal: datbaseParent.database_id === PROJECTS_DATABASE_ID,
      };
    }
  });

  const keyedDatabase = keyBy(massagedDatabase, (page) => page?.name);
  return keyedDatabase;
}

export const getAllNotionProjectsKeyed = async () => {
  const wrojects = await getDatabaseFromId(WROJECTS_DATABASE_ID);
  const projects = await getDatabaseFromId(PROJECTS_DATABASE_ID);
  return Object.assign({}, wrojects, projects);
};

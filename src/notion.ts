import { Client } from "@notionhq/client";
import {
  RichTextText,
  SelectPropertyValue,
  TitlePropertyValue,
} from "@notionhq/client/build/src/api-types";
import { keyBy } from "lodash";

export const WROJECTS_DATABASE_ID = "a5994ff1-52d0-4827-a47d-253941e69e20";
export const PROJECTS_DATABASE_ID = "27498ca8-235f-4e49-a0f6-ab10b9d40063";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

async function getDatabaseFromId(id: string) {
  const databaseResponse = await notion.databases.query({
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
    return {};
  });

  const keyedDatabase = keyBy(massagedDatabase, (page) => page?.name);
  return keyedDatabase;
}

export const getAllNotionProjectsKeyed = async () => {
  const wrojects = await getDatabaseFromId(WROJECTS_DATABASE_ID);
  const projects = await getDatabaseFromId(PROJECTS_DATABASE_ID);
  return Object.assign({}, wrojects, projects);
};

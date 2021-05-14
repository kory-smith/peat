import { HttpsProxyAgent } from "hpagent";
import { Client } from "@notionhq/client";
import _ from "lodash";

export const WROJECTS_DATABASE_ID = "a5994ff1-52d0-4827-a47d-253941e69e20";
export const PROJECTS_DATABASE_ID = "27498ca8-235f-4e49-a0f6-ab10b9d40063";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

async function getDatabaseFromId(id) {
  const databaseResponse = await notion.databases.query({
    database_id: id,
  });

  const database = databaseResponse.results;

  const massagedDatabase = database.map((page) => {
    return {
      name: page.properties.Name.title[0].text.content,
      id: page.id,
      status: page.properties.Status.select.name,
      work: page.parent.database_id === WROJECTS_DATABASE_ID,
      personal: page.parent.database_id === PROJECTS_DATABASE_ID
    };
  });

  const keyedDatabase = _.keyBy(massagedDatabase, (page) => page.name);
  return keyedDatabase
}

const wrojects = await getDatabaseFromId(WROJECTS_DATABASE_ID)
const projects = await getDatabaseFromId(PROJECTS_DATABASE_ID)

export const allNotionProjectsKeyed = Object.assign({}, wrojects, projects)
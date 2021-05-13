import { HttpsProxyAgent } from "hpagent";
import { Client } from '@notionhq/client';
import fs from "fs";

const httpsAgentConfig = new HttpsProxyAgent({
  proxy: `http://KS61347:${process.env.KORY_PASSWORD}@cdcproxy.kroger.com:3128`,
});

const WROJECTS_DATABASE_ID="a5994ff152d04827a47d253941e69e20"

const notion = new Client({
  auth: process.env.NOTION_TOKEN
})

const wrojectsResponse = await notion.databases.query({
  database_id: 'a5994ff152d04827a47d253941e69e20',
})

const wrojects = wrojectsResponse.results

export const inProgressWrojects = wrojects.filter((wroject) => wroject.properties.Status.select.name === "In-progress")

export const wrojectTitles = wrojects.map((wroject) => {
 if (!wroject.properties.Wroject.title[0]) {
   return 
 } return wroject.properties.Wroject.title[0].text.content})

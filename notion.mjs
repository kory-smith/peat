import { HttpsProxyAgent } from "hpagent";
import { Client } from '@notionhq/client';
import fs from "fs";
import _ from "lodash";
import { profile } from "console";

const httpsAgentConfig = new HttpsProxyAgent({
  proxy: `http://KS61347:${process.env.KORY_PASSWORD}@cdcproxy.kroger.com:3128`,
});

export const WROJECTS_DATABASE_ID="a5994ff152d04827a47d253941e69e20"

const notion = new Client({
  auth: process.env.NOTION_TOKEN
})

const wrojectsResponse = await notion.databases.query({
  database_id: 'a5994ff152d04827a47d253941e69e20',
})

const wrojects = wrojectsResponse.results

export const massagedWrojects = wrojects.map(wroject => {
  return {
    name: wroject.properties.Wroject.title[0].text.content,
    pageId: wroject.id,
    status: wroject.properties.Status.select.name
  }
}) 


export const inProgressWrojects = wrojects.filter((wroject) => wroject.properties.Status.select.name === "In-progress")

export const wrojectTitles = wrojects.map((wroject) => {
 if (!wroject.properties.Wroject.title[0]) {
   return 
 } return wroject.properties.Wroject.title[0].text.content})


 export const saneInProgressWrojects = inProgressWrojects.map(wroject => {
   return {
     name: wroject.properties.Wroject.title[0].text.content,
     pageId: wroject.id,
     status: wroject.properties.Status.select.name
   }
 })

 export const keyedNotionWrojects = _.keyBy(massagedWrojects, (proj) => proj.name)



/* 
 {
   "Test Wroject": {
     Notion: {
       pageId: iii,
       name: iii,
       status: iii,
     },
     Todoist: {
       projectId: iii
       name: iii
       status: live | absent
     }
   }
 } */
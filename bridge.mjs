import { workSubProjects } from "./todoist.mjs";
import { Client } from '@notionhq/client';
import { inProgressWrojects, wrojectTitles, saneInProgressWrojects, WROJECTS_DATABASE_ID } from "./notion.mjs";

const projectsToExclude = ["One-offs", "Wickler", "Someday/Maybe"];

const filteredWorkSubProjects = workSubProjects.filter(
  (project) => !projectsToExclude.includes(project.name)
);

const foo = filteredWorkSubProjects.map((todoistProject) => {
  if (wrojectTitles.includes(todoistProject.name)) {
    return {
      name: todoistProject.name,
      todoistUrl: todoistProject.url,
      includedInNotion: true,
    };
  } else
    return {
      name: todoistProject.name,
      todoistUrl: todoistProject.url,
      includedInNotion: false,
    };
});

const thingsToAddToNotion = foo.filter(thing => {
  return !thing.includedInNotion
})

const notion = new Client({
  auth: process.env.NOTION_TOKEN
})



async function bridge() {
  // Waiting for stuff
}

/* 
What are the cases?
- Project exists in Todoist but not notion
- Project exists in Notion but not Todoist
- Project exists in both already
 */

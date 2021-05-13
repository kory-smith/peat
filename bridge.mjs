import { workSubProjects } from "./todoist.mjs";
import { inProgressWrojects, wrojectTitles } from "./notion.mjs";

const projectsToExclude = ["One-offs", "Wickler", "Someday/Maybe"];

const filteredWorkSubProjects = workSubProjects.filter(
  (project) => !projectsToExclude.includes(project.name)
);

const foo = filteredWorkSubProjects.map((todoistProject) => {
  if (wrojectTitles.includes(todoistProject.name)) {
    return {
      name: todoistProject.name,
      includedInNotion: true,
      todoistUrl: todoistProject.url,
    };
  } else
    return {
      name: todoistProject.name,
      includedInNotion: false,
      todoistUrl: todoistProject.url,
    };
});

console.log(foo);

/* 
What are the cases?
- Project exists in Todoist but not notion
- Project exists in Notion but not Todoist
- Project exists in both already
 */

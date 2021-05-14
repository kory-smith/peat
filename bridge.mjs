import { workSubProjects } from "./todoist.mjs";
import { Client } from '@notionhq/client';
import { massagedWrojects, keyedNotionWrojects, wrojectTitles, saneInProgressWrojects, WROJECTS_DATABASE_ID } from "./notion.mjs";

const notionClient = new Client({
  auth: process.env.NOTION_TOKEN
})

const projectsToExclude = ["One-offs", "Wickler", "Someday/Maybe"];

const filteredWorkSubProjects = workSubProjects.filter(
  (project) => !projectsToExclude.includes(project.name)
);

const allWrojectTitles = []
wrojectTitles.forEach(title => allWrojectTitles.push(title))
filteredWorkSubProjects.map(proj => proj.name).forEach(name => allWrojectTitles.push(name))

const masterObject = {}

for (let wrojectTitle of allWrojectTitles) {
  const todoistProject = filteredWorkSubProjects.find(proj => proj.name === wrojectTitle)
  const notionProject = keyedNotionWrojects[wrojectTitle]
  if (!todoistProject && notionProject) {
    masterObject[wrojectTitle] = {
      notion: {
        ...keyedNotionWrojects[wrojectTitle],
      },
      todoist: {
        name: wrojectTitle,
        projectId: null,
        status: "Completed"
      }
    }
  } else if (todoistProject && !notionProject) {
    masterObject[wrojectTitle] = {
      notion: {
        name: wrojectTitle,
        pageId: null,
        status: null
      },
      todoist: {
        name: wrojectTitle,
        projectId: todoistProject.id,
        status: "In-progress"
      }
    }
  }
  // they're both defined
  else {
    masterObject[wrojectTitle] = {
      notion: {
        ...keyedNotionWrojects[wrojectTitle],
      },
      todoist: {
        name: wrojectTitle,
        projectId: todoistProject.id,
        status: "In-progress"
      }
    }
  }
}

for (let project in masterObject) {
  const {notion, todoist} = masterObject[project]
  // cases: in todoist and notion. do nothing.
  // In todoist not notion: add to notion
  if (todoist.status === "In-progress" && !notion.status) {
    notionClient.pages.create({
          parent: {
            database_id: WROJECTS_DATABASE_ID
          },
          properties: {
            Wroject: {
              title: [
                {
                  text: {
                    content: project
                  }
                }
              ]
            },
            Status: {
              id: "Wftb",
              type: "select",
              select: {
                id: "57c5faf7-32e9-40ff-bf8b-18098cbffb36",
                name: "In-progress",
                color: "orange"
              }
            }
          }
        })
  } else if (todoist.status === "Completed" && notion) {
    // console.log({ notion, todoist }, notion.pageId)
    notionClient.pages.update({
      page_id: notion.pageId,
      properties: {
        Status: {select: {
          name: "Completed"
        }}
      }
    })
  }
}

// for (let key in keyedNotionWrojects) {
//   const todoistProject = workSubProjects.find((proj) => {
//     return proj.name === key;
//   });
//   if (todoistProject === undefined) {
//     masterObject[key] = {
//       Notion: {
//         ...keyedNotionWrojects[key],
//       },
//       Todoist: {
//         name: key,
//         projectId: null,
//         status: "Completed",
//       },
//     };
//   } else {
//     masterObject[key] = {
//       Notion: {
//         ...keyedNotionWrojects[key],
//       },
//       Todoist: {
//         name: todoistProject.name,
//         projectId: String(todoistProject.id),
//         status: "In-progress",
//       },
//     };
//   }
// }

const instructions = filteredWorkSubProjects.map((todoistProject) => {
  // We need to determine what to do from here.
  // First, if this is already in notion
  if (keyedNotionWrojects[todoistProject.name] && keyedNotionWrojects[todoistProject.name].status === "In-progress") {
    // Do nothing
  }
  // Next, if in todoist but not notion?
  if (!keyedNotionWrojects[todoistProject.name]) {
    // add it to notion
  }
  // Next, if it's in Notion but not todoist? Would that be everything else?

})

const massaged = filteredWorkSubProjects.map((todoistProject) => {
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

const wrojectsToAddToNotion = massaged.filter(thing => {
  return !thing.includedInNotion
})


// This handles pushing projects from Todoist to Notion
// wrojectsToAddToNotion.forEach(async (thing) => {
//   const thung = await notion.pages.create({
//     parent: {
//       database_id: WROJECTS_DATABASE_ID
//     },
//     properties: {
//       Wroject: {
//         title: [
//           {
//             text: {
//               content: thing.name
//             }
//           }
//         ]
//       },
//       Status: {
//         id: "Wftb",
//         type: "select",
//         select: {
//           id: "57c5faf7-32e9-40ff-bf8b-18098cbffb36",
//           name: "In-progress",
//           color: "orange"
//         }
//       }
//     }
//   })
// })

async function bridge() {
  // Waiting for stuff
}

/* 
What are the cases?
- Project exists in Todoist but not notion
- Project exists in Notion but not Todoist
- Project exists in both already
*/

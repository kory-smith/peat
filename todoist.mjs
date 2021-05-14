import got from "got";
import { HttpsProxyAgent } from "hpagent";
import fs from "fs";

// For use only if i'm at work
const httpsAgentConfig = new HttpsProxyAgent({
  proxy: `http://KS61347:${process.env.KORY_PASSWORD}@cdcproxy.kroger.com:3128`,
});

// In case I need to use the sync endpoint
// const SYNC_ENDPOINT = "https://api.todoist.com/sync/v8/sync"
// const projectsResponse = await got.post(SYNC_ENDPOINT, {
//   headers: {
//     Authorization: `Bearer ${process.env.TODOIST_TOKEN}`
//   },
//   responseType: "json",
//   json: {
//     resource_types: ["projects"]
//   },
//   resolveBodyOnly: true,
//   agent: { https: httpsAgentConfig },
// })
// const projects = projectsResponse.projects

// But it looks like I can get away with the rest api
const projectsResponse = await got.get(
  "https://api.todoist.com/rest/v1/projects",
  {
    responseType: "json",
    agent: { https: httpsAgentConfig },
    headers: {
      Authorization: `Bearer ${process.env.TODOIST_TOKEN}`,
    },
  }
);
const projects = projectsResponse.body;

// Stopgap
// let rawdata = fs.readFileSync('data.json');
// let projects = JSON.parse(rawdata);

const workProject = projects.find((project) => {
  return project.name === "Work";
});

export const workSubProjects = projects.filter((project) => {
  return project.parent == workProject.id;
});

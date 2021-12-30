import got from "got";
import { keyBy } from "lodash";

const WORKSPACE_ID = 4921603;

const WORK_CLIENT_ID = 57015586;
const PERSONAL_CLIENT_ID = 56768421;

const togglInstnace = got.extend({
  prefixUrl: "https://api.track.toggl.com/api/v8/",
  username: process.env.TOGGL_TOKEN,
  password: "api_token",
  responseType: "json",
  resolveBodyOnly: true,
});

export const getAllTogglProjects = async (): Promise<any> => {
  return await togglInstnace.get(`workspaces/${WORKSPACE_ID}/projects`, {
    searchParams: { active: "both" },
  });
};

export const getAllTogglProjectsKeyed = async () => {
  const projects = await getAllTogglProjects();
  return keyBy(projects, (project) => project?.name);
};

export const createTogglProject = async (
  name: string,
  options?: { work: Boolean }
) => {
  try {
    return await togglInstnace.post("projects", {
      json: {
        project: {
          name,
          wid: WORKSPACE_ID,
          cid: options?.work ? WORK_CLIENT_ID : PERSONAL_CLIENT_ID,
        },
      },
    });
  } catch (err) {
    console.log(err);
  }
};

export const setTogglProjectActiveState = async (
  projectId: number,
  state: "active" | "inactive"
) => {
  return await togglInstnace.put(`projects/${projectId}`, {
    json: {
      project: {
        active: state === "active" ? true : false,
      },
    },
  });
};

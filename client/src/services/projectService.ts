import {
  apiRequest,
} from "./api";

type ProjectStatus =
  | "planning"
  | "active"
  | "completed";

type ProjectUser = {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
};

type Project = {
  _id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  owner: ProjectUser;
  members: ProjectUser[];
  createdAt: string;
  updatedAt: string;
};

type ProjectsResponse = {
  count: number;
  projects: Project[];
};

type ProjectResponse = {
  project: Project;
};

type CreateProjectResponse = {
  message: string;
  project: Project;
};

type CreateProjectData = {
  name: string;
  description: string;
  status: ProjectStatus;
};

async function getProjects() {
  return apiRequest<ProjectsResponse>(
    "/api/projects",
    {
      auth: true,
    },
  );
}

async function getProject(
  projectId: string,
) {
  return apiRequest<ProjectResponse>(
    `/api/projects/${projectId}`,
    {
      auth: true,
    },
  );
}

async function createProject(
  data: CreateProjectData,
) {
  return apiRequest<CreateProjectResponse>(
    "/api/projects",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

async function updateProject(
  projectId: string,
  data: Partial<CreateProjectData>,
) {
  return apiRequest<ProjectResponse>(
    `/api/projects/${projectId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

async function deleteProject(
  projectId: string,
) {
  return apiRequest<{
    message: string;
  }>(
    `/api/projects/${projectId}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}

export {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
};

export type {
  CreateProjectData,
  Project,
  ProjectStatus,
};
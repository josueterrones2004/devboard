import {
  apiRequest,
} from "./api";

/*
 * =========================================================
 * PROJECT STATUS
 * =========================================================
 */

type ProjectStatus =
  | "planning"
  | "active"
  | "completed";

/*
 * =========================================================
 * PROJECT ICON
 * =========================================================
 */

type ProjectIcon =
  | "folder"
  | "code"
  | "terminal"
  | "database"
  | "server"
  | "globe"
  | "layers"
  | "package"
  | "cpu"
  | "rocket";

/*
 * =========================================================
 * PROJECT USER
 * =========================================================
 */

type ProjectUser = {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
};

/*
 * =========================================================
 * PROJECT
 * =========================================================
 */

type Project = {
  _id: string;
  name: string;
  description: string;
  icon: ProjectIcon;
  status: ProjectStatus;
  owner: ProjectUser;
  members: ProjectUser[];
  createdAt: string;
  updatedAt: string;
};

/*
 * =========================================================
 * API RESPONSES
 * =========================================================
 */

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

/*
 * =========================================================
 * CREATE PROJECT DATA
 * =========================================================
 */

type CreateProjectData = {
  name: string;
  description: string;
  icon?: ProjectIcon;
  status?: ProjectStatus;
};

/*
 * =========================================================
 * UPDATE PROJECT DATA
 * =========================================================
 */

type UpdateProjectData = {
  name?: string;
  description?: string;
  icon?: ProjectIcon;
};

/*
 * =========================================================
 * GET PROJECTS
 * =========================================================
 */

async function getProjects() {
  return apiRequest<ProjectsResponse>(
    "/api/projects",
    {
      auth: true,
    },
  );
}

/*
 * =========================================================
 * GET PROJECT
 * =========================================================
 */

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

/*
 * =========================================================
 * CREATE PROJECT
 * =========================================================
 */

async function createProject(
  data: CreateProjectData,
) {
  return apiRequest<CreateProjectResponse>(
    "/api/projects",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(
        data,
      ),
    },
  );
}

/*
 * =========================================================
 * UPDATE PROJECT
 * =========================================================
 */

async function updateProject(
  projectId: string,
  data: UpdateProjectData,
) {
  return apiRequest<ProjectResponse>(
    `/api/projects/${projectId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(
        data,
      ),
    },
  );
}

/*
 * =========================================================
 * DELETE PROJECT
 * =========================================================
 */

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

/*
 * =========================================================
 * EXPORTS
 * =========================================================
 */

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
  ProjectIcon,
  ProjectStatus,
  UpdateProjectData,
};
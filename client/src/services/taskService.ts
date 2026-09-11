import {
  apiRequest,
} from "./api";

type TaskStatus =
  | "todo"
  | "in-progress"
  | "done";

type TaskPriority =
  | "low"
  | "medium"
  | "high";

type ProjectStatus =
  | "planning"
  | "active"
  | "completed";

type TaskAssignee = {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
};

type TaskProject = {
  _id: string;
  name: string;
  status: ProjectStatus;
};

type Task = {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: string;
  assignee: TaskAssignee | null;
  labels: string[];
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};

type MyTask = Omit<
  Task,
  "project"
> & {
  project: TaskProject;
};

type TasksResponse = {
  count: number;
  tasks: Task[];
};

type MyTasksResponse = {
  count: number;
  tasks: MyTask[];
};

type CreateTaskResponse = {
  message: string;
  task: Task;
  projectStatus: ProjectStatus;
};

type UpdateTaskResponse = {
  message: string;
  task: Task;
};

type CreateTaskData = {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string | null;
  labels?: string[];
  dueDate?: string | null;
};

type UpdateTaskData =
  Partial<CreateTaskData> & {
    position?: number;
  };

async function getProjectTasks(
  projectId: string,
) {
  return apiRequest<TasksResponse>(
    `/api/projects/${projectId}/tasks`,
    {
      auth: true,
    },
  );
}

async function getMyTasks() {
  return apiRequest<MyTasksResponse>(
    "/api/tasks/mine",
    {
      auth: true,
    },
  );
}

async function createTask(
  projectId: string,
  data: CreateTaskData,
) {
  return apiRequest<CreateTaskResponse>(
    `/api/projects/${projectId}/tasks`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(
        data,
      ),
    },
  );
}

async function updateTask(
  taskId: string,
  data: UpdateTaskData,
) {
  return apiRequest<UpdateTaskResponse>(
    `/api/tasks/${taskId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(
        data,
      ),
    },
  );
}

async function deleteTask(
  taskId: string,
) {
  return apiRequest<{
    message: string;
  }>(
    `/api/tasks/${taskId}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}

export {
  createTask,
  deleteTask,
  getMyTasks,
  getProjectTasks,
  updateTask,
};

export type {
  CreateTaskData,
  MyTask,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskData,
};
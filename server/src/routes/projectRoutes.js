import express from "express";

import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
} from "../controllers/projectController.js";

import {
  createTask,
  getProjectTasks,
} from "../controllers/taskController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getProjects)
  .post(createProject);

router
  .route("/:projectId/tasks")
  .get(getProjectTasks)
  .post(createTask);

router
  .route("/:id")
  .get(getProjectById)
  .patch(updateProject)
  .delete(deleteProject);

export default router;
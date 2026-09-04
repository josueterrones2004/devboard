import express from "express";

import {
  deleteTask,
  getMyTasks,
  updateTask,
} from "../controllers/taskController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get(
  "/mine",
  getMyTasks,
);

router
  .route("/:id")
  .patch(updateTask)
  .delete(deleteTask);

export default router;
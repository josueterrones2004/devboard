import express from "express";

import {
  getMe,
  login,
  register,
  updateMe,
} from "../controllers/authController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router =
  express.Router();

router.post(
  "/register",
  register,
);

router.post(
  "/login",
  login,
);

router
  .route("/me")
  .get(protect, getMe)
  .patch(protect, updateMe);

export default router;
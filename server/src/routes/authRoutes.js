import express from "express";

import {
  getMe,
  login,
  logout,
  register,
  updateMe,
} from "../controllers/authController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

/*
 * =========================================================
 * ROUTER
 * =========================================================
 */

const router =
  express.Router();

/*
 * =========================================================
 * PUBLIC AUTH
 * =========================================================
 */

router.post(
  "/register",
  register,
);

router.post(
  "/login",
  login,
);

router.post(
  "/logout",
  logout,
);

/*
 * =========================================================
 * CURRENT USER
 * =========================================================
 */

router
  .route("/me")
  .get(
    protect,
    getMe,
  )
  .patch(
    protect,
    updateMe,
  );

/*
 * =========================================================
 * EXPORT
 * =========================================================
 */

export default router;
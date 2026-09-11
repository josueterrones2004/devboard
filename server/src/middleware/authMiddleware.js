import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../models/User.js";

/*
 * =========================================================
 * AUTH CONSTANTS
 * =========================================================
 */

const AUTH_COOKIE_NAME =
  "devboard_session";

/*
 * =========================================================
 * PROTECT ROUTES
 * =========================================================
 */

async function protect(
  req,
  res,
  next,
) {
  try {
    if (
      !process.env.JWT_SECRET
    ) {
      console.error(
        "JWT_SECRET is not configured",
      );

      return res.status(500).json({
        message:
          "Server configuration error",
      });
    }

    /*
     * =========================================================
     * SESSION COOKIE
     * =========================================================
     */

    const token =
      req.cookies?.[
        AUTH_COOKIE_NAME
      ];

    if (
      typeof token !==
        "string" ||
      !token
    ) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    /*
     * =========================================================
     * VERIFY TOKEN
     * =========================================================
     */

    let decoded;

    try {
      decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET,
          {
            algorithms: [
              "HS256",
            ],

            issuer:
              "devboard-api",

            audience:
              "devboard-client",
          },
        );
    } catch {
      return res.status(401).json({
        message:
          "Invalid or expired session",
      });
    }

    if (
      typeof decoded !==
        "object" ||
      typeof decoded.userId !==
        "string" ||
      !mongoose.isValidObjectId(
        decoded.userId,
      )
    ) {
      return res.status(401).json({
        message:
          "Invalid or expired session",
      });
    }

    /*
     * =========================================================
     * CURRENT USER
     * =========================================================
     */

    const user =
      await User.findById(
        decoded.userId,
      );

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid or expired session",
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    console.error(
      "Authentication middleware error:",
      error instanceof Error
        ? error.message
        : error,
    );

    return res.status(500).json({
      message:
        "Authentication failed",
    });
  }
}

/*
 * =========================================================
 * EXPORTS
 * =========================================================
 */

export {
  protect,
};
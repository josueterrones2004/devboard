import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

/*
 * =========================================================
 * APP
 * =========================================================
 */

const app = express();

/*
 * =========================================================
 * SECURITY HEADERS
 * =========================================================
 */

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy:
        "cross-origin",
    },
  }),
);

/*
 * =========================================================
 * TRUSTED ORIGINS
 * =========================================================
 */

const allowedOrigins =
  new Set(
    [
      process.env.CLIENT_URL,

      "http://localhost:5173",

      "http://127.0.0.1:5173",
    ].filter(Boolean),
  );

/*
 * =========================================================
 * CORS
 * =========================================================
 */

app.use(
  cors({
    origin(
      origin,
      callback,
    ) {
      if (!origin) {
        return callback(
          null,
          true,
        );
      }

      return callback(
        null,
        allowedOrigins.has(
          origin,
        ),
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
    ],
  }),
);

/*
 * =========================================================
 * CSRF ORIGIN CHECK
 * =========================================================
 */

const unsafeMethods =
  new Set([
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ]);

app.use(
  (req, res, next) => {
    if (
      !unsafeMethods.has(
        req.method,
      )
    ) {
      return next();
    }

    const origin =
      req.headers.origin;

    /*
     * curl, Postman and
     * server-to-server requests
     * may not send Origin.
     */

    if (!origin) {
      return next();
    }

    if (
      !allowedOrigins.has(
        origin,
      )
    ) {
      return res.status(403).json({
        message:
          "Origin not allowed",
      });
    }

    return next();
  },
);

/*
 * =========================================================
 * REQUEST PARSING
 * =========================================================
 */

app.use(
  express.json({
    limit: "32kb",
  }),
);

app.use(
  cookieParser(),
);

/*
 * =========================================================
 * GLOBAL RATE LIMIT
 * =========================================================
 */

const apiLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 500,

    standardHeaders:
      "draft-8",

    legacyHeaders: false,

    message: {
      message:
        "Too many requests. Please try again later.",
    },
  });

app.use(
  "/api",
  apiLimiter,
);

/*
 * =========================================================
 * LOGIN RATE LIMIT
 * =========================================================
 */

const loginLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 10,

    standardHeaders:
      "draft-8",

    legacyHeaders: false,

    skipSuccessfulRequests:
      true,

    message: {
      message:
        "Too many login attempts. Please try again later.",
    },
  });

app.use(
  "/api/auth/login",
  loginLimiter,
);

/*
 * =========================================================
 * REGISTER RATE LIMIT
 * =========================================================
 */

const registerLimiter =
  rateLimit({
    windowMs:
      60 * 60 * 1000,

    limit: 5,

    standardHeaders:
      "draft-8",

    legacyHeaders: false,

    message: {
      message:
        "Too many registration attempts. Please try again later.",
    },
  });

app.use(
  "/api/auth/register",
  registerLimiter,
);

/*
 * =========================================================
 * HEALTH
 * =========================================================
 */

app.get(
  "/api/health",
  (req, res) => {
    return res.status(200).json({
      status: "ok",

      message:
        "DevBoard API is running",
    });
  },
);

/*
 * =========================================================
 * ROUTES
 * =========================================================
 */

app.use(
  "/api/auth",
  authRoutes,
);

app.use(
  "/api/projects",
  projectRoutes,
);

app.use(
  "/api/tasks",
  taskRoutes,
);

/*
 * =========================================================
 * NOT FOUND
 * =========================================================
 */

app.use(
  (req, res) => {
    return res.status(404).json({
      message:
        "Route not found",
    });
  },
);

/*
 * =========================================================
 * ERROR HANDLER
 * =========================================================
 */

app.use(
  (
    error,
    req,
    res,
    next,
  ) => {
    if (
      error instanceof
        SyntaxError &&
      "body" in error
    ) {
      return res.status(400).json({
        message:
          "Invalid JSON body",
      });
    }

    console.error(
      "Unhandled server error:",
      error instanceof Error
        ? error.message
        : error,
    );

    return res.status(500).json({
      message:
        "Internal server error",
    });
  },
);

/*
 * =========================================================
 * EXPORT
 * =========================================================
 */

export default app;
import cors from "cors";
import express from "express";

import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      status: "ok",
      message:
        "DevBoard API is running",
    });
  },
);

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

export default app;
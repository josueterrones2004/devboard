import mongoose from "mongoose";

import Project, {
  PROJECT_ICONS,
} from "../models/Project.js";

import Task from "../models/Task.js";

/*
 * =========================================================
 * PROJECT STATUSES
 * =========================================================
 */

const PROJECT_STATUSES = [
  "planning",
  "active",
  "completed",
];

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

/*
 * =========================================================
 * EXACT PROJECT NAME REGEX
 * =========================================================
 */

function exactNameRegex(
  name,
) {
  return new RegExp(
    `^${escapeRegex(
      name.trim(),
    )}$`,
    "i",
  );
}

/*
 * =========================================================
 * CREATE PROJECT
 * =========================================================
 */

async function createProject(
  req,
  res,
) {
  try {
    const {
      name,
      description,
      icon,
      status,
    } = req.body;

    /*
     * =========================================================
     * VALIDATE NAME
     * =========================================================
     */

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res
        .status(400)
        .json({
          message:
            "Project name is required",
          field:
            "name",
        });
    }

    const normalizedName =
      name.trim();

    /*
     * =========================================================
     * VALIDATE ICON
     * =========================================================
     */

    if (
      icon !== undefined &&
      (
        typeof icon !==
          "string" ||
        !PROJECT_ICONS.includes(
          icon,
        )
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid project icon",
          field:
            "icon",
        });
    }

    /*
     * =========================================================
     * VALIDATE STATUS
     * =========================================================
     */

    if (
      status !== undefined &&
      (
        typeof status !==
          "string" ||
        !PROJECT_STATUSES.includes(
          status,
        )
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid project status",
          field:
            "status",
        });
    }

    /*
     * =========================================================
     * DUPLICATE PROJECT NAME
     * =========================================================
     */

    const duplicate =
      await Project.findOne({
        owner:
          req.user._id,

        name:
          exactNameRegex(
            normalizedName,
          ),
      });

    if (duplicate) {
      return res
        .status(409)
        .json({
          message:
            `A project named "${normalizedName}" already exists`,
          field:
            "name",
          code:
            "DUPLICATE_PROJECT_NAME",
        });
    }

    /*
     * =========================================================
     * CREATE PROJECT
     * =========================================================
     */

    const project =
      await Project.create({
        name:
          normalizedName,

        description:
          typeof description ===
            "string"
            ? description.trim()
            : "",

        icon:
          icon ?? "folder",

        status:
          status ??
          "planning",

        owner:
          req.user._id,

        members: [
          req.user._id,
        ],
      });

    /*
     * =========================================================
     * POPULATE PROJECT USERS
     * =========================================================
     */

    await project.populate([
      {
        path:
          "owner",
        select:
          "name email avatar",
      },
      {
        path:
          "members",
        select:
          "name email avatar",
      },
    ]);

    return res
      .status(201)
      .json({
        message:
          "Project created successfully",
        project,
      });
  } catch (error) {
    console.error(
      "Create project error:",
      error.message,
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res
        .status(400)
        .json({
          message:
            error.message,
        });
    }

    return res
      .status(500)
      .json({
        message:
          "Failed to create project",
      });
  }
}

/*
 * =========================================================
 * GET PROJECTS
 * =========================================================
 */

async function getProjects(
  req,
  res,
) {
  try {
    const projects =
      await Project.find({
        $or: [
          {
            owner:
              req.user._id,
          },
          {
            members:
              req.user._id,
          },
        ],
      })
        .populate(
          "owner",
          "name email avatar",
        )
        .populate(
          "members",
          "name email avatar",
        )
        .sort({
          updatedAt: -1,
        });

    return res
      .status(200)
      .json({
        count:
          projects.length,
        projects,
      });
  } catch (error) {
    console.error(
      "Get projects error:",
      error.message,
    );

    return res
      .status(500)
      .json({
        message:
          "Failed to load projects",
      });
  }
}

/*
 * =========================================================
 * GET PROJECT BY ID
 * =========================================================
 */

async function getProjectById(
  req,
  res,
) {
  try {
    const {
      id,
    } = req.params;

    /*
     * =========================================================
     * VALIDATE PROJECT ID
     * =========================================================
     */

    if (
      !mongoose.isValidObjectId(
        id,
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid project ID",
        });
    }

    /*
     * =========================================================
     * FIND PROJECT
     * =========================================================
     */

    const project =
      await Project.findOne({
        _id:
          id,

        $or: [
          {
            owner:
              req.user._id,
          },
          {
            members:
              req.user._id,
          },
        ],
      })
        .populate(
          "owner",
          "name email avatar",
        )
        .populate(
          "members",
          "name email avatar",
        );

    if (!project) {
      return res
        .status(404)
        .json({
          message:
            "Project not found",
        });
    }

    return res
      .status(200)
      .json({
        project,
      });
  } catch (error) {
    console.error(
      "Get project error:",
      error.message,
    );

    return res
      .status(500)
      .json({
        message:
          "Failed to load project",
      });
  }
}

/*
 * =========================================================
 * UPDATE PROJECT
 * =========================================================
 */

async function updateProject(
  req,
  res,
) {
  try {
    const {
      id,
    } = req.params;

    /*
     * =========================================================
     * VALIDATE PROJECT ID
     * =========================================================
     */

    if (
      !mongoose.isValidObjectId(
        id,
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid project ID",
        });
    }

    /*
     * =========================================================
     * FIND OWNED PROJECT
     * =========================================================
     */

    const project =
      await Project.findOne({
        _id:
          id,

        owner:
          req.user._id,
      });

    if (!project) {
      return res
        .status(404)
        .json({
          message:
            "Project not found or you are not the owner",
        });
    }

    const {
      name,
      description,
      icon,
    } = req.body;

    /*
     * =========================================================
     * UPDATE NAME
     * =========================================================
     */

    if (
      name !== undefined
    ) {
      if (
        typeof name !==
          "string" ||
        !name.trim()
      ) {
        return res
          .status(400)
          .json({
            message:
              "Project name cannot be empty",
            field:
              "name",
          });
      }

      const normalizedName =
        name.trim();

      const duplicate =
        await Project.findOne({
          _id: {
            $ne:
              project._id,
          },

          owner:
            req.user._id,

          name:
            exactNameRegex(
              normalizedName,
            ),
        });

      if (duplicate) {
        return res
          .status(409)
          .json({
            message:
              `A project named "${normalizedName}" already exists`,
            field:
              "name",
            code:
              "DUPLICATE_PROJECT_NAME",
          });
      }

      project.name =
        normalizedName;
    }

    /*
     * =========================================================
     * UPDATE DESCRIPTION
     * =========================================================
     */

    if (
      description !==
      undefined
    ) {
      if (
        typeof description !==
        "string"
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid project description",
            field:
              "description",
          });
      }

      project.description =
        description.trim();
    }

    /*
     * =========================================================
     * UPDATE ICON
     * =========================================================
     */

    if (
      icon !== undefined
    ) {
      if (
        typeof icon !==
          "string" ||
        !PROJECT_ICONS.includes(
          icon,
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid project icon",
            field:
              "icon",
          });
      }

      project.icon =
        icon;
    }

    /*
     * =========================================================
     * SAVE PROJECT
     * =========================================================
     */

    await project.save();

    /*
     * =========================================================
     * POPULATE PROJECT USERS
     * =========================================================
     */

    await project.populate([
      {
        path:
          "owner",
        select:
          "name email avatar",
      },
      {
        path:
          "members",
        select:
          "name email avatar",
      },
    ]);

    return res
      .status(200)
      .json({
        message:
          "Project updated successfully",
        project,
      });
  } catch (error) {
    console.error(
      "Update project error:",
      error.message,
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res
        .status(400)
        .json({
          message:
            error.message,
        });
    }

    return res
      .status(500)
      .json({
        message:
          "Failed to update project",
      });
  }
}

/*
 * =========================================================
 * DELETE PROJECT
 * =========================================================
 */

async function deleteProject(
  req,
  res,
) {
  try {
    const {
      id,
    } = req.params;

    /*
     * =========================================================
     * VALIDATE PROJECT ID
     * =========================================================
     */

    if (
      !mongoose.isValidObjectId(
        id,
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid project ID",
        });
    }

    /*
     * =========================================================
     * FIND OWNED PROJECT
     * =========================================================
     */

    const project =
      await Project.findOne({
        _id:
          id,

        owner:
          req.user._id,
      });

    if (!project) {
      return res
        .status(404)
        .json({
          message:
            "Project not found or you are not the owner",
        });
    }

    /*
     * =========================================================
     * DELETE PROJECT TASKS
     * =========================================================
     */

    await Task.deleteMany({
      project:
        project._id,
    });

    /*
     * =========================================================
     * DELETE PROJECT
     * =========================================================
     */

    await project.deleteOne();

    return res
      .status(200)
      .json({
        message:
          "Project deleted successfully",
      });
  } catch (error) {
    console.error(
      "Delete project error:",
      error.message,
    );

    return res
      .status(500)
      .json({
        message:
          "Failed to delete project",
      });
  }
}

/*
 * =========================================================
 * EXPORTS
 * =========================================================
 */

export {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
};
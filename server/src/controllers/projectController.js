import mongoose from "mongoose";

import Project from "../models/Project.js";
import Task from "../models/Task.js";

async function createProject(req, res) {
  try {
    const {
      name,
      description,
      status,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message:
          "Project name is required",
      });
    }

    const project =
      await Project.create({
        name: name.trim(),

        description:
          description?.trim() ?? "",

        status:
          status ?? "active",

        owner: req.user._id,

        members: [
          req.user._id,
        ],
      });

    await project.populate([
      {
        path: "owner",
        select:
          "name email avatar",
      },
      {
        path: "members",
        select:
          "name email avatar",
      },
    ]);

    return res.status(201).json({
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
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message:
        "Failed to create project",
    });
  }
}

async function getProjects(
  req,
  res,
) {
  try {
    const projects =
      await Project.find({
        $or: [
          {
            owner: req.user._id,
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

    return res.status(200).json({
      count:
        projects.length,
      projects,
    });
  } catch (error) {
    console.error(
      "Get projects error:",
      error.message,
    );

    return res.status(500).json({
      message:
        "Failed to load projects",
    });
  }
}

async function getProjectById(
  req,
  res,
) {
  try {
    const { id } = req.params;

    if (
      !mongoose.isValidObjectId(id)
    ) {
      return res.status(400).json({
        message:
          "Invalid project ID",
      });
    }

    const project =
      await Project.findOne({
        _id: id,

        $or: [
          {
            owner: req.user._id,
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
      return res.status(404).json({
        message:
          "Project not found",
      });
    }

    return res.status(200).json({
      project,
    });
  } catch (error) {
    console.error(
      "Get project error:",
      error.message,
    );

    return res.status(500).json({
      message:
        "Failed to load project",
    });
  }
}

async function updateProject(
  req,
  res,
) {
  try {
    const { id } = req.params;

    if (
      !mongoose.isValidObjectId(id)
    ) {
      return res.status(400).json({
        message:
          "Invalid project ID",
      });
    }

    const {
      name,
      description,
      status,
    } = req.body;

    const updates = {};

    if (
      typeof name === "string"
    ) {
      if (!name.trim()) {
        return res.status(400).json({
          message:
            "Project name cannot be empty",
        });
      }

      updates.name =
        name.trim();
    }

    if (
      typeof description ===
      "string"
    ) {
      updates.description =
        description.trim();
    }

    if (
      typeof status === "string"
    ) {
      updates.status = status;
    }

    const project =
      await Project.findOneAndUpdate(
        {
          _id: id,
          owner: req.user._id,
        },
        updates,
        {
          new: true,
          runValidators: true,
        },
      )
        .populate(
          "owner",
          "name email avatar",
        )
        .populate(
          "members",
          "name email avatar",
        );

    if (!project) {
      return res.status(404).json({
        message:
          "Project not found or you are not the owner",
      });
    }

    return res.status(200).json({
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
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message:
        "Failed to update project",
    });
  }
}

async function deleteProject(
  req,
  res,
) {
  try {
    const { id } = req.params;

    if (
      !mongoose.isValidObjectId(id)
    ) {
      return res.status(400).json({
        message:
          "Invalid project ID",
      });
    }

    const project =
      await Project.findOne({
        _id: id,
        owner: req.user._id,
      });

    if (!project) {
      return res.status(404).json({
        message:
          "Project not found or you are not the owner",
      });
    }

    await Task.deleteMany({
      project: project._id,
    });

    await project.deleteOne();

    return res.status(200).json({
      message:
        "Project deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete project error:",
      error.message,
    );

    return res.status(500).json({
      message:
        "Failed to delete project",
    });
  }
}

export {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
};
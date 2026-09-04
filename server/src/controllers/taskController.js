import mongoose from "mongoose";

import Project from "../models/Project.js";
import Task from "../models/Task.js";

async function findAccessibleProject(
  projectId,
  userId,
) {
  if (
    !mongoose.isValidObjectId(
      projectId,
    )
  ) {
    return null;
  }

  return Project.findOne({
    _id: projectId,
    $or: [
      {
        owner: userId,
      },
      {
        members: userId,
      },
    ],
  });
}

function isProjectMember(
  project,
  userId,
) {
  const id =
    userId.toString();

  if (
    project.owner.toString() ===
    id
  ) {
    return true;
  }

  return project.members.some(
    (member) =>
      member.toString() === id,
  );
}

async function getProjectTasks(
  req,
  res,
) {
  try {
    const { projectId } =
      req.params;

    const project =
      await findAccessibleProject(
        projectId,
        req.user._id,
      );

    if (!project) {
      return res.status(404).json({
        message:
          "Project not found",
      });
    }

    const tasks =
      await Task.find({
        project: project._id,
      })
        .populate(
          "assignee",
          "name email avatar",
        )
        .sort({
          status: 1,
          position: 1,
          createdAt: 1,
        });

    return res.status(200).json({
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error(
      "Get tasks error:",
      error.message,
    );

    return res.status(500).json({
      message:
        "Failed to load tasks",
    });
  }
}

async function getMyTasks(
  req,
  res,
) {
  try {
    const tasks =
      await Task.find({
        assignee: req.user._id,
      })
        .populate(
          "assignee",
          "name email avatar",
        )
        .populate(
          "project",
          "name status",
        )
        .sort({
          dueDate: 1,
          createdAt: -1,
        });

    return res.status(200).json({
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error(
      "Get my tasks error:",
      error.message,
    );

    return res.status(500).json({
      message:
        "Failed to load assigned tasks",
    });
  }
}

async function createTask(
  req,
  res,
) {
  try {
    const { projectId } =
      req.params;

    const project =
      await findAccessibleProject(
        projectId,
        req.user._id,
      );

    if (!project) {
      return res.status(404).json({
        message:
          "Project not found",
      });
    }

    const {
      title,
      description,
      status,
      priority,
      assignee,
      labels,
      dueDate,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message:
          "Task title is required",
      });
    }

    if (assignee) {
      if (
        !mongoose.isValidObjectId(
          assignee,
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid assignee ID",
        });
      }

      if (
        !isProjectMember(
          project,
          assignee,
        )
      ) {
        return res.status(400).json({
          message:
            "Assignee must be a project member",
        });
      }
    }

    const taskStatus =
      status ?? "todo";

    const lastTask =
      await Task.findOne({
        project: project._id,
        status: taskStatus,
      })
        .sort({
          position: -1,
        })
        .select("position");

    const task =
      await Task.create({
        title: title.trim(),

        description:
          description?.trim() ?? "",

        status: taskStatus,

        priority:
          priority ?? "medium",

        project: project._id,

        assignee:
          assignee || null,

        labels:
          Array.isArray(labels)
            ? labels
            : [],

        dueDate:
          dueDate || null,

        position:
          lastTask
            ? lastTask.position + 1
            : 0,
      });

    await task.populate(
      "assignee",
      "name email avatar",
    );

    return res.status(201).json({
      message:
        "Task created successfully",
      task,
    });
  } catch (error) {
    console.error(
      "Create task error:",
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
        "Failed to create task",
    });
  }
}

async function updateTask(
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
          "Invalid task ID",
      });
    }

    const task =
      await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        message:
          "Task not found",
      });
    }

    const project =
      await findAccessibleProject(
        task.project,
        req.user._id,
      );

    if (!project) {
      return res.status(404).json({
        message:
          "Task not found",
      });
    }

    const {
      title,
      description,
      status,
      priority,
      assignee,
      labels,
      dueDate,
      position,
    } = req.body;

    if (
      typeof title === "string"
    ) {
      if (!title.trim()) {
        return res.status(400).json({
          message:
            "Task title cannot be empty",
        });
      }

      task.title =
        title.trim();
    }

    if (
      typeof description ===
      "string"
    ) {
      task.description =
        description.trim();
    }

    if (
      typeof status === "string"
    ) {
      task.status = status;
    }

    if (
      typeof priority ===
      "string"
    ) {
      task.priority = priority;
    }

    if (
      assignee === null ||
      assignee === ""
    ) {
      task.assignee = null;
    } else if (assignee) {
      if (
        !mongoose.isValidObjectId(
          assignee,
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid assignee ID",
        });
      }

      if (
        !isProjectMember(
          project,
          assignee,
        )
      ) {
        return res.status(400).json({
          message:
            "Assignee must be a project member",
        });
      }

      task.assignee = assignee;
    }

    if (Array.isArray(labels)) {
      task.labels = labels;
    }

    if (
      dueDate === null ||
      dueDate === ""
    ) {
      task.dueDate = null;
    } else if (dueDate) {
      task.dueDate = dueDate;
    }

    if (
      typeof position ===
        "number" &&
      position >= 0
    ) {
      task.position = position;
    }

    await task.save();

    await task.populate(
      "assignee",
      "name email avatar",
    );

    return res.status(200).json({
      message:
        "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error(
      "Update task error:",
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
        "Failed to update task",
    });
  }
}

async function deleteTask(
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
          "Invalid task ID",
      });
    }

    const task =
      await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        message:
          "Task not found",
      });
    }

    const project =
      await findAccessibleProject(
        task.project,
        req.user._id,
      );

    if (!project) {
      return res.status(404).json({
        message:
          "Task not found",
      });
    }

    await task.deleteOne();

    return res.status(200).json({
      message:
        "Task deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete task error:",
      error.message,
    );

    return res.status(500).json({
      message:
        "Failed to delete task",
    });
  }
}

export {
  createTask,
  deleteTask,
  getMyTasks,
  getProjectTasks,
  updateTask,
};
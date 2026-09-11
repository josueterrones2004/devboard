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

function normalizeLabels(
  labels,
) {
  if (!Array.isArray(labels)) {
    return [];
  }

  return labels
    .map((label) =>
      String(label).trim(),
    )
    .filter(Boolean);
}

function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

function exactTitleRegex(
  title,
) {
  return new RegExp(
    `^${escapeRegex(title.trim())}$`,
    "i",
  );
}

function parseDueDate(
  dueDate,
) {
  if (!dueDate) {
    return null;
  }

  const parsed =
    new Date(dueDate);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return null;
  }

  return parsed;
}

async function findDuplicateTask({
  projectId,
  assignee,
  title,
  excludeTaskId = null,
}) {
  const query = {
    project: projectId,

    assignee:
      assignee || null,

    title:
      exactTitleRegex(title),
  };

  if (excludeTaskId) {
    query._id = {
      $ne: excludeTaskId,
    };
  }

  return Task.findOne(query);
}

async function syncProjectStatus(
  project,
) {
  const tasks =
    await Task.find({
      project: project._id,
    }).select("status");

  let nextStatus;

  if (tasks.length === 0) {
    nextStatus =
      "planning";
  } else {
    const allCompleted =
      tasks.every(
        (task) =>
          task.status ===
          "done",
      );

    nextStatus =
      allCompleted
        ? "completed"
        : "active";
  }

  if (
    project.status !==
    nextStatus
  ) {
    project.status =
      nextStatus;

    await project.save();
  }

  return nextStatus;
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
        project:
          project._id,
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
      count:
        tasks.length,

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
        assignee:
          req.user._id,
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
      count:
        tasks.length,

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

        field:
          "title",

        code:
          "TASK_TITLE_REQUIRED",
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        message:
          "Due date is required",

        field:
          "dueDate",

        code:
          "DUE_DATE_REQUIRED",
      });
    }

    const normalizedDueDate =
      parseDueDate(
        dueDate,
      );

    if (!normalizedDueDate) {
      return res.status(400).json({
        message:
          "Enter a valid due date",

        field:
          "dueDate",

        code:
          "INVALID_DUE_DATE",
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

          field:
            "assignee",
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

          field:
            "assignee",
        });
      }
    }

    const normalizedTitle =
      title.trim();

    const normalizedAssignee =
      assignee || null;

    const duplicate =
      await findDuplicateTask({
        projectId:
          project._id,

        assignee:
          normalizedAssignee,

        title:
          normalizedTitle,
      });

    if (duplicate) {
      return res.status(409).json({
        message:
          `A task named "${normalizedTitle}" is already assigned to this user in this project`,

        field:
          "title",

        code:
          "DUPLICATE_TASK_TITLE",
      });
    }

    const taskStatus =
      status ?? "todo";

    const lastTask =
      await Task.findOne({
        project:
          project._id,

        status:
          taskStatus,
      })
        .sort({
          position: -1,
        })
        .select(
          "position",
        );

    const task =
      await Task.create({
        title:
          normalizedTitle,

        description:
          description?.trim() ??
          "",

        status:
          taskStatus,

        priority:
          priority ?? "medium",

        project:
          project._id,

        assignee:
          normalizedAssignee,

        labels:
          normalizeLabels(
            labels,
          ),

        dueDate:
          normalizedDueDate,

        position:
          lastTask
            ? lastTask.position +
              1
            : 0,
      });

    await task.populate(
      "assignee",
      "name email avatar",
    );

    const projectStatus =
      await syncProjectStatus(
        project,
      );

    return res.status(201).json({
      message:
        "Task created successfully",

      task,

      projectStatus,
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
        message:
          error.message,
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
    const { id } =
      req.params;

    if (
      !mongoose.isValidObjectId(
        id,
      )
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

    const duplicateRelevantChange =
      typeof title ===
        "string" ||
      Object.prototype.hasOwnProperty.call(
        req.body,
        "assignee",
      );

    if (
      typeof title ===
      "string"
    ) {
      if (!title.trim()) {
        return res.status(400).json({
          message:
            "Task title cannot be empty",

          field:
            "title",
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
      typeof status ===
      "string"
    ) {
      task.status =
        status;
    }

    if (
      typeof priority ===
      "string"
    ) {
      task.priority =
        priority;
    }

    if (
      assignee === null ||
      assignee === ""
    ) {
      task.assignee =
        null;
    } else if (assignee) {
      if (
        !mongoose.isValidObjectId(
          assignee,
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid assignee ID",

          field:
            "assignee",
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

          field:
            "assignee",
        });
      }

      task.assignee =
        assignee;
    }

    if (
      duplicateRelevantChange
    ) {
      const duplicate =
        await findDuplicateTask({
          projectId:
            project._id,

          assignee:
            task.assignee,

          title:
            task.title,

          excludeTaskId:
            task._id,
        });

      if (duplicate) {
        return res.status(409).json({
          message:
            `A task named "${task.title}" is already assigned to this user in this project`,

          field:
            "title",

          code:
            "DUPLICATE_TASK_TITLE",
        });
      }
    }

    if (
      Array.isArray(labels)
    ) {
      task.labels =
        normalizeLabels(
          labels,
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "dueDate",
      )
    ) {
      if (!dueDate) {
        return res.status(400).json({
          message:
            "Due date is required",

          field:
            "dueDate",

          code:
            "DUE_DATE_REQUIRED",
        });
      }

      const normalizedDueDate =
        parseDueDate(
          dueDate,
        );

      if (!normalizedDueDate) {
        return res.status(400).json({
          message:
            "Enter a valid due date",

          field:
            "dueDate",

          code:
            "INVALID_DUE_DATE",
        });
      }

      task.dueDate =
        normalizedDueDate;
    }

    if (
      typeof position ===
        "number" &&
      position >= 0
    ) {
      task.position =
        position;
    }

    await task.save();

    await task.populate(
      "assignee",
      "name email avatar",
    );

    const projectStatus =
      await syncProjectStatus(
        project,
      );

    return res.status(200).json({
      message:
        "Task updated successfully",

      task,

      projectStatus,
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
        message:
          error.message,
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
    const { id } =
      req.params;

    if (
      !mongoose.isValidObjectId(
        id,
      )
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

    const projectStatus =
      await syncProjectStatus(
        project,
      );

    return res.status(200).json({
      message:
        "Task deleted successfully",

      projectStatus,
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
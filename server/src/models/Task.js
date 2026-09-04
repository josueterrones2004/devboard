import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [
        true,
        "Task title is required",
      ],
      trim: true,
      maxlength: [
        120,
        "Task title cannot exceed 120 characters",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Task description cannot exceed 1000 characters",
      ],
      default: "",
    },

    status: {
      type: String,
      enum: [
        "todo",
        "in-progress",
        "done",
      ],
      default: "todo",
    },

    priority: {
      type: String,
      enum: [
        "low",
        "medium",
        "high",
      ],
      default: "medium",
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    labels: [
      {
        type: String,
        trim: true,
      },
    ],

    dueDate: {
      type: Date,
      default: null,
    },

    position: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Task = mongoose.model(
  "Task",
  taskSchema,
);

export default Task;
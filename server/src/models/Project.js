import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [
        true,
        "Project name is required",
      ],
      trim: true,
      maxlength: [
        100,
        "Project name cannot exceed 100 characters",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Project description cannot exceed 1000 characters",
      ],
      default: "",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    status: {
      type: String,
      enum: [
        "planning",
        "active",
        "completed",
      ],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

const Project = mongoose.model(
  "Project",
  projectSchema,
);

export default Project;
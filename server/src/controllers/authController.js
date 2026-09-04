import jwt from "jsonwebtoken";

import User from "../models/User.js";

function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

async function register(req, res) {
  try {
    const { name, email, password } =
      req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        message:
          "An account with this email already exists",
      });
    }

    const user =
      await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
      });

    const token =
      generateToken(
        user._id.toString(),
      );

    return res.status(201).json({
      message:
        "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error(
      "Register error:",
      error.message,
    );

    return res.status(500).json({
      message:
        "Failed to register user",
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } =
      req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user =
      await User.findOne({
        email: normalizedEmail,
      }).select("+password");

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const passwordMatches =
      await user.comparePassword(
        password,
      );

    if (!passwordMatches) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const token =
      generateToken(
        user._id.toString(),
      );

    return res.status(200).json({
      message:
        "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error.message,
    );

    return res.status(500).json({
      message:
        "Failed to login",
    });
  }
}

async function getMe(req, res) {
  return res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
    },
  });
}

async function updateMe(req, res) {
  try {
    const {
      name,
      email,
    } = req.body;

    if (
      typeof name === "string"
    ) {
      if (!name.trim()) {
        return res.status(400).json({
          message:
            "Name cannot be empty",
        });
      }

      req.user.name =
        name.trim();
    }

    if (
      typeof email === "string"
    ) {
      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          message:
            "Email cannot be empty",
        });
      }

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
          _id: {
            $ne: req.user._id,
          },
        });

      if (existingUser) {
        return res.status(409).json({
          message:
            "An account with this email already exists",
        });
      }

      req.user.email =
        normalizedEmail;
    }

    await req.user.save();

    return res.status(200).json({
      message:
        "Profile updated successfully",
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
      },
    });
  } catch (error) {
    console.error(
      "Update profile error:",
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
        "Failed to update profile",
    });
  }
}

export {
  getMe,
  login,
  register,
  updateMe,
};
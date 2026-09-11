import jwt from "jsonwebtoken";

import User from "../models/User.js";

/*
 * =========================================================
 * AUTH CONSTANTS
 * =========================================================
 */

const AUTH_COOKIE_NAME =
  "devboard_session";

const JWT_EXPIRES_IN =
  "2h";

const COOKIE_MAX_AGE =
  2 * 60 * 60 * 1000;

const MAX_NAME_LENGTH =
  80;

const MAX_EMAIL_LENGTH =
  254;

/*
 * =========================================================
 * COOKIE OPTIONS
 * =========================================================
 */

function getCookieOptions() {
  const production =
    process.env.NODE_ENV ===
    "production";

  return {
    httpOnly: true,

    secure: production,

    sameSite:
      production
        ? "none"
        : "lax",

    path: "/",
  };
}

function getAuthCookieOptions() {
  return {
    ...getCookieOptions(),

    maxAge:
      COOKIE_MAX_AGE,
  };
}

/*
 * =========================================================
 * TOKEN
 * =========================================================
 */

function generateToken(
  userId,
) {
  if (
    !process.env.JWT_SECRET
  ) {
    throw new Error(
      "JWT_SECRET is not configured",
    );
  }

  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        JWT_EXPIRES_IN,

      algorithm:
        "HS256",

      issuer:
        "devboard-api",

      audience:
        "devboard-client",
    },
  );
}

/*
 * =========================================================
 * EMAIL
 * =========================================================
 */

function normalizeEmail(
  email,
) {
  if (
    typeof email !==
    "string"
  ) {
    return "";
  }

  return email
    .trim()
    .toLowerCase();
}

/*
 * =========================================================
 * PASSWORD
 * =========================================================
 */

function validatePassword(
  password,
) {
  if (
    typeof password !==
    "string"
  ) {
    return "Password is required";
  }

  if (
    password.length < 8
  ) {
    return "Password must contain at least 8 characters";
  }

  /*
   * bcrypt only uses the first
   * 72 bytes of a password.
   */

  if (
    Buffer.byteLength(
      password,
      "utf8",
    ) > 72
  ) {
    return "Password is too long";
  }

  if (
    !/[A-Z]/.test(
      password,
    )
  ) {
    return "Password must contain at least one uppercase letter";
  }

  if (
    !/[a-z]/.test(
      password,
    )
  ) {
    return "Password must contain at least one lowercase letter";
  }

  if (
    !/[0-9]/.test(
      password,
    )
  ) {
    return "Password must contain at least one number";
  }

  return null;
}

/*
 * =========================================================
 * REGISTER
 * =========================================================
 */

async function register(
  req,
  res,
) {
  try {
    const {
      name,
      email,
      password,
    } = req.body ?? {};

    if (
      typeof name !==
        "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        message:
          "Name is required",
      });
    }

    const normalizedName =
      name.trim();

    if (
      normalizedName.length >
      MAX_NAME_LENGTH
    ) {
      return res.status(400).json({
        message:
          `Name cannot exceed ${MAX_NAME_LENGTH} characters`,
      });
    }

    const normalizedEmail =
      normalizeEmail(
        email,
      );

    if (!normalizedEmail) {
      return res.status(400).json({
        message:
          "Email is required",
      });
    }

    if (
      normalizedEmail.length >
      MAX_EMAIL_LENGTH
    ) {
      return res.status(400).json({
        message:
          "Email is too long",
      });
    }

    const passwordError =
      validatePassword(
        password,
      );

    if (passwordError) {
      return res.status(400).json({
        message:
          passwordError,
      });
    }

    const existingUser =
      await User.findOne({
        email:
          normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        message:
          "An account with this email already exists",
      });
    }

    const user =
      await User.create({
        name:
          normalizedName,

        email:
          normalizedEmail,

        password,
      });

    const token =
      generateToken(
        user._id.toString(),
      );

    res.cookie(
      AUTH_COOKIE_NAME,
      token,
      getAuthCookieOptions(),
    );

    return res.status(201).json({
      message:
        "User registered successfully",

      user: {
        id: user._id,
        name: user.name,
        email:
          user.email,
        avatar:
          user.avatar,
      },
    });
  } catch (error) {
    console.error(
      "Register error:",
      error.message,
    );

    if (
      error?.code ===
      11000
    ) {
      return res.status(409).json({
        message:
          "An account with this email already exists",
      });
    }

    if (
      error?.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        message:
          "Invalid registration data",
      });
    }

    return res.status(500).json({
      message:
        "Failed to register user",
    });
  }
}

/*
 * =========================================================
 * LOGIN
 * =========================================================
 */

async function login(
  req,
  res,
) {
  try {
    const {
      email,
      password,
    } = req.body ?? {};

    const normalizedEmail =
      normalizeEmail(
        email,
      );

    if (
      !normalizedEmail ||
      typeof password !==
        "string" ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const user =
      await User.findOne({
        email:
          normalizedEmail,
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

    res.cookie(
      AUTH_COOKIE_NAME,
      token,
      getAuthCookieOptions(),
    );

    return res.status(200).json({
      message:
        "Login successful",

      user: {
        id: user._id,
        name: user.name,
        email:
          user.email,
        avatar:
          user.avatar,
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

/*
 * =========================================================
 * LOGOUT
 * =========================================================
 */

function logout(
  req,
  res,
) {
  res.clearCookie(
    AUTH_COOKIE_NAME,
    getCookieOptions(),
  );

  return res.status(200).json({
    message:
      "Logout successful",
  });
}

/*
 * =========================================================
 * GET CURRENT USER
 * =========================================================
 */

async function getMe(
  req,
  res,
) {
  return res.status(200).json({
    user: {
      id: req.user._id,
      name:
        req.user.name,
      email:
        req.user.email,
      avatar:
        req.user.avatar,
    },
  });
}

/*
 * =========================================================
 * UPDATE CURRENT USER
 * =========================================================
 */

async function updateMe(
  req,
  res,
) {
  try {
    const {
      name,
      email,
    } = req.body ?? {};

    if (
      name !== undefined
    ) {
      if (
        typeof name !==
          "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          message:
            "Name cannot be empty",
        });
      }

      const normalizedName =
        name.trim();

      if (
        normalizedName.length >
        MAX_NAME_LENGTH
      ) {
        return res.status(400).json({
          message:
            `Name cannot exceed ${MAX_NAME_LENGTH} characters`,
        });
      }

      req.user.name =
        normalizedName;
    }

    if (
      email !== undefined
    ) {
      if (
        typeof email !==
        "string"
      ) {
        return res.status(400).json({
          message:
            "Invalid email",
        });
      }

      const normalizedEmail =
        normalizeEmail(
          email,
        );

      if (!normalizedEmail) {
        return res.status(400).json({
          message:
            "Email cannot be empty",
        });
      }

      if (
        normalizedEmail.length >
        MAX_EMAIL_LENGTH
      ) {
        return res.status(400).json({
          message:
            "Email is too long",
        });
      }

      const existingUser =
        await User.findOne({
          email:
            normalizedEmail,

          _id: {
            $ne:
              req.user._id,
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
        name:
          req.user.name,
        email:
          req.user.email,
        avatar:
          req.user.avatar,
      },
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error.message,
    );

    if (
      error?.code ===
      11000
    ) {
      return res.status(409).json({
        message:
          "An account with this email already exists",
      });
    }

    if (
      error?.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        message:
          "Invalid profile data",
      });
    }

    return res.status(500).json({
      message:
        "Failed to update profile",
    });
  }
}

/*
 * =========================================================
 * EXPORTS
 * =========================================================
 */

export {
  getMe,
  login,
  logout,
  register,
  updateMe,
};
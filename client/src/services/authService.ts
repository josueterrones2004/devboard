import {
  apiRequest,
} from "./api";

type User = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};

type AuthResponse = {
  message: string;
  token: string;
  user: User;
};

type UserResponse = {
  message?: string;
  user: User;
};

type LoginCredentials = {
  email: string;
  password: string;
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
};

type UpdateProfileData = {
  name: string;
  email: string;
};

async function login(
  credentials: LoginCredentials,
) {
  const response =
    await apiRequest<AuthResponse>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify(
          credentials,
        ),
      },
    );

  saveSession(response);

  return response;
}

async function register(
  data: RegisterData,
) {
  const response =
    await apiRequest<AuthResponse>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

  saveSession(response);

  return response;
}

async function getMe() {
  return apiRequest<UserResponse>(
    "/api/auth/me",
    {
      auth: true,
    },
  );
}

async function updateProfile(
  data: UpdateProfileData,
) {
  const response =
    await apiRequest<UserResponse>(
      "/api/auth/me",
      {
        method: "PATCH",
        auth: true,
        body: JSON.stringify(data),
      },
    );

  localStorage.setItem(
    "devboard_user",
    JSON.stringify(
      response.user,
    ),
  );

  return response;
}

function logout() {
  localStorage.removeItem(
    "devboard_token",
  );

  localStorage.removeItem(
    "devboard_user",
  );
}

function isAuthenticated() {
  return Boolean(
    localStorage.getItem(
      "devboard_token",
    ),
  );
}

function getStoredUser(): User | null {
  const stored =
    localStorage.getItem(
      "devboard_user",
    );

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(
      stored,
    ) as User;
  } catch {
    return null;
  }
}

function saveSession(
  response: AuthResponse,
) {
  localStorage.setItem(
    "devboard_token",
    response.token,
  );

  localStorage.setItem(
    "devboard_user",
    JSON.stringify(
      response.user,
    ),
  );
}

export {
  getMe,
  getStoredUser,
  isAuthenticated,
  login,
  logout,
  register,
  updateProfile,
};

export type {
  User,
};
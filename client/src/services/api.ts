const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5000";

type ApiOptions =
  RequestInit & {
    auth?: boolean;
  };

async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const {
    auth = false,
    headers,
    ...requestOptions
  } = options;

  const token =
    localStorage.getItem(
      "devboard_token",
    );

  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...requestOptions,

        headers: {
          "Content-Type":
            "application/json",

          ...(auth && token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),

          ...headers,
        },
      },
    );

  const data =
    await response.json();

  if (
    response.status === 401 &&
    auth
  ) {
    localStorage.removeItem(
      "devboard_token",
    );

    localStorage.removeItem(
      "devboard_user",
    );

    window.location.href =
      "/login";

    throw new Error(
      "Session expired",
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ??
        "Something went wrong",
    );
  }

  return data as T;
}

export {
  apiRequest,
};
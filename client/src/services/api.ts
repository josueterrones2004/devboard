const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5000";

type ApiOptions =
  RequestInit & {
    auth?: boolean;
  };

type ApiErrorData = {
  message?: string;
  field?: string;
  code?: string;
};

/*
 * =========================================================
 * API ERROR
 * =========================================================
 */

class ApiError extends Error {
  status: number;
  field?: string;
  code?: string;

  constructor(
    message: string,
    status: number,
    field?: string,
    code?: string,
  ) {
    super(message);

    this.name =
      "ApiError";

    this.status =
      status;

    this.field =
      field;

    this.code =
      code;
  }
}

/*
 * =========================================================
 * API REQUEST
 * =========================================================
 */

async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const {
    auth = false,
    headers,
    ...requestOptions
  } = options;

  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...requestOptions,

        /*
         * The browser sends the
         * HttpOnly session cookie.
         */

        credentials:
          "include",

        headers: {
          "Content-Type":
            "application/json",

          ...headers,
        },
      },
    );

  /*
   * =========================================================
   * RESPONSE DATA
   * =========================================================
   */

  const data: unknown =
    await response
      .json()
      .catch(() => null);

  /*
   * =========================================================
   * EXPIRED SESSION
   * =========================================================
   */

  if (
    response.status ===
      401 &&
    auth
  ) {
    /*
     * Remove any token left by
     * the old Bearer implementation.
     */

    localStorage.removeItem(
      "devboard_token",
    );

    localStorage.removeItem(
      "devboard_user",
    );

    if (
      window.location.pathname !==
      "/login"
    ) {
      window.location.href =
        "/login";
    }

    throw new ApiError(
      "Session expired",
      401,
    );
  }

  /*
   * =========================================================
   * API ERROR
   * =========================================================
   */

  if (!response.ok) {
    const errorData =
      (data ??
        {}) as ApiErrorData;

    throw new ApiError(
      errorData.message ??
        "Something went wrong",
      response.status,
      errorData.field,
      errorData.code,
    );
  }

  /*
   * =========================================================
   * SUCCESS
   * =========================================================
   */

  return data as T;
}

/*
 * =========================================================
 * EXPORTS
 * =========================================================
 */

export {
  ApiError,
  apiRequest,
};
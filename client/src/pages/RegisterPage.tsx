import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  isAuthenticated,
  register,
} from "../services/authService";

function RegisterPage() {
  const navigate =
    useNavigate();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  if (isAuthenticated()) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await register({
        name,
        email,
        password,
      });

      navigate(
        "/dashboard",
        {
          replace: true,
        },
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0c10] px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7657ff] to-[#4c7dff] text-sm font-black">
            DB
          </div>

          <span className="text-lg font-black tracking-[-0.035em]">
            DevBoard
          </span>
        </Link>

        <div className="rounded-2xl border border-white/[0.08] bg-[#111218] p-6 sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8f7bff]">
            Get started
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.045em]">
            Create account
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/35">
            Create your DevBoard workspace and start organizing your work.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-[#ff6b7a]/20 bg-[#ff6b7a]/10 px-4 py-3 text-xs font-semibold text-[#ff8994]">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-5"
          >
            <div>
              <label
                htmlFor="name"
                className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35"
              >
                Full name
              </label>

              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value,
                  )
                }
                placeholder="Your name"
                className="mt-2 h-12 w-full rounded-xl border border-white/[0.08] bg-[#0d0e13] px-4 text-sm font-semibold outline-none transition-all placeholder:text-white/20 focus:border-[#7657ff]/60 focus:ring-4 focus:ring-[#7657ff]/10"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="you@example.com"
                className="mt-2 h-12 w-full rounded-xl border border-white/[0.08] bg-[#0d0e13] px-4 text-sm font-semibold outline-none transition-all placeholder:text-white/20 focus:border-[#7657ff]/60 focus:ring-4 focus:ring-[#7657ff]/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="Minimum 8 characters"
                className="mt-2 h-12 w-full rounded-xl border border-white/[0.08] bg-[#0d0e13] px-4 text-sm font-semibold outline-none transition-all placeholder:text-white/20 focus:border-[#7657ff]/60 focus:ring-4 focus:ring-[#7657ff]/10"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#7657ff] px-5 py-3.5 text-sm font-black text-white transition-all hover:bg-[#846cff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating account..."
                : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/30">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-black text-[#a897ff] hover:text-white"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default RegisterPage;
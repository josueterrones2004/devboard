import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getMe,
  logout,
  updateProfile,
} from "../services/authService";

function SettingsPage() {
  const navigate =
    useNavigate();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    getMe()
      .then((response) => {
        setName(
          response.user.name,
        );

        setEmail(
          response.user.email,
        );
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load profile",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await updateProfile({
        name,
        email,
      });

      setSuccess(
        "Profile updated successfully.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update profile",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="border-b border-white/[0.07] pb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8f7bff]">
          Account
        </p>

        <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl">
          Settings
        </h2>

        <p className="mt-3 text-sm leading-6 text-white/40">
          Manage your DevBoard profile and account session.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-white/[0.07] bg-[#111218]">
        <div className="border-b border-white/[0.07] p-5 sm:p-6">
          <h3 className="text-lg font-black text-white">
            Profile
          </h3>

          <p className="mt-1 text-xs leading-5 text-white/30">
            Your profile information is stored in your DevBoard account.
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-sm font-semibold text-white/30">
            Loading profile...
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-6"
          >
            {error && (
              <div className="mb-5 rounded-xl border border-[#ff6b7a]/20 bg-[#ff6b7a]/10 px-4 py-3 text-xs font-semibold text-[#ff8994]">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-xl border border-[#49d6b0]/20 bg-[#49d6b0]/10 px-4 py-3 text-xs font-semibold text-[#67dfbc]">
                {success}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
                Full name

                <input
                  required
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value,
                    )
                  }
                  className="input-style mt-2"
                />
              </label>

              <label className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
                Email

                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  className="input-style mt-2"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#7657ff] px-5 py-3 text-xs font-black text-white transition-colors hover:bg-[#846cff] disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-[#ff6b7a]/15 bg-[#111218] p-5 sm:p-6">
        <h3 className="text-lg font-black text-white">
          Session
        </h3>

        <p className="mt-2 text-sm leading-6 text-white/35">
          Sign out of your current DevBoard session.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-5 rounded-xl border border-[#ff6b7a]/20 bg-[#ff6b7a]/10 px-5 py-3 text-xs font-black text-[#ff8994] transition-colors hover:bg-[#ff6b7a]/15"
        >
          Sign out
        </button>
      </section>
    </div>
  );
}

export default SettingsPage;
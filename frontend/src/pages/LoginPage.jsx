import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      setSubmitting(true);
      await login(formData);
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to login");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glass-panel w-full max-w-md rounded-[2rem] border border-white/60 p-8 shadow-card">
        <div className="flex flex-col items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-[1.8rem] bg-white/90 shadow-sm">
            <img
              src="/assets/pixelle-logo.png"
              alt="Pixelle logo"
              className="h-16 w-16 object-contain drop-shadow-sm"
            />
          </div>
          <p className="brand-title mt-4 text-center text-4xl font-bold text-ink">Pixelle</p>
        </div>
        <p className="mt-3 text-center text-sm text-slate-600">
          Log in to view your feed and profile authenticity score.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(event) => setFormData({ ...formData, email: event.target.value })}
            className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 outline-none focus:border-coral"
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
            className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 outline-none focus:border-coral"
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-coral px-4 py-3 font-semibold text-white"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          New here?{" "}
          <Link to="/register" className="font-semibold text-moss">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;

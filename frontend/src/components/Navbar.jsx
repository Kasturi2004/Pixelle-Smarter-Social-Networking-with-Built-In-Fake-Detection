import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getImageUrl } from "../api/client";

function NavIcon({ type }) {
  const commonProps = {
    className: "h-[18px] w-[18px]",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  if (type === "feed") {
    return (
      <svg {...commonProps}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    );
  }

  if (type === "discover") {
    return (
      <svg {...commonProps}>
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    );
  }

  if (type === "create") {
    return (
      <svg {...commonProps}>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </svg>
    );
  }

  if (type === "messages") {
    return (
      <svg {...commonProps}>
        <path d="M4 6h16v10H8l-4 4V6Z" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <aside className="glass-panel h-fit rounded-3xl border border-white/60 p-5 shadow-card md:sticky md:top-6 md:w-[300px] xl:w-[320px]">
      <Link to="/" className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-white/90 shadow-sm">
          <img
            src="/assets/pixelle-logo.png"
            alt="Pixelle logo"
            className="h-12 w-12 object-contain drop-shadow-sm"
          />
        </div>
        <div>
          <p className="brand-title text-[2.15rem] font-bold leading-none text-ink">Pixelle</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-coral/80">
            Social Stories
          </p>
        </div>
      </Link>
      <p className="mt-3 text-[15px] leading-7 text-slate-600">Where every pixel tells a story.</p>

      <Link
        to={`/profile/${user?.username}`}
        className="mt-6 flex items-center gap-3 rounded-2xl bg-white/80 p-3 transition hover:bg-white hover:shadow-sm"
      >
        <img
          src={getImageUrl(user?.profilePic)}
          alt={user?.username}
          className="h-14 w-14 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-ink">
            {user?.fullName?.trim() || user?.username}
          </p>
          <p className="truncate text-sm font-medium text-slate-500">@{user?.username}</p>
        </div>
      </Link>

      <nav className="mt-6 space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-semibold tracking-[0.01em] transition ${
              isActive ? "bg-coral text-white" : "bg-white/70 text-ink hover:bg-white"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isActive ? "bg-white/20" : "bg-blush text-coral"
                }`}
              >
                <NavIcon type="feed" />
              </span>
              <span>Feed</span>
            </>
          )}
        </NavLink>
        <NavLink
          to="/discover"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-semibold tracking-[0.01em] transition ${
              isActive ? "bg-coral text-white" : "bg-white/70 text-ink hover:bg-white"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isActive ? "bg-white/20" : "bg-blush text-coral"
                }`}
              >
                <NavIcon type="discover" />
              </span>
              <span>Discover</span>
            </>
          )}
        </NavLink>
        <NavLink
          to="/create-post"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-semibold tracking-[0.01em] transition ${
              isActive ? "bg-coral text-white" : "bg-white/70 text-ink hover:bg-white"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isActive ? "bg-white/20" : "bg-blush text-coral"
                }`}
              >
                <NavIcon type="create" />
              </span>
              <span>Create post</span>
            </>
          )}
        </NavLink>
        <NavLink
          to="/messages"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-semibold tracking-[0.01em] transition ${
              isActive ? "bg-coral text-white" : "bg-white/70 text-ink hover:bg-white"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isActive ? "bg-white/20" : "bg-blush text-coral"
                }`}
              >
                <NavIcon type="messages" />
              </span>
              <span>Messages</span>
            </>
          )}
        </NavLink>
        <NavLink
          to={`/profile/${user?.username}`}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-semibold tracking-[0.01em] transition ${
              isActive ? "bg-coral text-white" : "bg-white/70 text-ink hover:bg-white"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isActive ? "bg-white/20" : "bg-blush text-coral"
                }`}
              >
                <NavIcon type="profile" />
              </span>
              <span>Profile</span>
            </>
          )}
        </NavLink>
      </nav>

      <button
        type="button"
        onClick={logout}
        className="mt-6 w-full rounded-2xl bg-ink px-4 py-3.5 text-[15px] font-semibold tracking-[0.01em] text-white transition hover:bg-slate-700"
      >
        Log out
      </button>
    </aside>
  );
}

export default Navbar;

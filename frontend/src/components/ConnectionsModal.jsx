import { useNavigate } from "react-router-dom";
import { getImageUrl } from "../api/client";
import SuspiciousBadge from "./SuspiciousBadge";

function ConnectionsModal({ title, users, loading, onClose }) {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-panel flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/70 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-orange-100/80 bg-gradient-to-r from-white/80 via-blush/40 to-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral/80">
              Connections
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">{title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close connections dialog"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-base font-semibold text-slate-500 transition hover:text-ink"
          >
            X
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="rounded-[1.5rem] bg-white/70 px-5 py-5 text-sm text-slate-500">
              Loading {title.toLowerCase()}...
            </div>
          ) : users.length ? (
            <div className="space-y-3">
              {users.map((person) => (
                <button
                  key={person._id}
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/profile/${person.username}`);
                  }}
                  className="flex w-full items-center gap-4 rounded-[1.5rem] bg-white/80 px-4 py-4 text-left shadow-sm ring-1 ring-orange-100 transition hover:bg-white"
                >
                  <img
                    src={getImageUrl(person.profilePic)}
                    alt={person.username}
                    className="h-14 w-14 rounded-full object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-ink">
                      {person.fullName?.trim() || person.username}
                    </p>
                    <p className="truncate text-sm text-slate-500">@{person.username}</p>
                  </div>

                  <div className="hidden shrink-0 sm:block">
                    <SuspiciousBadge isFake={person.isFake} riskScore={person.riskScore} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] bg-white/70 px-5 py-5 text-sm text-slate-500">
              No one to show here yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConnectionsModal;

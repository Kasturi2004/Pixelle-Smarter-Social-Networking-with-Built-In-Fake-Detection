import { useState } from "react";
import api from "../api/client";

const REPORT_REASONS = [
  { value: "Fake profile", label: "Fake profile" },
  { value: "Impersonation", label: "Impersonation" },
  { value: "Spam activity", label: "Spam activity" },
  { value: "Scam behavior", label: "Scam behavior" },
  { value: "Harassment", label: "Harassment" }
];

function ReportAccountModal({ targetUser, onClose, onReported }) {
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.post(`/reports/${targetUser._id}`, {
        reason,
        details
      });
      onReported();
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to submit the report right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/70 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-orange-100/80 bg-gradient-to-r from-white/80 via-blush/40 to-white px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral/80">
                Report Account
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">
                Report @{targetUser.username}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Let Pixelle know why this account feels suspicious. You can update your report
                later if needed.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close report dialog"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-base font-semibold text-slate-500 transition hover:text-ink"
            >
              X
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-b-[2rem] bg-[rgba(245,239,232,0.92)] p-5"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Reason
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {REPORT_REASONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setReason(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    reason === option.value
                      ? "bg-coral text-white shadow-md shadow-orange-200"
                      : "bg-white text-slate-600 ring-1 ring-orange-100 hover:bg-sand"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block rounded-[1.5rem] border border-orange-100 bg-white/80 p-4 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Details
            </span>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value.slice(0, 280))}
              rows="4"
              placeholder="Add a few details if you want to explain the report..."
              className="mt-3 w-full resize-none bg-transparent text-sm leading-7 text-ink outline-none placeholder:text-slate-300"
            />
            <span className="mt-2 block text-right text-xs text-slate-400">{details.length}/280</span>
          </label>

          {error ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 ring-1 ring-rose-100">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-slate-500">
              Reports help surface accounts that may need a closer review.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-md shadow-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Submitting..." : "Submit report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportAccountModal;

function SuspiciousBadge({ isFake, riskScore }) {
  if (!isFake) {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        Real-like account
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
      Suspicious {Math.round((riskScore || 0) * 100)}%
    </span>
  );
}

export default SuspiciousBadge;

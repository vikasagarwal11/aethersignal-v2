export default function SignalsRoadmapPage() {
  return (
    <div className="p-4 space-y-3 text-sm">
      <h1 className="text-lg font-semibold">Signals Roadmap (Phase 2/3)</h1>
      <p className="text-gray-700">
        Internal-only roadmap of advanced features to be implemented after Phase 1 baseline is complete.
      </p>

      <ul className="list-disc ml-5 space-y-1">
        <li>
          <strong>Compare analyses:</strong> side-by-side view of 2–3 cohorts
          (e.g., warfarin bleeding 2023 vs 2024).
        </li>
        <li>
          <strong>Save analysis:</strong> star/bookmark analyses, show them in a
          sidebar or dedicated tab, reopen later.
        </li>
        <li>
          <strong>Scheduled reports:</strong> run selected analyses weekly/monthly,
          email results to specified users.
        </li>
        <li>
          <strong>Alert thresholds:</strong> define thresholds (e.g. &gt;50 cases)
          and automatically notify when exceeded.
        </li>
        <li>
          <strong>Advanced charts:</strong> time trends, age/sex distribution,
          regional heatmaps, etc.
        </li>
      </ul>

      <p className="text-xs text-gray-500 mt-4">
        NOTE: This page is for internal planning only. End-users will not see it in production.
      </p>
    </div>
  );
}


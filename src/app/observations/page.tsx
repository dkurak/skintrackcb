export default function ObservationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Avalanche Observations</h1>
        <p className="text-gray-500">Recent avalanche reports and observations</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Coming Soon</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Avalanche observation reports from CBAC will be displayed here, with links
          to full reports and correlation to forecast conditions.
        </p>
      </div>
    </div>
  );
}

export default function TestPage() {
  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <h1 className="text-lg font-semibold mb-4">Test Page</h1>
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-green-700">
          ✅ This page is working! Main Director routes are functioning properly.
        </p>
      </div>
      <div className="mt-4">
        <p>Current time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}

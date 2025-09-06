export default function AnnouncementsPage() {
  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">All Announcements</h1>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Can Create</span>
        </div>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-green-700">Main Directors can create announcements.</p>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-green-600 font-semibold">✅ Announcements page under /main-director/list/announcements</p>
      </div>
    </div>
  );
}

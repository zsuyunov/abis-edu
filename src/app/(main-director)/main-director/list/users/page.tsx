export default function UsersPage() {
  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">All Users</h1>
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Read-Only Access</span>
        </div>
      </div>
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-purple-700">You can view user information. Create/edit/delete are admin-only.</p>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-green-600 font-semibold">✅ Users page under /main-director/list/users</p>
      </div>
    </div>
  );
}

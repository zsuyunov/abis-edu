import Link from "next/link";

export default function TestPanelsPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">🎯 Test Role-Specific Panels</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Panel */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-700 mb-4">👑 Admin Panel</h2>
            <p className="text-gray-600 mb-4">Full system management with analytics and user controls</p>
            <Link 
              href="/admin" 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-block"
            >
              Access Admin Dashboard
            </Link>
          </div>

          {/* Teacher Panel */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-700 mb-4">👨‍🏫 Teacher Panel</h2>
            <p className="text-gray-600 mb-4">Teaching tools, class management, and student grades</p>
            <Link 
              href="/teacher" 
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 inline-block"
            >
              Access Teacher Dashboard
            </Link>
          </div>

          {/* Student Panel */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-purple-700 mb-4">👨‍🎓 Student Panel</h2>
            <p className="text-gray-600 mb-4">Personal schedule, assignments, and grades</p>
            <Link 
              href="/student" 
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 inline-block"
            >
              Access Student Dashboard
            </Link>
          </div>

          {/* Parent Panel */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-orange-700 mb-4">👪 Parent Panel</h2>
            <p className="text-gray-600 mb-4">Children's information and academic progress</p>
            <Link 
              href="/parent" 
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 inline-block"
            >
              Access Parent Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-red-700 mb-2">🚫 Clear Session</h3>
            <p className="text-gray-600 mb-3">If you're experiencing auto-redirect issues, clear all sessions:</p>
            <Link 
              href="/force-logout" 
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 inline-block"
            >
              Force Clear All Sessions
            </Link>
          </div>
          
          <Link 
            href="/login" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

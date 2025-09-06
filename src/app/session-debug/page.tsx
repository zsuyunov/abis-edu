"use client";

import { useEffect, useState } from "react";

export default function SessionDebugPage() {
  const [cookies, setCookies] = useState<string>("");
  const [apiResponse, setApiResponse] = useState<string>("");

  useEffect(() => {
    // Show all cookies
    setCookies(document.cookie);
  }, []);

  const testClearSession = async () => {
    try {
      const response = await fetch("/api/clear-session", {
        method: "POST",
      });
      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
      
      // Refresh cookies display
      setTimeout(() => {
        setCookies(document.cookie);
      }, 500);
    } catch (error) {
      setApiResponse(`Error: ${error}`);
    }
  };

  const manualClearCookies = () => {
    const allCookies = [
      "auth_token",
      "__session", 
      "__session_61dFzdSC",
      "__clerk_db_jwt",
      "__clerk_db_jwt_u6pPacZK", 
      "__clerk_db_jwt_TDWNA_Aa",
      "__clerk_db_jwt_61dFzdSC",
      "__client_uat",
      "__client_uat_61dFzdSC",
      "__client_uat_u6pPacZK",
      "__client_uat_TDWNA_Aa"
    ];
    
    allCookies.forEach(cookie => {
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
    });
    
    localStorage.clear();
    sessionStorage.clear();
    
    setTimeout(() => {
      setCookies(document.cookie);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Session Debug Tool</h1>
        
        <div className="grid gap-6">
          {/* Current Cookies */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Current Cookies</h2>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono overflow-auto max-h-40">
              {cookies || "No cookies found"}
            </div>
            <button 
              onClick={() => setCookies(document.cookie)}
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Refresh Cookies
            </button>
          </div>

          {/* Clear Session API Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Clear Session API</h2>
            <button 
              onClick={testClearSession}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mr-4"
            >
              Call /api/clear-session
            </button>
            <button 
              onClick={manualClearCookies}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              Manual Clear Cookies
            </button>
            {apiResponse && (
              <div className="mt-4 bg-gray-100 p-4 rounded text-sm font-mono">
                <strong>API Response:</strong>
                <pre>{apiResponse}</pre>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-x-4">
              <a href="/login" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block">
                Go to Login
              </a>
              <a href="/force-logout" className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 inline-block">
                Force Logout
              </a>
              <a href="/test-panels" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block">
                Test Panels
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

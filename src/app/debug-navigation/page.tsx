/**
 * Debug Navigation Page - TEMPORARY
 * DELETE THIS FILE AFTER FIXING THE ISSUE!
 */

'use client';

import { usePathname } from 'next/navigation';
import { useNavigation } from '@/hooks/useNavigation';
import { useState } from 'react';

export default function DebugNavigationPage() {
  const pathname = usePathname();
  const { navigateTo } = useNavigation();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testNavigation = (path: string) => {
    addLog(`Attempting to navigate to: ${path}`);
    try {
      navigateTo(path);
      addLog(`Navigation call successful`);
    } catch (error) {
      addLog(`Navigation error: ${error}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Navigation Debug</h1>
      
      <div className="mb-4">
        <p><strong>Current Path:</strong> {pathname}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Test Navigation</h2>
        <div className="space-x-2">
          <button 
            onClick={() => testNavigation('/admin')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Dashboard
          </button>
          <button 
            onClick={() => testNavigation('/admin/list/teachers')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Go to Teachers
          </button>
          <button 
            onClick={() => testNavigation('/admin/list/students')}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Go to Students
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
        <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Click a navigation button above.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {log}
              </div>
            ))
          )}
        </div>
        <button 
          onClick={() => setLogs([])}
          className="mt-2 px-3 py-1 bg-gray-500 text-white rounded text-sm"
        >
          Clear Logs
        </button>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Browser Console</h2>
        <p className="text-sm text-gray-600">
          Open your browser's developer tools (F12) and check the Console tab for any JavaScript errors.
        </p>
      </div>
    </div>
  );
}

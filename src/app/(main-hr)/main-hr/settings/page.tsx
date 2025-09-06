"use client";

import { useState, useEffect } from "react";

const MainHRSettingsPage = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
    privacy: {
      profileVisibility: "public",
      dataSharing: false,
    },
    preferences: {
      language: "en",
      timezone: "UTC+5",
      dateFormat: "DD/MM/YYYY",
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Simulate loading settings
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // API call to save settings would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Settings saved successfully!");
    } catch (error) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 m-4 mt-0">
        <div className="bg-white p-4 rounded-md">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 m-4 mt-0">
      <div className="bg-white p-6 rounded-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Main HR Settings</h1>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <div className="space-y-8">
          {/* Notifications */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Notifications</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                  <span className="text-xs text-gray-500">Receive notifications via email</span>
                </label>
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">SMS Notifications</span>
                  <span className="text-xs text-gray-500">Receive notifications via SMS</span>
                </label>
                <input
                  type="checkbox"
                  checked={settings.notifications.sms}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, sms: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">Push Notifications</span>
                  <span className="text-xs text-gray-500">Receive browser push notifications</span>
                </label>
                <input
                  type="checkbox"
                  checked={settings.notifications.push}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, push: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Privacy & Security</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">Profile Visibility</span>
                  <span className="text-xs text-gray-500">Who can see your profile information</span>
                </label>
                <select
                  value={settings.privacy.profileVisibility}
                  onChange={(e) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, profileVisibility: e.target.value }
                  })}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="public">Public</option>
                  <option value="organization">Organization Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">Data Sharing</span>
                  <span className="text-xs text-gray-500">Allow data sharing for analytics</span>
                </label>
                <input
                  type="checkbox"
                  checked={settings.privacy.dataSharing}
                  onChange={(e) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, dataSharing: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Preferences</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">Language</span>
                  <span className="text-xs text-gray-500">Choose your preferred language</span>
                </label>
                <select
                  value={settings.preferences.language}
                  onChange={(e) => setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, language: e.target.value }
                  })}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="en">English</option>
                  <option value="uz">Uzbek</option>
                  <option value="ru">Russian</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">Timezone</span>
                  <span className="text-xs text-gray-500">Your local timezone</span>
                </label>
                <select
                  value={settings.preferences.timezone}
                  onChange={(e) => setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, timezone: e.target.value }
                  })}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="UTC+5">UTC+5 (Tashkent)</option>
                  <option value="UTC+0">UTC+0 (GMT)</option>
                  <option value="UTC+3">UTC+3 (Moscow)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">Date Format</span>
                  <span className="text-xs text-gray-500">How dates are displayed</span>
                </label>
                <select
                  value={settings.preferences.dateFormat}
                  onChange={(e) => setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, dateFormat: e.target.value }
                  })}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainHRSettingsPage;

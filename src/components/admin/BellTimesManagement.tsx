'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  AlertCircle,
  School,
  GraduationCap
} from 'lucide-react';

interface BellTime {
  id?: number;
  eventName: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

const BellTimesManagement: React.FC = () => {
  const [selectedYearRange, setSelectedYearRange] = useState<'1-6' | '7-13'>('1-6');
  const [bellTimes, setBellTimes] = useState<BellTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Default bell times templates
  const primaryTemplate: BellTime[] = [
    { eventName: 'Breakfast', startTime: '08:00', endTime: '08:25', notes: '25min / 5 minutes preparation for the start of the lesson' },
    { eventName: 'Lesson 1', startTime: '08:30', endTime: '09:10', notes: 'the break is 5 minutes' },
    { eventName: 'Lesson 2', startTime: '09:15', endTime: '09:55', notes: 'the break is 5 minutes' },
    { eventName: 'Lesson 3', startTime: '10:00', endTime: '10:40', notes: 'the break is 5 minutes' },
    { eventName: 'Lesson 4', startTime: '10:45', endTime: '11:25', notes: 'the break is 5 minutes' },
    { eventName: 'Lesson 5', startTime: '11:30', endTime: '12:10', notes: '' },
    { eventName: 'Lunch break for Year 1-6', startTime: '12:15', endTime: '12:55', notes: '' },
    { eventName: 'Lesson 6', startTime: '13:00', endTime: '13:40', notes: 'the break is 5 minutes' },
    { eventName: 'Lesson 7', startTime: '13:45', endTime: '14:25', notes: 'the break is 5 minutes' },
    { eventName: 'Lesson 8', startTime: '14:30', endTime: '15:10', notes: '' },
    { eventName: 'Snack Time', startTime: '15:10', endTime: '15:25', notes: '' },
    { eventName: 'Lesson 9', startTime: '15:25', endTime: '16:05', notes: 'the break is 5 minutes' },
    { eventName: 'Lesson 10', startTime: '16:10', endTime: '16:50', notes: 'preparing to go home after 16:50' }
  ];

  const secondaryTemplate: BellTime[] = [
    { eventName: 'Breakfast', startTime: '08:00', endTime: '08:25', notes: '25min / 5 minutes preparation for the start of the lesson' },
    { eventName: 'Lesson 1', startTime: '08:30', endTime: '09:10', notes: 'the break is 5 minutes' },
    { eventName: 'Lesson 2', startTime: '09:15', endTime: '09:55', notes: 'the break is 5 minutes' },
    { eventName: 'Lesson 3', startTime: '10:00', endTime: '10:40', notes: 'the break is 5 minutes' },
    { eventName: 'Lesson 4', startTime: '10:45', endTime: '11:25', notes: 'the break is 5 minutes' },
    { eventName: 'Lesson 5', startTime: '11:30', endTime: '12:10', notes: 'the break is 5 minutes' },
    { eventName: 'Lesson 6', startTime: '12:15', endTime: '12:55', notes: '' },
    { eventName: 'Lunch break', startTime: '13:00', endTime: '13:40', notes: '' },
    { eventName: 'Lesson 7', startTime: '13:45', endTime: '14:25', notes: 'the break is 5 minutes' },
    { eventName: 'Lesson 8', startTime: '14:30', endTime: '15:10', notes: '' },
    { eventName: 'Snack Time', startTime: '15:10', endTime: '15:25', notes: '' },
    { eventName: 'Lesson 9', startTime: '15:25', endTime: '16:05', notes: 'the break is 5 minutes' },
    { eventName: 'Lesson 10', startTime: '16:10', endTime: '16:50', notes: 'preparing to go home after 16:50' }
  ];

  useEffect(() => {
    fetchBellTimes();
  }, [selectedYearRange]);

  const fetchBellTimes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/bell-times?yearRange=${selectedYearRange}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length === 0) {
          // Load default template if no bell times exist
          setBellTimes(selectedYearRange === '1-6' ? primaryTemplate : secondaryTemplate);
        } else {
          setBellTimes(data);
        }
      } else {
        throw new Error('Failed to fetch bell times');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch bell times');
      // Load default template on error
      setBellTimes(selectedYearRange === '1-6' ? primaryTemplate : secondaryTemplate);
    } finally {
      setLoading(false);
    }
  };

  const saveBellTimes = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/bell-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yearRange: selectedYearRange,
          bellTimes: bellTimes.map(bt => ({
            eventName: bt.eventName,
            startTime: bt.startTime,
            endTime: bt.endTime,
            notes: bt.notes || null
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save bell times');
      }

      setSuccess('Bell times saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      fetchBellTimes(); // Refresh data
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save bell times');
    } finally {
      setSaving(false);
    }
  };

  const addBellTime = () => {
    const newBellTime: BellTime = {
      eventName: '',
      startTime: '',
      endTime: '',
      notes: ''
    };
    setBellTimes([...bellTimes, newBellTime]);
    setEditingIndex(bellTimes.length);
  };

  const updateBellTime = (index: number, field: keyof BellTime, value: string) => {
    const updated = bellTimes.map((bt, i) => 
      i === index ? { ...bt, [field]: value } : bt
    );
    setBellTimes(updated);
  };

  const removeBellTime = (index: number) => {
    setBellTimes(bellTimes.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const resetToTemplate = () => {
    setBellTimes(selectedYearRange === '1-6' ? primaryTemplate : secondaryTemplate);
    setEditingIndex(null);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.length === 5 ? time : time + ':00';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bell Times Management</h1>
          <p className="text-gray-600">Configure lesson times for primary and secondary schools</p>
        </div>

        {/* Error/Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </motion.div>
          )}
          
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"
            >
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-green-700">{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Year Range Selection */}
        <div className="flex justify-center">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setSelectedYearRange('1-6')}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all ${
                selectedYearRange === '1-6'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <School className="w-5 h-5" />
              Primary School (Years 1-6)
            </button>
            <button
              onClick={() => setSelectedYearRange('7-13')}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all ${
                selectedYearRange === '7-13'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              Secondary School (Years 7-13)
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <button
              onClick={addBellTime}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Bell Time
            </button>
            <button
              onClick={resetToTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reset to Template
            </button>
          </div>
          
          <button
            onClick={saveBellTimes}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Bell Times'}
          </button>
        </div>

        {/* Bell Times Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Event</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Start Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">End Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Notes</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bellTimes.map((bellTime, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        {editingIndex === index ? (
                          <input
                            type="text"
                            value={bellTime.eventName}
                            onChange={(e) => updateBellTime(index, 'eventName', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Event name"
                          />
                        ) : (
                          <span className="font-medium text-gray-900">{bellTime.eventName}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingIndex === index ? (
                          <input
                            type="time"
                            value={bellTime.startTime}
                            onChange={(e) => updateBellTime(index, 'startTime', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-900">{formatTime(bellTime.startTime)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingIndex === index ? (
                          <input
                            type="time"
                            value={bellTime.endTime}
                            onChange={(e) => updateBellTime(index, 'endTime', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-900">{formatTime(bellTime.endTime)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingIndex === index ? (
                          <input
                            type="text"
                            value={bellTime.notes || ''}
                            onChange={(e) => updateBellTime(index, 'notes', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Optional notes"
                          />
                        ) : (
                          <span className="text-gray-600 text-sm">{bellTime.notes}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {editingIndex === index ? (
                            <>
                              <button
                                onClick={() => setEditingIndex(null)}
                                className="p-1 text-green-600 hover:text-green-800"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingIndex(null)}
                                className="p-1 text-gray-600 hover:text-gray-800"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingIndex(index)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeBellTime(index)}
                                className="p-1 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Information Panel */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Bell Times Information</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• Bell times define the standard lesson schedule for {selectedYearRange === '1-6' ? 'primary' : 'secondary'} school students.</p>
            <p>• These times will be used as suggestions when creating timetables for classes.</p>
            <p>• You can customize the times and add notes for each period.</p>
            <p>• Changes will apply to all future timetable creations for this year range.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BellTimesManagement;

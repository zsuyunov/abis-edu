"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TeacherHomeworkGrid from "@/components/TeacherHomeworkGrid";

interface TeacherData {
  assignedClasses: Array<{
    id: string;
    name: string;
    branch: {
      id: string;
      shortName: string;
    };
  }>;
  assignedSubjects: Array<{
    id: string;
    name: string;
  }>;
}

const TeacherHomeworkPage = () => {
  const router = useRouter();
  const [teacherId, setTeacherId] = useState<string>('');
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get teacher ID from localStorage or API
    const fetchTeacherData = async () => {
      try {
        // You can get teacher ID from localStorage, cookies, or API
        const storedTeacherId = localStorage.getItem('teacherId') || 'T13862'; // Fallback for demo
        setTeacherId(storedTeacherId);

        // Fetch teacher data
        const response = await fetch('/api/teacher-data', {
          headers: {
            'x-user-id': storedTeacherId,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTeacherData(data);
        } else {
          console.error('Failed to fetch teacher data');
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  const handleHomeworkCreated = () => {
    // Show success message and redirect
    alert('✅ Homework created successfully!');
    router.push('/teacher');
  };

  const handleCancel = () => {
    // Redirect back to dashboard
    router.push('/teacher');
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📚</div>
          <div className="text-gray-600">Loading homework creation...</div>
        </div>
      </div>
    );
  }

  if (!teacherData) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Teacher not found</h2>
          <p className="text-gray-600">Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-md"></div>}>
      <TeacherHomeworkGrid 
        teacherId={teacherId}
        teacherData={teacherData}
        onHomeworkCreated={handleHomeworkCreated}
        onCancel={handleCancel}
      />
    </Suspense>
  );
};

export default TeacherHomeworkPage;

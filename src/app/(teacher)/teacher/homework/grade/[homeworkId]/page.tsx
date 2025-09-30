"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import HomeworkGradingPage from '@/components/HomeworkGradingPage';

interface HomeworkData {
  id: string;
  title: string;
  className: string;
  subjectName: string;
}

const GradeHomeworkPage = () => {
  const params = useParams();
  const router = useRouter();
  const [homeworkData, setHomeworkData] = useState<HomeworkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeworkData = async () => {
      try {
        const response = await fetch(`/api/homework-details/${params.homeworkId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch homework details');
        }
        
        const data = await response.json();
        setHomeworkData(data.homework);
      } catch (error) {
        console.error('Error fetching homework details:', error);
        alert('Failed to load homework details');
        router.push('/teacher/homework');
      } finally {
        setLoading(false);
      }
    };

    if (params.homeworkId) {
      fetchHomeworkData();
    }
  }, [params.homeworkId, router]);

  const handleBack = () => {
    router.push('/teacher/homework');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading homework details...</p>
        </div>
      </div>
    );
  }

  if (!homeworkData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Homework not found</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Homework
          </button>
        </div>
      </div>
    );
  }

  return (
    <HomeworkGradingPage
      homeworkId={params.homeworkId as string}
      homeworkTitle={homeworkData.title}
      className={homeworkData.className}
      subjectName={homeworkData.subjectName}
      onBack={handleBack}
    />
  );
};

export default GradeHomeworkPage;

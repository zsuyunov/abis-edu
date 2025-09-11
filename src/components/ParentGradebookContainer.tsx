/*
"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";

interface ParentGradebookContainerProps {
  parentId: string;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  class: {
    id: string;
    name: string;
  } | null;
}

interface GradeData {
  subject: string;
  grade: number;
  date: string;
  type: string;
}

interface ChildGrades {
  child: Child;
  grades: GradeData[];
  average: number;
  totalGrades: number;
}

const ParentGradebookContainer = ({ parentId }: ParentGradebookContainerProps) => {
  const { t } = useLanguage();
  const [childrenGrades, setChildrenGrades] = useState<ChildGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string>("");

  useEffect(() => {
    fetchChildrenGrades();
  }, [parentId]);

  const fetchChildrenGrades = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/parent/children-grades?parentId=${parentId}`);
      if (response.ok) {
        const data = await response.json();
        setChildrenGrades(data);
        if (data.length > 0 && !selectedChild) {
          setSelectedChild(data[0].child.id);
        }
      }
    } catch (error) {
      console.error("Error fetching children grades:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedChildData = childrenGrades.find(cg => cg.child.id === selectedChild);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (childrenGrades.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500 text-center py-8">No children found</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {t('student.grades.title')}
        </h2>

        {/* Child Selector }
        <div className="flex gap-2 mb-4">
          {childrenGrades.map((childData) => (
            <button
              key={childData.child.id}
              onClick={() => setSelectedChild(childData.child.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedChild === childData.child.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {childData.child.firstName} {childData.child.lastName}
              {childData.child.class && ` (${childData.child.class.name})`}
            </button>
          ))}
        </div>
      </div>

      {selectedChildData && (
        <div className="space-y-6">
          {/* Summary Stats }
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {selectedChildData.average.toFixed(1)}%
              </div>
              <div className="text-sm text-blue-800">
                {t('student.grades.overallAverage')}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {selectedChildData.totalGrades}
              </div>
              <div className="text-sm text-green-800">
                {t('student.grades.totalGrades')}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {selectedChildData.grades.filter(g => g.grade >= 80).length}
              </div>
              <div className="text-sm text-purple-800">
                {t('student.dashboard.excellent')} Grades
              </div>
            </div>
          </div>

          {/* Recent Grades }
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {t('student.dashboard.recentGrades')}
            </h3>
            {selectedChildData.grades.length > 0 ? (
              <div className="space-y-3">
                {selectedChildData.grades.slice(0, 10).map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        grade.grade >= 90 ? 'bg-green-500' :
                        grade.grade >= 80 ? 'bg-blue-500' :
                        grade.grade >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        <span className="text-white font-bold text-sm">
                          {grade.grade}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{grade.subject}</div>
                        <div className="text-sm text-gray-600">
                          {grade.type} • {new Date(grade.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      grade.grade >= 90 ? 'bg-green-100 text-green-800' :
                      grade.grade >= 80 ? 'bg-blue-100 text-blue-800' :
                      grade.grade >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {grade.grade >= 90 ? t('student.dashboard.excellent') :
                       grade.grade >= 80 ? t('student.dashboard.good') :
                       grade.grade >= 70 ? t('student.dashboard.satisfactory') :
                       t('student.dashboard.needsImprovement')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {t('ui.noData')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentGradebookContainer;

*/
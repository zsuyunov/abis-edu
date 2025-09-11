"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  BookOpen, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Eye,
  Edit,
  Calendar,
  BarChart3
} from "lucide-react";

interface ClassData {
  id: number;
  name: string;
  totalLessons: number;
  completedLessons: number;
  pendingLessons: number;
  totalTopics: number;
  completedTopics: number;
  averageProgress: number;
  teachers: {
    id: string;
    name: string;
    subjects: string[];
    progress: number;
  }[];
  recentActivity: {
    date: string;
    action: string;
    teacher: string;
    subject: string;
  }[];
}

interface SupervisorFeaturesProps {
  teacherId: string;
  supervisedClasses: number[];
}

const SupervisorFeatures = ({ teacherId, supervisedClasses }: SupervisorFeaturesProps) => {
  const [classesData, setClassesData] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);

  useEffect(() => {
    fetchClassesData();
  }, [supervisedClasses]);

  const fetchClassesData = async () => {
    try {
      const response = await fetch(`/api/teacher/supervisor/classes?teacherId=${teacherId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      setClassesData(data);
    } catch (error) {
      console.error("Failed to fetch classes data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOverallStats = () => {
    const totalLessons = classesData.reduce((sum, cls) => sum + cls.totalLessons, 0);
    const completedLessons = classesData.reduce((sum, cls) => sum + cls.completedLessons, 0);
    const totalTopics = classesData.reduce((sum, cls) => sum + cls.totalTopics, 0);
    const completedTopics = classesData.reduce((sum, cls) => sum + cls.completedTopics, 0);
    const averageProgress = classesData.length > 0 
      ? Math.round(classesData.reduce((sum, cls) => sum + cls.averageProgress, 0) / classesData.length)
      : 0;

    return {
      totalLessons,
      completedLessons,
      pendingLessons: totalLessons - completedLessons,
      totalTopics,
      completedTopics,
      averageProgress,
      completionRate: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    };
  };

  const getTeachersNeedingAttention = () => {
    return classesData.flatMap(cls => 
      cls.teachers.filter(teacher => teacher.progress < 50)
    );
  };

  const getClassesBehindSchedule = () => {
    return classesData.filter(cls => cls.averageProgress < 70);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = getOverallStats();
  const teachersNeedingAttention = getTeachersNeedingAttention();
  const classesBehindSchedule = getClassesBehindSchedule();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Supervisor Dashboard</h2>
          <p className="text-gray-600">Monitor and manage your supervised classes</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {supervisedClasses.length} Class{supervisedClasses.length > 1 ? 'es' : ''} Supervised
        </Badge>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Lessons</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLessons}</p>
                <p className="text-sm text-gray-500">{stats.completedLessons} completed</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Classwork Topics</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTopics}</p>
                <p className="text-sm text-gray-500">{stats.completedTopics} completed</p>
              </div>
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageProgress}%</p>
                <div className="mt-1">
                  <Progress value={stats.averageProgress} className="w-full" />
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                <p className="text-sm text-gray-500">{stats.pendingLessons} pending</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(teachersNeedingAttention.length > 0 || classesBehindSchedule.length > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-5 h-5" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {teachersNeedingAttention.length > 0 && (
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Teachers with low progress ({teachersNeedingAttention.length}):
                </p>
                <div className="mt-2 space-y-1">
                  {teachersNeedingAttention.slice(0, 3).map((teacher, index) => (
                    <div key={index} className="text-sm text-orange-700">
                      • {teacher.name} - {teacher.progress}% progress
                    </div>
                  ))}
                  {teachersNeedingAttention.length > 3 && (
                    <div className="text-sm text-orange-700">
                      • ... and {teachersNeedingAttention.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {classesBehindSchedule.length > 0 && (
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Classes behind schedule ({classesBehindSchedule.length}):
                </p>
                <div className="mt-2 space-y-1">
                  {classesBehindSchedule.slice(0, 3).map((cls, index) => (
                    <div key={index} className="text-sm text-orange-700">
                      • {cls.name} - {cls.averageProgress}% average progress
                    </div>
                  ))}
                  {classesBehindSchedule.length > 3 && (
                    <div className="text-sm text-orange-700">
                      • ... and {classesBehindSchedule.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Classes Overview */}
      <Tabs value={selectedClass?.toString() || "all"} onValueChange={(value) => setSelectedClass(value === "all" ? null : parseInt(value))}>
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <TabsTrigger value="all">All Classes</TabsTrigger>
          {classesData.map((cls) => (
            <TabsTrigger key={cls.id} value={cls.id.toString()}>
              {cls.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classesData.map((cls) => (
              <Card key={cls.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedClass(cls.id)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{cls.name}</h3>
                    <Badge variant={cls.averageProgress >= 80 ? "default" : cls.averageProgress >= 60 ? "secondary" : "destructive"}>
                      {cls.averageProgress}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Lessons</span>
                      <span>{cls.completedLessons}/{cls.totalLessons}</span>
                    </div>
                    <Progress value={(cls.completedLessons / cls.totalLessons) * 100} className="w-full" />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Topics</span>
                      <span>{cls.completedTopics}/{cls.totalTopics}</span>
                    </div>
                    <Progress value={(cls.completedTopics / cls.totalTopics) * 100} className="w-full" />
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500">
                      {cls.teachers.length} teacher{cls.teachers.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {classesData.map((cls) => (
          <TabsContent key={cls.id} value={cls.id.toString()} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {cls.name} - Class Details
                </CardTitle>
                <CardDescription>
                  Detailed view of class performance and teacher progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Class Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{cls.totalLessons}</p>
                    <p className="text-sm text-gray-600">Total Lessons</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{cls.completedLessons}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{cls.averageProgress}%</p>
                    <p className="text-sm text-gray-600">Avg Progress</p>
                  </div>
                </div>

                {/* Teachers */}
                <div>
                  <h4 className="font-medium mb-3">Teachers</h4>
                  <div className="space-y-3">
                    {cls.teachers.map((teacher, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                          <p className="text-sm text-gray-600">{teacher.subjects.join(", ")}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium">{teacher.progress}%</p>
                            <Progress value={teacher.progress} className="w-20" />
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="font-medium mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    {cls.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.action}</p>
                          <p className="text-xs text-gray-600">
                            {activity.teacher} • {activity.subject} • {activity.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default SupervisorFeatures;

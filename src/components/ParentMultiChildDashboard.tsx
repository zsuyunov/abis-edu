/*
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Calendar, 
  Clock, 
  BookOpen, 
  User, 
  MapPin,
  TrendingUp,
  Eye,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  BarChart3
} from "lucide-react";

interface ChildInfo {
  id: string;
  firstName: string;
  lastName: string;
  classId: number;
  className: string;
  branchId: number;
  branchName: string;
  avatar?: string;
}

interface TimetableSlot {
  id: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  buildingName?: string;
  status: string;
  subject: { name: string; id: number };
  teacher: { firstName: string; lastName: string; id: string };
  topics: TimetableSlotTopic[];
}

interface TimetableSlotTopic {
  id: number;
  topicTitle: string;
  topicDescription?: string;
  attachments: string[];
  status: string;
  progressPercentage: number;
  completedAt?: string;
  createdAt: string;
}

interface ParentMultiChildDashboardProps {
  children: ChildInfo[];
  academicYearId: number;
  isCurrent: boolean;
}

const ParentMultiChildDashboard = ({ children, academicYearId, isCurrent }: ParentMultiChildDashboardProps) => {
  const [allSlots, setAllSlots] = useState<{ [childId: string]: TimetableSlot[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  useEffect(() => {
    fetchAllChildrenSlots();
  }, [children, academicYearId]);

  const fetchAllChildrenSlots = async () => {
    try {
      const slotsData: { [childId: string]: TimetableSlot[] } = {};
      
      for (const child of children) {
        const response = await fetch(`/api/parent/timetable-slots?childId=${child.id}&academicYearId=${academicYearId}`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await response.json();
        slotsData[child.id] = data;
      }
      
      setAllSlots(slotsData);
      if (children.length > 0) {
        setSelectedChild(children[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch children slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTodaySlots = (childId: string) => {
    const today = new Date();
    return allSlots[childId]?.filter(slot => {
      const slotDate = new Date(slot.slotDate);
      return slotDate.toDateString() === today.toDateString();
    }) || [];
  };

  const getUpcomingSlots = (childId: string) => {
    const now = new Date();
    return allSlots[childId]?.filter(slot => {
      const slotDate = new Date(slot.slotDate);
      const slotTime = new Date(slot.startTime);
      const combinedDateTime = new Date(slotDate);
      combinedDateTime.setHours(slotTime.getHours(), slotTime.getMinutes(), 0, 0);
      
      return combinedDateTime > now;
    }).slice(0, 3) || [];
  };

  const getThisWeekSlots = (childId: string) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return allSlots[childId]?.filter(slot => {
      const slotDate = new Date(slot.slotDate);
      return slotDate >= weekStart && slotDate <= weekEnd;
    }) || [];
  };

  const getTotalTopics = (childId: string) => {
    return allSlots[childId]?.reduce((total, slot) => total + slot.topics.length, 0) || 0;
  };

  const getCompletedTopics = (childId: string) => {
    return allSlots[childId]?.reduce((total, slot) => 
      total + slot.topics.filter(topic => topic.status === "COMPLETED").length, 0) || 0;
  };

  const getProgressPercentage = (childId: string) => {
    const total = getTotalTopics(childId);
    const completed = getCompletedTopics(childId);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getCombinedTodaySlots = () => {
    const combined: Array<{ child: ChildInfo; slot: TimetableSlot }> = [];
    
    children.forEach(child => {
      const todaySlots = getTodaySlots(child.id);
      todaySlots.forEach(slot => {
        combined.push({ child, slot });
      });
    });
    
    return combined.sort((a, b) => 
      new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime()
    );
  };

  const getCombinedUpcomingSlots = () => {
    const combined: Array<{ child: ChildInfo; slot: TimetableSlot }> = [];
    
    children.forEach(child => {
      const upcomingSlots = getUpcomingSlots(child.id);
      upcomingSlots.forEach(slot => {
        combined.push({ child, slot });
      });
    });
    
    return combined.sort((a, b) => 
      new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime()
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const combinedTodaySlots = getCombinedTodaySlots();
  const combinedUpcomingSlots = getCombinedUpcomingSlots();

  return (
    <div className="space-y-6">
      {/* Header }
      <Card className="shadow-2xl border-0 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6" />
                Family Overview
              </h2>
              <p className="text-purple-100 mt-1">
                Combined view of all your children's timetables
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {children.length} child{children.length > 1 ? 'ren' : ''}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Combined Today's Overview }
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
            Today's Family Schedule
          </CardTitle>
          <CardDescription>
            All children's classes scheduled for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {combinedTodaySlots.length > 0 ? (
            <div className="space-y-4">
              {combinedTodaySlots.map(({ child, slot }) => (
                <div
                  key={`${child.id}-${slot.id}`}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={child.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                        {child.firstName[0]}{child.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {child.firstName} {child.lastName} • {child.className}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(slot.startTime).toLocaleTimeString()} - {new Date(slot.endTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm text-blue-700">{slot.subject.name}</p>
                    <p className="text-xs text-gray-600">{slot.roomNumber}</p>
                    {slot.topics.length > 0 && (
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300 mt-1">
                        {slot.topics.length} topic{slot.topics.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No classes scheduled for today</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Child Progress }
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Individual Progress
          </CardTitle>
          <CardDescription>
            Progress overview for each child
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => {
              const progress = getProgressPercentage(child.id);
              const totalTopics = getTotalTopics(child.id);
              const completedTopics = getCompletedTopics(child.id);
              const thisWeekSlots = getThisWeekSlots(child.id);
              
              return (
                <Card key={child.id} className="shadow-md border-0 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={child.avatar} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                          {child.firstName[0]}{child.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">{child.firstName} {child.lastName}</h3>
                        <p className="text-sm text-gray-600">{child.className}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-bold text-blue-600">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center p-2 bg-green-50 rounded">
                          <p className="font-semibold text-green-600">{completedTopics}</p>
                          <p className="text-gray-600">Completed</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <p className="font-semibold text-blue-600">{totalTopics}</p>
                          <p className="text-gray-600">Total</p>
                        </div>
                      </div>
                      
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">
                          {thisWeekSlots.length} class{thisWeekSlots.length !== 1 ? 'es' : ''} this week
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Classes }
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-orange-600" />
            Upcoming Classes
          </CardTitle>
          <CardDescription>
            Next classes for all children
          </CardDescription>
        </CardHeader>
        <CardContent>
          {combinedUpcomingSlots.length > 0 ? (
            <div className="space-y-3">
              {combinedUpcomingSlots.map(({ child, slot }) => (
                <div
                  key={`${child.id}-${slot.id}`}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={child.avatar} />
                      <AvatarFallback className="bg-orange-100 text-orange-600 font-semibold">
                        {child.firstName[0]}{child.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {child.firstName} {child.lastName} • {slot.subject.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(slot.slotDate).toLocaleDateString()} at {new Date(slot.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{slot.roomNumber}</p>
                    <p className="text-xs text-gray-500">{slot.teacher.firstName} {slot.teacher.lastName}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No upcoming classes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions }
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="w-5 h-5 text-purple-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <Button
                key={child.id}
                variant="outline"
                className="h-auto p-4 justify-start hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                onClick={() => setSelectedChild(child.id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={child.avatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-xs">
                      {child.firstName[0]}{child.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium text-sm">{child.firstName} {child.lastName}</p>
                    <p className="text-xs text-gray-600">View detailed timetable</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentMultiChildDashboard;

*/
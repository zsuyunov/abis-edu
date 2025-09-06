"use client";

import { useState } from "react";
import Image from "next/image";

interface StudentAttendanceMotivationProps {
  motivationalData: any;
  summary: any;
  student: any;
}

const StudentAttendanceMotivation = ({
  motivationalData,
  summary,
  student,
}: StudentAttendanceMotivationProps) => {
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  if (!motivationalData) return null;

  const { badges = [], alerts = [], achievements = [], streaks = { current: 0, longest: 0 } } = motivationalData;

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "Perfect Attendance":
        return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white";
      case "Excellent Attendance":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
      case "Good Attendance":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
      case "Always On Time":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case "Perfect Attendance":
        return "🏆";
      case "Excellent Attendance":
        return "🌟";
      case "Good Attendance":
        return "✨";
      case "Always On Time":
        return "⏰";
      default:
        return "🎖️";
    }
  };

  const getAttendanceMessage = () => {
    if (summary.attendanceRate >= 95) {
      return {
        message: "🎉 Outstanding! You're setting an excellent example!",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      };
    } else if (summary.attendanceRate >= 85) {
      return {
        message: "👍 Great job! Keep up the good work!",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
      };
    } else if (summary.attendanceRate >= 75) {
      return {
        message: "📚 You're doing okay, but there's room for improvement!",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200"
      };
    } else {
      return {
        message: "⚠️ Your attendance needs immediate attention!",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      };
    }
  };

  const motivationMessage = getAttendanceMessage();

  return (
    <div className="mb-6 space-y-4">
      {/* MAIN MOTIVATIONAL HEADER */}
      <div className={`${motivationMessage.bgColor} ${motivationMessage.borderColor} border rounded-lg p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
              <Image src="/student.png" alt="Student" width={32} height={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Welcome back, {student?.firstName}! 👋
              </h2>
              <p className={`text-lg font-medium ${motivationMessage.color}`}>
                {motivationMessage.message}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              {summary.attendanceRate || 0}%
            </div>
            <div className="text-sm text-gray-600">
              Attendance Rate
            </div>
          </div>
        </div>

        {/* ATTENDANCE STREAK */}
        {streaks.current > 0 && (
          <div className="mt-4 p-3 bg-white/50 rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <div>
                <div className="font-semibold text-gray-900">
                  {streaks.current} day attendance streak!
                </div>
                <div className="text-sm text-gray-600">
                  Your longest streak: {streaks.longest} days
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BADGES */}
      {badges.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span>🏆</span>
              Your Badges
            </h3>
            <div className="text-sm text-gray-600">
              {badges.length} earned
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {badges.map((badge, index) => (
              <div
                key={index}
                className={`${getBadgeColor(badge)} px-4 py-2 rounded-full text-sm font-medium shadow-md flex items-center gap-2`}
              >
                <span>{getBadgeIcon(badge)}</span>
                {badge}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ALERTS */}
      {alerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
            <span>⚠️</span>
            Attention Needed
          </h3>
          
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-md">
                <div className="text-orange-600 mt-0.5">
                  <span>⚠️</span>
                </div>
                <div className="text-sm text-orange-800">
                  {alert}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACHIEVEMENTS */}
      {achievements.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-green-900 flex items-center gap-2">
              <span>🎉</span>
              Recent Achievements
            </h3>
            {achievements.length > 2 && (
              <button
                onClick={() => setShowAllAchievements(!showAllAchievements)}
                className="text-sm text-green-600 hover:text-green-800"
              >
                {showAllAchievements ? "Show Less" : `Show All (${achievements.length})`}
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {(showAllAchievements ? achievements : achievements.slice(0, 2)).map((achievement, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-md">
                <div className="text-green-600 mt-0.5">
                  {achievement.includes("🏆") ? "🏆" :
                   achievement.includes("🌟") ? "🌟" :
                   achievement.includes("📈") ? "📈" : "✨"}
                </div>
                <div className="text-sm text-green-800">
                  {achievement}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MOTIVATIONAL GOALS */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
          <span>🎯</span>
          Your Goals & Progress
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Attendance Goal */}
          <div className="bg-white rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">
                Attendance Goal (85%)
              </div>
              <div className={`text-sm font-bold ${
                summary.attendanceRate >= 85 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {summary.attendanceRate || 0}%
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  summary.attendanceRate >= 85 ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min((summary.attendanceRate || 0), 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {summary.attendanceRate >= 85 
                ? "🎉 Goal achieved!" 
                : `${Math.max(0, 85 - (summary.attendanceRate || 0))}% to go!`}
            </div>
          </div>

          {/* Punctuality Goal */}
          <div className="bg-white rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">
                Punctuality Goal (95%)
              </div>
              <div className={`text-sm font-bold ${
                summary.lateRate <= 5 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {100 - (summary.lateRate || 0)}%
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  summary.lateRate <= 5 ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(100 - (summary.lateRate || 0), 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {summary.lateRate <= 5 
                ? "🎉 Great punctuality!" 
                : "⏰ Focus on arriving on time"}
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-4 p-3 bg-white/50 rounded-md">
          <div className="text-sm font-medium text-purple-900 mb-2">
            🚀 Next Steps to Excellence:
          </div>
          <div className="text-sm text-purple-800 space-y-1">
            {summary.attendanceRate < 85 && (
              <div>• Aim to attend at least 85% of your classes for academic success</div>
            )}
            {summary.attendanceRate >= 85 && summary.attendanceRate < 95 && (
              <div>• Reach for 95% attendance to earn the "Excellent Attendance" badge</div>
            )}
            {summary.attendanceRate >= 95 && summary.attendanceRate < 100 && (
              <div>• Strive for perfect attendance to earn the ultimate recognition</div>
            )}
            {summary.lateRate > 5 && (
              <div>• Work on punctuality - try to arrive 5-10 minutes before class starts</div>
            )}
            {summary.attendanceRate >= 95 && summary.lateRate <= 5 && (
              <div>• You're doing amazing! Keep up this excellent pattern</div>
            )}
          </div>
        </div>
      </div>

      {/* ENCOURAGEMENT MESSAGE */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 text-center">
        <div className="text-2xl mb-2">📚</div>
        <div className="font-medium text-blue-900 mb-2">
          Remember: Every Day Counts!
        </div>
        <div className="text-sm text-blue-800">
          Regular attendance is one of the strongest predictors of academic success. 
          You're building habits that will serve you well throughout your education and career!
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceMotivation;

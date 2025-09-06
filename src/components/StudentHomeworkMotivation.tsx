"use client";

interface StudentHomeworkMotivationProps {
  studentId: string;
  motivationalData: any;
  onDataUpdate: (data: any) => void;
  isMobile: boolean;
}

const StudentHomeworkMotivation = ({
  studentId,
  motivationalData,
  onDataUpdate,
  isMobile,
}: StudentHomeworkMotivationProps) => {
  if (!motivationalData) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">🎯</div>
        <div className="text-gray-600">Loading your achievements...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CURRENT STREAK */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🔥</div>
          <h3 className="text-2xl font-bold text-orange-900 mb-2">
            {motivationalData.currentStreak > 0 
              ? `${motivationalData.currentStreak}-Day Streak!` 
              : "Start Your Streak!"}
          </h3>
          <p className="text-orange-700">
            {motivationalData.currentStreak > 0 
              ? `You've completed homework on time for ${motivationalData.currentStreak} days in a row!`
              : "Complete your next homework on time to start a streak!"}
          </p>
        </div>
      </div>

      {/* BADGES */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🏆</span>
          Your Achievements
        </h3>
        
        {motivationalData.badges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {motivationalData.badges.map((badge: any) => (
              <div
                key={badge.id}
                className={`p-4 rounded-lg border-2 ${
                  badge.color === "gold" ? "border-yellow-400 bg-yellow-50" :
                  badge.color === "blue" ? "border-blue-400 bg-blue-50" :
                  badge.color === "purple" ? "border-purple-400 bg-purple-50" :
                  badge.color === "green" ? "border-green-400 bg-green-50" :
                  badge.color === "orange" ? "border-orange-400 bg-orange-50" :
                  "border-gray-400 bg-gray-50"
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <h4 className="font-semibold text-gray-900 mb-1">{badge.title}</h4>
                  <p className="text-sm text-gray-600">{badge.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎯</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Badges Yet</h4>
            <p className="text-gray-600">
              Complete homework consistently to earn your first achievement badge!
            </p>
          </div>
        )}
      </div>

      {/* ENCOURAGEMENT */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <span>💬</span>
          Motivational Messages
        </h3>
        <div className="space-y-3">
          {motivationalData.encouragement.map((message: string, index: number) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-md">
              <span className="text-blue-500 mt-1">✨</span>
              <p className="text-blue-800">{message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PROGRESS STATS */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📈</span>
          Your Progress
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{motivationalData.stats.completionRate}%</div>
            <div className="text-sm text-green-700">Completion Rate</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{motivationalData.stats.onTimeRate}%</div>
            <div className="text-sm text-blue-700">On-Time Rate</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{motivationalData.stats.totalHomework}</div>
            <div className="text-sm text-purple-700">Total Homework</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{motivationalData.currentStreak}</div>
            <div className="text-sm text-orange-700">Current Streak</div>
          </div>
        </div>
      </div>

      {/* NEXT GOALS */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
          <span>🎯</span>
          Next Goals
        </h3>
        <div className="space-y-3">
          {motivationalData.currentStreak < 5 && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-md">
              <span className="text-2xl">⭐</span>
              <div>
                <h4 className="font-medium text-purple-900">Consistency Star</h4>
                <p className="text-sm text-purple-700">
                  Complete {5 - motivationalData.currentStreak} more homework on time to earn this badge!
                </p>
              </div>
            </div>
          )}
          
          {motivationalData.currentStreak >= 5 && motivationalData.currentStreak < 10 && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-md">
              <span className="text-2xl">🦸</span>
              <div>
                <h4 className="font-medium text-purple-900">Homework Hero</h4>
                <p className="text-sm text-purple-700">
                  Complete {10 - motivationalData.currentStreak} more homework on time to become a Homework Hero!
                </p>
              </div>
            </div>
          )}
          
          {motivationalData.stats.completionRate < 90 && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-md">
              <span className="text-2xl">🎓</span>
              <div>
                <h4 className="font-medium text-purple-900">Homework Master</h4>
                <p className="text-sm text-purple-700">
                  Reach 90% completion rate to earn the Homework Master badge!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentHomeworkMotivation;

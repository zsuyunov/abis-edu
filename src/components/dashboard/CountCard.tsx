import Image from "next/image";

interface CountCardProps {
  type: string;
  count: number;
  date: string;
  trend?: 'up' | 'down' | 'stable';
  percentage?: number;
}

const CountCard = ({ type, count, date, trend = 'stable', percentage }: CountCardProps) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'admin':
        return 'bg-gradient-to-br from-purple-500 via-pink-500 to-red-500';
      case 'teacher':
        return 'bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-600';
      case 'student':
        return 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500';
      case 'parent':
        return 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600';
      default:
        return 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600';
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↗️';
    if (trend === 'down') return '↘️';
    return '➡️';
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className={`rounded-2xl p-6 flex-1 min-w-[130px] ${getBackgroundColor()} hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden`}>
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center">
          <span className="text-[10px] bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white font-medium border border-white/30">
            {date}
          </span>
          <div className="p-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
            <Image src="/more.png" alt="" width={16} height={16} className="cursor-pointer filter brightness-0 invert" />
          </div>
        </div>
        <h1 className="text-3xl font-bold my-6 text-white drop-shadow-lg">{count.toLocaleString()}</h1>
        <div className="flex items-center justify-between">
          <h2 className="capitalize text-sm font-semibold text-white/90 drop-shadow-md">
            {type === 'admin' ? 'Admins' : `${type}s`}
          </h2>
          {percentage && (
            <div className="flex items-center text-xs bg-white/20 backdrop-blur-md px-2 py-1 rounded-full border border-white/30">
              <span className="text-white">{getTrendIcon()}</span>
              <span className="ml-1 text-white font-medium">{percentage}%</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Animated background elements */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white/5 rounded-full blur-lg"></div>
    </div>
  );
};

export default CountCard;

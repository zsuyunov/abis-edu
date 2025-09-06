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
        return 'bg-purple-100';
      case 'teacher':
        return 'bg-yellow-100';
      case 'student':
        return 'bg-blue-100';
      case 'parent':
        return 'bg-green-100';
      default:
        return 'bg-gray-100';
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
    <div className={`rounded-2xl p-4 flex-1 min-w-[130px] ${getBackgroundColor()} hover:shadow-lg transition-shadow duration-200`}>
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          {date}
        </span>
        <Image src="/more.png" alt="" width={20} height={20} className="cursor-pointer" />
      </div>
      <h1 className="text-2xl font-semibold my-4">{count.toLocaleString()}</h1>
      <div className="flex items-center justify-between">
        <h2 className="capitalize text-sm font-medium text-gray-500">
          {type === 'admin' ? 'Admins' : `${type}s`}
        </h2>
        {percentage && (
          <div className={`flex items-center text-xs ${getTrendColor()}`}>
            <span>{getTrendIcon()}</span>
            <span className="ml-1">{percentage}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CountCard;

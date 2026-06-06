const ProgressBar = ({ percentage, showLabel = true, className = "" }) => {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  const getColor = () => {
    if (clampedPercentage === 100) return "bg-green-500";
    if (clampedPercentage >= 50) return "bg-primary-500";
    return "bg-yellow-500";
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-900">
            {clampedPercentage}%
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${clampedPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;

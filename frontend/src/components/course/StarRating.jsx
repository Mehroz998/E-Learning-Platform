import { Star } from "lucide-react";

const StarRating = ({ rating, onRate = null, size = "md" }) => {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const starSize = typeof size === "number" ? `${size}px` : undefined;
  const className = typeof size === "string" ? sizeClasses[size] : "";

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center space-x-1">
      {stars.map((star) => (
        <button
          key={star}
          onClick={() => onRate && onRate(star)}
          disabled={!onRate}
          className={`${
            onRate ? "cursor-pointer hover:scale-110" : "cursor-default"
          } transition-transform`}
        >
          <Star
            style={starSize ? { width: starSize, height: starSize } : {}}
            className={`${className} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;

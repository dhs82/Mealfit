// src/components/MealCountCard.jsx
import React from "react";

const MealCountCard = ({ meal, count, gradientColors }) => {
  return (
    <div
      className="rounded-xl w-32 h-20 flex flex-col items-center justify-center text-white shadow-md"
      style={{
        backgroundImage: `linear-gradient(to bottom, ${gradientColors[0]}, ${gradientColors[1]})`,
      }}
    >
      <span className="text-sm">{meal}</span>
      <span className="text-xl font-bold">{count}명</span>
    </div>
  );
};

export default MealCountCard;

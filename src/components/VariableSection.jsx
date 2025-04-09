// src/components/VariableSection.jsx
import React from "react";

const VariableSection = () => {
  return (
    <div className="p-4 rounded-2xl shadow-md bg-white flex flex-col gap-4">
      <h2 className="text-lg font-semibold mb-2">독립 변수 등록</h2>
      <div className="flex items-center gap-3">
        <img src="/assets/people.png" alt="총 인원" className="w-10 h-10" />
        <span className="text-gray-700">총 인원</span>
      </div>
      <div className="flex items-center gap-3">
        <img src="/assets/calendar.png" alt="학사 일정" className="w-10 h-10" />
        <span className="text-gray-700">학사 일정</span>
      </div>
      <div className="flex items-center gap-3">
        <img src="/assets/meal.png" alt="식단 메뉴" className="w-10 h-10" />
        <span className="text-gray-700">식단 메뉴</span>
      </div>
    </div>
  );
};

export default VariableSection;

// src/components/VariableSection.jsx
import React, { useState } from "react";
import MealPopup from "./MealPopup";
import SchedulePopup from "./SchedulePopup";

const VariableSection = () => {
  const [showMealPopup, setShowMealPopup] = useState(false);
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">독립 변수 등록</h2>
      <div className="space-y-4">
        <button
          onClick={() => setShowMealPopup(true)}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-xl shadow hover:bg-blue-600"
        >
          식단 메뉴 등록
        </button>
        <button
          onClick={() => setShowSchedulePopup(true)}
          className="w-full px-4 py-2 bg-indigo-500 text-white rounded-xl shadow hover:bg-indigo-600"
        >
          학사 일정 등록
        </button>
      </div>

      {showMealPopup && <MealPopup onClose={() => setShowMealPopup(false)} />}
      {showSchedulePopup && <SchedulePopup onClose={() => setShowSchedulePopup(false)} />}
    </div>
  );
};

export default VariableSection;

// src/pages/Dashboard.jsx
import React, { useState } from "react";
import Calendar from "../components/Calendar";
import EnvBox from "../components/EnvBox";
import VariableSection from "../components/VariableSection";
import MealMenuCard from "../components/MealMenuCard";
import MealCountCard from "../components/MealCountCard";

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 예시 데이터 - 실제 API 데이터나 계산 로직에 따라 업데이트 가능
  const mealCounts = [
    { meal: "아침", count: 420, gradient: ["#95dbe5", "#60a5fa"] },
    { meal: "점심", count: 560, gradient: ["#e38a8a", "#f87171"] },
    { meal: "저녁", count: 534, gradient: ["#6e6bcd", "#818cf8"] },
  ];

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-4xl font-bold text-gray-800 text-center">
        오늘의 식수 인원 예측
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 달력 */}
        <div className="col-span-1">
          <Calendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>
        {/* 환경 변수 정보 */}
        <div className="col-span-1">
          <EnvBox />
        </div>
        {/* 독립 변수 등록 */}
        <div className="col-span-1">
          <VariableSection />
        </div>
        {/* 급식 변수 정보 */}
        <div className="col-span-1">
          <MealMenuCard />
        </div>
      </div>

      {/* 오늘의 식수 인원 예측 카드 */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">오늘의 식수 인원</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {mealCounts.map((item, idx) => (
            <MealCountCard
              key={idx}
              meal={item.meal}
              count={item.count}
              gradientColors={item.gradient}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// src/components/MealMenuCard.jsx
import React from "react";

const MealMenuCard = () => {
  return (
    <div className="p-4 rounded-2xl shadow-md bg-white">
      <h2 className="text-lg font-semibold mb-4">급식 변수 정보</h2>
      <div className="flex justify-between mb-2">
        <span className="font-medium">이번 학기 총 인원</span>
        <span className="font-bold text-xl">750명</span>
      </div>
      <div className="flex justify-between mb-4">
        <span className="font-medium">오늘의 학사 일정</span>
        <span className="font-bold text-red-500">축제일</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <h3 className="font-semibold mb-1">아침 메뉴</h3>
          <ul className="space-y-1 text-gray-700">
            <li>밥</li>
            <li>국</li>
            <li>반찬1</li>
            <li>반찬2</li>
            <li>반찬3</li>
            <li>후식</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-1">점심 메뉴</h3>
          <ul className="space-y-1 text-gray-700">
            <li>밥</li>
            <li>국</li>
            <li>반찬1</li>
            <li>반찬2</li>
            <li>반찬3</li>
            <li>후식</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-1">저녁 메뉴</h3>
          <ul className="space-y-1 text-gray-700">
            <li>밥</li>
            <li>국</li>
            <li>반찬1</li>
            <li>반찬2</li>
            <li>반찬3</li>
            <li>후식</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MealMenuCard;

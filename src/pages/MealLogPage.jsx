// src/pages/MealLogPage.jsx
import React from "react";

const MealLogPage = () => {
  return (
    <div className="p-8 space-y-10">
      <h1 className="text-3xl font-bold text-gray-800">
      급식 일지 작성하기
      </h1>

      {/* 상단 정보 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow-lg rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-2">날짜</h2>
          <p>2021년 3월 13일 (토)</p>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-2">날씨 정보</h2>
          <ul>
            <li>기온: 24°C</li>
            <li>날씨: 흐림</li>
            <li>특이사항: 평일입니다</li>
          </ul>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-2">급식 정보</h2>
          <p>총원: 750명</p>
          <p>학사일정: 축제일</p>
        </div>
      </section>

      {/* 예측된 식수 인원 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["아침", "점심", "저녁"].map((meal, idx) => (
          <div
            key={idx}
            className={`rounded-xl p-6 shadow-md text-white ${
              meal === "아침"
                ? "bg-cyan-500"
                : meal === "점심"
                ? "bg-rose-400"
                : "bg-indigo-500"
            }`}
          >
            <h3 className="text-lg font-semibold">{meal}</h3>
            <p className="text-2xl font-bold mt-2">
              {meal === "아침" ? "420" : meal === "점심" ? "560" : "534"}명
            </p>
          </div>
        ))}
      </section>

      {/* 실 식수 입력 */}
      <section className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">실제 식수 인원 입력</h2>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["아침", "점심", "저녁"].map((meal, idx) => (
            <div key={idx} className="flex flex-col">
              <label className="mb-1 font-medium">{meal}</label>
              <input
                type="number"
                placeholder="실인원"
                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          ))}
        </form>
        <button className="mt-6 bg-black text-white py-2 px-6 rounded-lg hover:bg-gray-800">
          등록
        </button>
      </section>
    </div>
  );
};

export default MealLogPage;

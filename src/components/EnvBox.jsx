// src/components/EnvBox.jsx
import React from "react";

const EnvBox = () => {
  return (
    <div className="p-4 rounded-2xl shadow-md bg-white">
      <h2 className="text-lg font-semibold mb-4">환경 변수 API</h2>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <img src="/assets/temp.png" alt="기온" className="w-8 h-8" />
          <span className="text-gray-700">기온 24℃</span>
        </div>
        <div className="flex items-center gap-3">
          <img src="/assets/weather.png" alt="날씨" className="w-8 h-8" />
          <span className="text-gray-700">날씨 흐림</span>
        </div>
        <div className="flex items-center gap-3">
          <img src="/assets/holiday.png" alt="학사 일정" className="w-8 h-8" />
          <span className="text-gray-700">평일입니다</span>
        </div>
      </div>
    </div>
  );
};

export default EnvBox;

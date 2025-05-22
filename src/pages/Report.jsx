// src/pages/Report.jsx
import React from "react";
import Calendar from "../components/Calendar";
import { Chart } from "react-google-charts";

const dummyData = {
  expected: [
    ["날짜", "아침", "점심", "저녁"],
    ["2021년 10월 11일", 120, 320, 430],
    ["2021년 10월 12일", 220, 570, 475],
    ["2021년 10월 13일", 280, 525, 365],
    ["2021년 10월 14일", 180, 565, 572],
    ["2021년 10월 15일", 150, 504, 378],
  ],
  actual: [
    ["날짜", "아침", "점심", "저녁"],
    ["2021년 10월 11일", 120, 320, 430],
    ["2021년 10월 12일", 220, 570, 475],
    ["2021년 10월 13일", 280, 525, 365],
    ["2021년 10월 14일", 180, 565, 572],
    ["2021년 10월 15일", 150, 504, 378],
  ],
};

const Report = () => {
  return (
    <div className="p-8 space-y-10">
      <h1 className="text-3xl font-bold text-gray-800">주간 리포트</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1">
          <Calendar selectedDate={new Date()} onDateChange={() => {}} />
        </div>

        <div className="col-span-3 space-y-4">
          {/* 예상 표 */}
          <div>
            <h2 className="text-lg font-semibold">식수 인원 예상치</h2>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">날짜</th>
                  <th className="p-2 border">아침</th>
                  <th className="p-2 border">점심</th>
                  <th className="p-2 border">저녁</th>
                </tr>
              </thead>
              <tbody>
                {dummyData.expected.slice(1).map((row, idx) => (
                  <tr key={idx} className="text-center">
                    {row.map((cell, i) => (
                      <td key={i} className="border p-1">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 실제 표 */}
          <div>
            <h2 className="text-lg font-semibold">식수 인원 실제값</h2>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">날짜</th>
                  <th className="p-2 border">아침</th>
                  <th className="p-2 border">점심</th>
                  <th className="p-2 border">저녁</th>
                </tr>
              </thead>
              <tbody>
                {dummyData.actual.slice(1).map((row, idx) => (
                  <tr key={idx} className="text-center">
                    {row.map((cell, i) => (
                      <td key={i} className="border p-1">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 오차 및 정확도 */}
      <div className="flex justify-end gap-4">
        <div className="p-4 bg-gray-100 rounded shadow w-32 text-center">
          <div className="text-sm text-gray-500">오차값</div>
          <div className="text-lg font-bold">±10</div>
        </div>
        <div className="p-4 bg-gray-100 rounded shadow w-32 text-center">
          <div className="text-sm text-gray-500">정확도</div>
          <div className="text-lg font-bold">95%</div>
        </div>
      </div>

      {/* 주간 그래프 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">주간 그래프 보기</h2>
        <Chart
          chartType="LineChart"
          width="100%"
          height="400px"
          data={dummyData.expected}
          options={{
            title: "2021년 10월 3주차",
            curveType: "function",
            legend: { position: "bottom" },
          }}
        />
      </div>
    </div>
  );
};

export default Report;

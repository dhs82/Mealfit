// src/features/dashboard/components/VariableSection.jsx
import React, { useMemo } from "react";

/** 학기 시작일 보정 (주말이면 다음 평일로 이동) */
function adjustSemesterStart(year, month, day) {
  const d = new Date(year, month - 1, day);
  let dow = d.getDay(); // 0=일,6=토
  if (dow === 0) {
    // 일요일이면 다음날
    d.setDate(d.getDate() + 1);
  } else if (dow === 6) {
    // 토요일이면 월요일로 이동
    d.setDate(d.getDate() + 2);
  }
  return d;
}

const VariableSection = () => {
  const today = new Date();

  const { dayOfYear, weekOfYear, semesterInfo } = useMemo(() => {
    const year = today.getFullYear();

    // 1) 올해 몇 번째 날?
    const startOfYear = new Date(year, 0, 1);
    const diffDays = Math.floor(
      (today - startOfYear) / (1000 * 60 * 60 * 24)
    ) + 1;
    const dayOfYear = diffDays;

    // 2) 몇 번째 주?
    const weekOfYear = Math.ceil(dayOfYear / 7);

    // 3) 학기 주차 계산
    const month = today.getMonth() + 1;
    let semester = null;
    let weekOfSemester = null;

    // 방학 기간 (7,8월 & 1,2월)
    if ([1, 2, 7, 8].includes(month)) {
      semester = "방학중";
    } else {
      const springStart = adjustSemesterStart(year, 3, 2);
      const fallStart = adjustSemesterStart(year, 9, 1);

      if (today >= springStart && today < fallStart) {
        semester = "1학기";
        const diff =
          Math.floor((today - springStart) / (1000 * 60 * 60 * 24)) + 1;
        weekOfSemester = Math.ceil(diff / 7);
      } else {
        semester = "2학기";
        const diff =
          Math.floor((today - fallStart) / (1000 * 60 * 60 * 24)) + 1;
        weekOfSemester = Math.ceil(diff / 7);
      }
    }

    return { dayOfYear, weekOfYear, semesterInfo: { semester, weekOfSemester } };
  }, [today]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">오늘의 날짜</h2>
      <ul className="space-y-2 text-gray-700">
        <li>📅 오늘은 1년 중 <strong>{dayOfYear}</strong>번째 날</li>
        <li>🗓️ 오늘은 1년 중 <strong>{weekOfYear}</strong>번째 주</li>
        {semesterInfo.semester === "방학중" ? (
          <li>🏖️ 현재는 <strong>방학중</strong>입니다</li>
        ) : (
          <>
            <li>🎓 현재 학기: <strong>{semesterInfo.semester}</strong></li>
            <li>📚 학기 시작 후 <strong>{semesterInfo.weekOfSemester}</strong>주차</li>
          </>
        )}
      </ul>
    </div>
  );
};

export default VariableSection;

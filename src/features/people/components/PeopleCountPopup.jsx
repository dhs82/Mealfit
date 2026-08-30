// src/features/people/components/PeopleCountPopup.jsx
import React, { useState } from "react";

// 달 → 학기 매핑 (일반적인 국내 학사 일정 가정)
// 3~6: FIRST, 7~8: SUMMER, 9~12: SECOND, 1~2: WINTER
function getCurrentYearAndTerm(dateLike = new Date()) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 6) return { year: y, term: "FIRST" };
  if (m >= 7 && m <= 8) return { year: y, term: "SUMMER" };
  if (m >= 9 && m <= 12) return { year: y, term: "SECOND" };
  return { year: y, term: "WINTER" };
}

/**
 * PeopleCountPopup
 * @param {object} props
 * @param {object} [props.initial] - { id?, year, term, count }
 * @param {(payload:{id?,year,term,count})=>void} props.onSave
 * @param {()=>void} props.onClose
 */
export default function PeopleCountPopup({ initial, onSave, onClose }) {
  const [year, setYear] = useState(initial?.year ?? getCurrentYearAndTerm().year);
  const [term, setTerm] = useState(initial?.term ?? getCurrentYearAndTerm().term);
  const [count, setCount] = useState(
    initial?.count != null ? String(initial.count) : ""
  );

  const handleSubmit = () => {
    const parsedYear = parseInt(year, 10);
    const parsedCount = parseInt(count, 10);
    if (!parsedYear || !term) return alert("연도와 학기를 올바르게 입력하세요.");
    if (!Number.isFinite(parsedCount) || parsedCount < 0)
      return alert("학생 수를 0 이상의 정수로 입력하세요.");
    onSave({ id: initial?.id, year: parsedYear, term, count: parsedCount });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">학생 수 추가/수정</h2>
          <button
            className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">연도</span>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              inputMode="numeric"
              placeholder="예: 2025"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">학기</span>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-white"
            >
              <option value="FIRST">1학기</option>
              <option value="SUMMER">여름학기</option>
              <option value="SECOND">2학기</option>
              <option value="WINTER">겨울학기</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">학생 수</span>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              inputMode="numeric"
              placeholder="예: 100"
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            className="rounded-lg border px-4 py-2 hover:bg-gray-50"
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            onClick={handleSubmit}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

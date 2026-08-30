import React from 'react';

const SchedulePopup = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-[400px]">
        <h2 className="text-xl font-bold mb-4">학사 일정 입력</h2>
        <div className="flex flex-col gap-3">
          {['축제', '단과대 축제', '단과대 MT', '시험 기간', '중간 기간'].map((label, idx) => (
            <label key={idx} className="flex items-center gap-2">
              <input type="checkbox" className="w-5 h-5" />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <button className="bg-black text-white w-full py-2 mt-4 rounded-lg flex items-center justify-center">
          <span className="material-icons mr-2">등록</span>
        </button>
        <button onClick={onClose} className="mt-4 text-sm underline text-gray-600">
          닫기
        </button>
      </div>
    </div>
  );
};

export default SchedulePopup;

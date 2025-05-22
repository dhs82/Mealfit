import React from 'react';

const MealPopup = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-[900px]">
        <h2 className="text-xl font-bold mb-4">식단 메뉴 등록</h2>
        <div className="grid grid-cols-3 gap-6">
          {['아침', '점심', '저녁'].map((meal, idx) => (
            <div key={idx} className="p-4 border rounded-xl shadow">
              <p className="font-semibold mb-2">{meal}</p>
              {['밥', '국', '반찬1', '반찬2', '반찬3', '후식'].map((item, i) => (
                <div className="mb-2" key={i}>
                  <label className="block text-sm font-semibold">{item}</label>
                  <input
                    className="w-full border rounded px-2 py-1 mt-1 text-sm"
                    placeholder="메뉴명"
                  />
                </div>
              ))}
              <button className="bg-black text-white w-full py-2 mt-3 rounded-lg flex items-center justify-center">
                <span className="material-icons mr-2">등록</span>
              </button>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-6 text-sm underline text-gray-600">
          닫기
        </button>
      </div>
    </div>
  );
};

export default MealPopup;

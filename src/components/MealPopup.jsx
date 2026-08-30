// src/components/MealPopup.jsx
import React, { useState, useEffect } from 'react';

/**
 * 신규 스키마 입력 팝업
 * - 메뉴: textarea (줄바꿈/쉼표로 다중 입력) → items: string[]
 * - 칼로리(Int), 프로틴(Float)
 */
const MealPopup = ({ date: initialDate, meals: existingMeals, onClose, onSave }) => {
  const mealOrder = ['아침', '점심', '저녁'];

  // 배열 <-> 텍스트 변환
  const itemsToText = (arr) => (Array.isArray(arr) ? arr.join('\n') : '');
  const textToItems = (text) =>
    text
      .split(/\n|,/g)
      .map((s) => s.trim())
      .filter(Boolean);

  // 날짜
  const [date, setDate] = useState(initialDate);
  useEffect(() => setDate(initialDate), [initialDate]);

  // 폼 초기값
  const emptySlot = { itemsText: '', calories: '0', protein: '0' };
  const defaultMeals = { 아침: { ...emptySlot }, 점심: { ...emptySlot }, 저녁: { ...emptySlot } };

  // 기존 데이터 → 폼 상태로 매핑
  const toFormState = (src) => {
    if (!src || Object.keys(src).length === 0) return defaultMeals;
    const slot = (s) => {
      if (!s) return { ...emptySlot };
      return {
        itemsText: itemsToText(s.items),
        calories: String(s.calories ?? 0),
        protein: String(s.protein ?? 0),
      };
    };
    return {
      아침: slot(src.아침 || src.breakfast),
      점심: slot(src.점심 || src.lunch),
      저녁: slot(src.저녁 || src.dinner),
    };
  };

  const [form, setForm] = useState(() => toFormState(existingMeals));
  useEffect(() => setForm(toFormState(existingMeals)), [existingMeals]);

  const handleChange = (mealType, field, value) => {
    setForm((prev) => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        [field]:
          field === 'calories' || field === 'protein'
            ? value.replace(/[^\d.]/g, '') // 숫자/소수점만
            : value,
      },
    }));
  };

  const handleSave = () => {
    const toSlot = (m) => ({
      items: textToItems(m.itemsText),
      calories: Number(m.calories || 0),
      protein: Number(m.protein || 0),
    });
    const payload = {
      breakfast: toSlot(form.아침),
      lunch: toSlot(form.점심),
      dinner: toSlot(form.저녁),
    };
    onSave({ date, meals: payload });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-[900px] max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold mb-4">식단 메뉴 등록</h2>

        {/* 날짜 */}
        <div className="mb-4">
          <label className="font-semibold mr-2">날짜:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>

        {/* 끼니별 입력 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mealOrder.map((mealType) => {
            const slot = form[mealType];
            return (
              <div key={mealType} className="p-4 border rounded-xl shadow">
                <p className="font-semibold mb-3">{mealType}</p>

                <label className="block text-sm font-semibold">메뉴(줄바꿈/쉼표 구분)</label>
                <textarea
                  value={slot.itemsText}
                  onChange={(e) => handleChange(mealType, 'itemsText', e.target.value)}
                  placeholder="예) 콩밥, 미역국, 김치"
                  className="w-full border rounded px-2 py-1 mt-1 text-sm h-28"
                />

                <div className="mt-3">
                  <label className="block text-sm font-semibold">칼로리(kcal)</label>
                  <input
                    inputMode="numeric"
                    value={slot.calories}
                    onChange={(e) => handleChange(mealType, 'calories', e.target.value)}
                    className="w-full border rounded px-2 py-1 mt-1 text-sm"
                    placeholder="0"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-semibold">프로틴(g)</label>
                  <input
                    inputMode="numeric"
                    value={slot.protein}
                    onChange={(e) => handleChange(mealType, 'protein', e.target.value)}
                    className="w-full border rounded px-2 py-1 mt-1 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={handleSave} className="bg-black text-white w-full py-2 mt-5 rounded-lg">
          등록
        </button>
        <button onClick={onClose} className="mt-3 text-sm underline text-gray-600 w-full">
          닫기
        </button>
      </div>
    </div>
  );
};

export default MealPopup;

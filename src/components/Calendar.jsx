// src/components/Calendar.jsx
import React from 'react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css';

export default function Calendar({
  onDateClick,
  onDateChange,
  selectedDate,
  size = 'normal',
  interactive = true,
}) {
  const handleDayClick = (dateObj) => {
    if (!interactive) return;
    const year  = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day   = String(dateObj.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;
    onDateClick?.(localDateString);
    onDateChange?.(dateObj);
  };

  return (
    // ✅ large일 때만 calendar-lg 래퍼 클래스 부여(실제 사이즈는 CSS에서 키움)
    <div className={`mx-auto ${size === 'large' ? 'calendar-lg mb-4' : ''}`}>
      <ReactCalendar
        onClickDay={interactive ? handleDayClick : undefined}
        value={selectedDate ? new Date(selectedDate) : new Date()}
        // ‘8일’ 같은 줄바꿈 방지 + 숫자만 표시
        formatDay={(locale, date) => String(date.getDate())}
      />
    </div>
  );
}

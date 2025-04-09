// src/components/Calendar.jsx
import React from "react";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Calendar.css"; // 추가 커스터마이징 (옵션)

const Calendar = ({ selectedDate, onDateChange }) => {
  return (
    <div className="rounded-md shadow-sm border p-4 bg-white">
      <ReactCalendar
        onChange={onDateChange}
        value={selectedDate}
        className="w-full" // 필요시 Tailwind 클래스 추가
      />
    </div>
  );
};

export default Calendar;

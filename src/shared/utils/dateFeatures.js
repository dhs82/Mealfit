// src/shared/utils/dateFeatures.js

/** 학기 시작일 보정 (주말이면 다음 평일로 이동) */
export function adjustSemesterStart(year, month, day) {
  const d = new Date(year, month - 1, day);
  const dow = d.getDay(); // 0=일, 6=토
  if (dow === 0) d.setDate(d.getDate() + 1);       // 일 → 월
  else if (dow === 6) d.setDate(d.getDate() + 2);  // 토 → 월
  return d;
}

/** ISO 날짜 → { year, term } (3~6: FIRST, 7~8: SUMMER, 9~12: SECOND, 1~2: WINTER) */
export function getYearAndTermFromISO(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 6) return { year: y, term: "FIRST" };
  if (m >= 7 && m <= 8) return { year: y, term: "SUMMER" };
  if (m >= 9 && m <= 12) return { year: y, term: "SECOND" };
  return { year: y, term: "WINTER" };
}

/** 주차 계산: 방학(1~2, 7~8월)은 null */
export function getWeekOfSemester(iso) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if ([1, 2, 7, 8].includes(month)) return null; // 방학

  const springStart = adjustSemesterStart(year, 3, 2);
  const fallStart = adjustSemesterStart(year, 9, 1);

  const start = date >= springStart && date < fallStart ? springStart : fallStart;
  const diffDays = Math.floor((date - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.ceil(diffDays / 7);
}

/**
 * numeric_features 빌드
 * 순서: [공휴일, 시험, 금, 목, 수, 월, 일, 토, 화, 공휴일_확장, 아침, 저녁, 점심]
 * - 공휴일/공휴일_확장: 0 고정
 * - 시험: 7~8, 15~16 주차 = 1 (방학=null은 0)
 * - 요일/끼니: 원-핫
 */
export function buildNumericFeatures(isoDate, mealKey) {
  const arr = new Array(13).fill(0);

  // 요일 원-핫
  const d = new Date(isoDate);
  const dow = d.getDay(); // 0=일,1=월,2=화,3=수,4=목,5=금,6=토
  const dowIndexMap = { 5: 2, 4: 3, 3: 4, 1: 5, 0: 6, 6: 7, 2: 8 };
  const idx = dowIndexMap[dow];
  if (typeof idx === "number") arr[idx] = 1;

  // 끼니 원-핫
  if (mealKey === "breakfast") arr[10] = 1;
  if (mealKey === "dinner")   arr[11] = 1;
  if (mealKey === "lunch")    arr[12] = 1;

  // 시험 여부 (방학=null → 0)
  const week = getWeekOfSemester(isoDate);
  arr[1] = week && ((week >= 7 && week <= 8) || (week >= 15 && week <= 16)) ? 1 : 0;

  return arr;
}

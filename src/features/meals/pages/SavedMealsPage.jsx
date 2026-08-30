// src/features/meals/pages/SavedMealsPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { generateClient } from "@aws-amplify/api";
import { getWeekOfSemester, getYearAndTermFromISO } from "shared/utils/dateFeatures";
import { predictMeal } from "features/prediction/api/predictMeal";

// ── GraphQL ───────────────────────────────────────────────────────────────────
const LIST_PEOPLE_COUNTS = /* GraphQL */ `
  query ListPeopleCounts($filter: ModelPeopleCountFilterInput) {
    listPeopleCounts(filter: $filter) {
      items {
        id
        year
        term
        count
      }
    }
  }
`;

const LIST_MEALS_FULL = /* GraphQL */ `
  query ListMeals(
    $filter: ModelMealFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMeals(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        breakfast { items calories protein }
        lunch { items calories protein }
        dinner { items calories protein }
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const DOW_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const toKoreanDow = (iso) => DOW_LABELS[new Date(iso).getDay()];

const itemsToLine = (slot) =>
  slot && Array.isArray(slot.items) && slot.items.length > 0
    ? slot.items.join(", ")
    : "";

const getSlotByKoreanType = (obj, type) => {
  if (!obj) return null;
  if (type === "아침") return obj.breakfast;
  if (type === "점심") return obj.lunch;
  if (type === "저녁") return obj.dinner;
  return null;
};

// 선택값 → numeric_features (13길이) 변환
// [공휴일, 시험, 금, 목, 수, 월, 일, 토, 화, 공휴일_확장, 아침, 저녁, 점심]
const buildFeaturesFromSelections = ({ holiday, exam, dowLabel, mealType }) => {
  const arr = new Array(13).fill(0);
  arr[0] = holiday ? 1 : 0;
  arr[1] = exam ? 1 : 0;

  const mapLabelToIndex = { "금": 2, "목": 3, "수": 4, "월": 5, "일": 6, "토": 7, "화": 8 };
  const idx = mapLabelToIndex[dowLabel];
  if (typeof idx === "number") arr[idx] = 1;

  if (mealType === "아침") arr[10] = 1;
  if (mealType === "저녁") arr[11] = 1;
  if (mealType === "점심") arr[12] = 1;
  return arr;
};

// 날짜 기준 PeopleCount 불러오기 (client 주입)
const fetchPeopleCount = async (client, isoDate) => {
  if (!isoDate) return null;
  const { year, term } = getYearAndTermFromISO(isoDate);
  try {
    const res = await client.graphql({
      query: LIST_PEOPLE_COUNTS,
      variables: { filter: { year: { eq: year }, term: { eq: term } } },
      authMode: "apiKey",
    });
    const item = res.data?.listPeopleCounts?.items?.[0];
    return item?.count ?? null;
  } catch (e) {
    console.error("PeopleCount fetch failed", e);
    return null;
  }
};

// 주어진 year, month(1–12)의 시작/다음달 시작 ISO(YYYY-MM-DD)
const monthRange = (year, month) => {
  const mm = String(month).padStart(2, "0");
  const start = `${year}-${mm}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const mmNext = String(nextMonth).padStart(2, "0");
  const nextStart = `${nextYear}-${mmNext}-01`;
  return { start, nextStart };
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function SavedMealsPage() {
  // Amplify client은 렌더마다 새로 만들지 않도록 고정
  const client = useMemo(() => generateClient(), []);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // ✅ 연/월 선택 상태
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // 목록/선택
  const [menus, setMenus] = useState([]);
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState("");

  // 텍스트 편집
  const [breakfast, setBreakfast] = useState("");
  const [lunch, setLunch] = useState("");
  const [dinner, setDinner] = useState("");
  const [energy, setEnergy] = useState("");
  const [protein, setProtein] = useState("");
  const [mealType, setMealType] = useState("아침");
  const [totalPeople, setTotalPeople] = useState("");
  const [prediction, setPrediction] = useState(null);

  // IME 끊김 방지용
  const [menuText, setMenuText] = useState("");

  // 슬롯 보관
  const [slots, setSlots] = useState({ breakfast: null, lunch: null, dinner: null });

  // 예측 설정(요일/공휴일/시험)
  const [selDow, setSelDow] = useState("월");
  const [selHoliday, setSelHoliday] = useState(false);
  const [selExam, setSelExam] = useState(false);

  // 연/월 단위 목록 불러오기 (+날짜 오름차순 정렬)
  const fetchMenusByMonth = async (year, month) => {
    try {
      const { start, nextStart } = monthRange(year, month);
      let nextToken = null;
      const all = [];

      do {
        const res = await client.graphql({
          query: LIST_MEALS_FULL,
          variables: {
            filter: { date: { ge: start, lt: nextStart } }, // 해당 연/월만
            limit: 200,
            nextToken,
          },
          authMode: "apiKey",
        });
        const data = res.data?.listMeals;
        all.push(...(data?.items ?? []));
        nextToken = data?.nextToken ?? null;
      } while (nextToken);

      // 날짜 오름차순 정렬
      all.sort((a, b) => (a?.date || "").localeCompare(b?.date || ""));
      setMenus(all);

      // 연/월 변경 시 기존 선택 초기화
      setSelected(null);
      setDate("");
      setBreakfast("");
      setLunch("");
      setDinner("");
      setEnergy("");
      setProtein("");
      setMenuText("");
      setTotalPeople("");
      setPrediction(null);
    } catch (e) {
      console.error(e);
      alert("메뉴 목록을 불러오는 중 오류가 발생했습니다.");
    }
  };

  // mount 또는 연/월 선택 변경 시 재조회
  useEffect(() => {
    fetchMenusByMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // 날짜 바뀌면 요일/시험 기본값 자동
  useEffect(() => {
    if (!date) return;
    const dLabel = toKoreanDow(date);
    setSelDow(dLabel === undefined ? "월" : dLabel);
    const wk = getWeekOfSemester(date);
    const isExamWeek = !!(wk && ((wk >= 7 && wk <= 8) || (wk >= 15 && wk <= 16)));
    setSelExam(isExamWeek);
    setSelHoliday(false);
  }, [date]);

  // 항목 선택 시 메뉴/숫자/인원 동시 반영
  const handleSelect = async (item) => {
    setSelected(item);
    setDate(item.date);

    const nextSlots = {
      breakfast: item.breakfast,
      lunch: item.lunch,
      dinner: item.dinner,
    };
    setSlots(nextSlots);

    const nextBreakfast = itemsToLine(item.breakfast);
    const nextLunch = itemsToLine(item.lunch);
    const nextDinner = itemsToLine(item.dinner);

    setBreakfast(nextBreakfast);
    setLunch(nextLunch);
    setDinner(nextDinner);

    const curSlot = getSlotByKoreanType(nextSlots, mealType);
    setMenuText(mealType === "아침" ? nextBreakfast : mealType === "점심" ? nextLunch : nextDinner);
    setEnergy(curSlot?.calories != null ? String(curSlot.calories) : "");
    setProtein(curSlot?.protein != null ? String(curSlot.protein) : "");
    setPrediction(null);

    // 인원 동시 조회 & 반영
    const count = await fetchPeopleCount(client, item.date);
    if (count != null) setTotalPeople(String(count));
    else setTotalPeople("");
  };

  // mealType/원본 값 변화에 따라 표시 텍스트/숫자 동기화
  useEffect(() => {
    const map = { 아침: breakfast, 점심: lunch, 저녁: dinner };
    setMenuText(map[mealType] || "");
    const curSlot = getSlotByKoreanType(slots, mealType);
    setEnergy(curSlot?.calories != null ? String(curSlot.calories) : "");
    setProtein(curSlot?.protein != null ? String(curSlot.protein) : "");
  }, [mealType, breakfast, lunch, dinner, selected?.id, slots]);

  // 계산(예측)
  const handleCalculate = async () => {
    const v = menuText;
    if (mealType === "아침" && v !== breakfast) setBreakfast(v);
    if (mealType === "점심" && v !== lunch) setLunch(v);
    if (mealType === "저녁" && v !== dinner) setDinner(v);

    const people = parseInt(totalPeople, 10);
    if (isNaN(people) || people < 1) {
      return alert("총인원을 올바른 숫자로 입력하세요.");
    }

    const features = buildFeaturesFromSelections({
      holiday: selHoliday,
      exam: selExam,
      dowLabel: selDow,
      mealType,
    });

    const mealStr = v || "";
    const menuPayload = `${mealStr}, 에너지:${energy} Kcal, 단백질:${protein} g`;
    const payload = { date, menu: menuPayload, numeric_features: features };

    try {
      const ratio = await predictMeal(payload);
      const totalMeals = Math.floor(ratio * people);
      setPrediction({ ratio, people, totalMeals });
    } catch (e) {
      console.error("▶ ML 호출 에러:", e);
      alert("예측 호출에 실패했습니다.");
    }
  };

  // ── UI ──────────────────────────────────────────────────────────────────────
  const Badge = ({ children }) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      {children}
    </span>
  );

  const SegBtn = ({ active, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm border ${
        active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );

  // 연도 옵션: 현재 기준 -3년 ~ +1년
  const yearOptions = useMemo(() => {
    const arr = [];
    for (let y = currentYear - 3; y <= currentYear + 1; y += 1) arr.push(y);
    return arr.reverse(); // 최신 연도 먼저 보이게
  }, [currentYear]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">직접예측</h1>
        <p className="text-sm text-gray-500 mt-1">
          식단을 불러오고, 값을 수정해 보세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 좌측: 저장된 식단 목록 */}
        <aside className="md:col-span-5 xl:col-span-4">
          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            {/* 연/월 선택 바 */}
            <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-700">저장된 식단</h2>
                <Badge>{menus.length} 개</Badge>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">연도</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="border rounded-md px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-gray-200 outline-none"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>

                <label className="text-xs text-gray-500 ml-2">월</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="border rounded-md px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-gray-200 outline-none"
                >
                  {Array.from({ length: 12 }).map((_, i) => {
                    const m = i + 1;
                    return (
                      <option key={m} value={m}>
                        {m}월
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <ul className="max-h-[560px] overflow-auto divide-y">
              {menus.length === 0 && (
                <li className="px-4 py-10 text-sm text-gray-500 text-center">
                  선택한 연/월에 저장된 식단이 없습니다.
                </li>
              )}
              {menus.map((item) => {
                const active = selected?.id === item.id;
                const preview = [
                  itemsToLine(item.breakfast),
                  itemsToLine(item.lunch),
                  itemsToLine(item.dinner),
                ]
                  .filter(Boolean)
                  .join(" | ");
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleSelect(item)}
                      className={`w-full text-left px-4 py-3 transition focus:outline-none ${
                        active ? "bg-gray-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-800">{item.date}</div>
                      
                      </div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {preview || "—"}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* 우측: 상세/입력 카드 */}
        <main className="md:col-span-7 xl:col-span-8">
          {!selected ? (
            <div className="bg-white border rounded-2xl shadow-sm p-10 text-center text-gray-500">
              왼쪽에서 식단을 선택하세요.
            </div>
          ) : (
            <div className="bg-white border rounded-2xl shadow-sm">
              {/* 카드 헤더 */}
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-800">선택한 식단</h3>
                  <Badge>{mealType}</Badge>
                </div>
                <div className="text-xs text-gray-400">{selected.id?.slice(0, 8)}…</div>
              </div>

              {/* 카드 바디 */}
              <div className="p-6 space-y-6">
                {/* 기본 정보 */}
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">기본 정보</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="block text-xs font-medium text-gray-600 mb-1">날짜</span>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-xs font-medium text-gray-600 mb-1">식사 유형</span>
                      <select
                        value={mealType}
                        onChange={(e) => setMealType(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-gray-200 outline-none"
                      >
                        <option>아침</option>
                        <option>점심</option>
                        <option>저녁</option>
                      </select>
                    </label>
                  </div>
                </section>

                {/* 메뉴 */}
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">메뉴</h4>
                  <label className="block">
                    <span className="block text-xs font-medium text-gray-600 mb-1">
                      {mealType} 메뉴
                    </span>
                    <p className="text-[11px] text-gray-400 mt-1">각 메뉴는 콤마(,)로 구분해 주세요</p>
                    <input
                      type="text"
                      value={menuText}
                      onChange={(e) => setMenuText(e.target.value)}
                      onBlur={(e) => {
                        const v = e.target.value;
                        if (mealType === "아침") setBreakfast(v);
                        if (mealType === "점심") setLunch(v);
                        if (mealType === "저녁") setDinner(v);
                      }}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 outline-none"
                      placeholder="예: 닭가슴살, 샐러드, 현미밥"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="block text-xs font-medium text-gray-600 mb-1">
                        에너지 (kcal)
                      </span>
                      <input
                        type="number"
                        value={energy}
                        onChange={(e) => setEnergy(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 outline-none"
                        placeholder="예: 550"
                        inputMode="decimal"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-xs font-medium text-gray-600 mb-1">
                        단백질 (g)
                      </span>
                      <input
                        type="number"
                        value={protein}
                        onChange={(e) => setProtein(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 outline-none"
                        placeholder="예: 35"
                        inputMode="decimal"
                      />
                    </label>
                  </div>
                </section>

                {/* 예측 설정 */}
                <section className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700">예측 설정</h4>

                  {/* 요일 */}
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">요일</div>
                    <div className="flex flex-wrap gap-2">
                      {["월", "화", "수", "목", "금", "토", "일"].map((label) => (
                        <SegBtn
                          key={label}
                          active={selDow === label}
                          onClick={() => setSelDow(label)}
                        >
                          {label}
                        </SegBtn>
                      ))}
                    </div>
                  </div>

                  {/* 공휴일 / 시험 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-2">공휴일 여부</div>
                      <div className="flex gap-2">
                        <SegBtn active={selHoliday === true} onClick={() => setSelHoliday(true)}>
                          O
                        </SegBtn>
                        <SegBtn active={selHoliday === false} onClick={() => setSelHoliday(false)}>
                          X
                        </SegBtn>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-2">시험 여부</div>
                      <div className="flex gap-2">
                        <SegBtn active={selExam === true} onClick={() => setSelExam(true)}>
                          O
                        </SegBtn>
                        <SegBtn active={selExam === false} onClick={() => setSelExam(false)}>
                          X
                        </SegBtn>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        기본값은 날짜 기준 7~8, 15~16주차 자동 적용
                      </p>
                    </div>
                  </div>

                  {/* 총인원 */}
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="block text-xs font-medium text-gray-600 mb-1">총인원</span>
                      <input
                        type="number"
                        value={totalPeople}
                        onChange={(e) => setTotalPeople(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 outline-none"
                        placeholder="예: 24"
                        inputMode="numeric"
                      />
                    </label>
                  </div>
                </section>

                {/* 액션 & 결과 */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleCalculate}
                    className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    계산
                  </button>

                  {prediction && (
                    <div className="bg-gray-50 border rounded-xl px-4 py-2 text-sm">
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <div className="text-gray-500">예측 식사비율</div>
                          <div className="font-semibold">
                            {Number.isFinite(Number(prediction.ratio))
                              ? Number(prediction.ratio).toFixed(4)
                              : "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">총인원</div>
                          <div className="font-semibold">{prediction.people}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">총인원 × 비율</div>
                          <div className="font-semibold">{prediction.totalMeals}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

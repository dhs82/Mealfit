// src/pages/MealLogPage.jsx
import React, { useState, useEffect } from "react";
import { generateClient } from "@aws-amplify/api";
import { createMeal, updateMeal } from "../graphql/mutations";
import Calendar from "../components/Calendar";
import MealPopup from "../components/MealPopup";
import MealFileUpload from "../components/MealFileUpload";
import PeopleCountPopup from "../components/PeopleCountPopup";
import { buildNumericFeatures, getYearAndTermFromISO } from "../utils/dateFeatures";

// term → 한글 변환
const TERM_LABELS = {
  FIRST: "1학기",
  SUMMER: "여름학기",
  SECOND: "2학기",
  WINTER: "겨울학기",
};

// ---------------- Meals (중첩 필드 + predictedCount 포함) ----------------
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
        breakfast { items calories protein predictedCount }
        lunch { items calories protein predictedCount }
        dinner { items calories protein predictedCount }
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

// ---------------- PeopleCount ----------------
const LIST_PEOPLE_COUNTS = /* GraphQL */ `
  query ListPeopleCounts(
    $filter: ModelPeopleCountFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPeopleCounts(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        year
        term
        count
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

const CREATE_PEOPLE_COUNT = /* GraphQL */ `
  mutation CreatePeopleCount($input: CreatePeopleCountInput!) {
    createPeopleCount(input: $input) { id year term count }
  }
`;

const UPDATE_PEOPLE_COUNT = /* GraphQL */ `
  mutation UpdatePeopleCount($input: UpdatePeopleCountInput!) {
    updatePeopleCount(input: $input) { id year term count }
  }
`;

// ---------------- Helpers ----------------
const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// (비율 × 학생수) 올림
const calcCeilByPeople = (keyName, ratios, people) => {
  if (!people || ratios[keyName] == null) return null;
  const val = Number(ratios[keyName]) * Number(people.count);
  if (!Number.isFinite(val)) return null;
  return Math.ceil(val);
};

export default function MealLogPage() {
  const client = generateClient();

  // Meals
  const [menus, setMenus] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [currentMeals, setCurrentMeals] = useState(null); // { id, breakfast, lunch, dinner }
  const [showPopup, setShowPopup] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  // 예측 비율(내부 저장용)
  const [ratios, setRatios] = useState({ breakfast: null, lunch: null, dinner: null });

  // PeopleCount (여러 학기) & 선택 날짜용 active
  const [peopleCounts, setPeopleCounts] = useState([]);   // 전체 목록
  const [activePeople, setActivePeople] = useState(null); // 선택 날짜의 학기 레코드
  const [showPeoplePopup, setShowPeoplePopup] = useState(false);

  const mealOrder = [
    { label: "아침", key: "breakfast" },
    { label: "점심", key: "lunch" },
    { label: "저녁", key: "dinner" },
  ];

  // ---------- fetchers ----------
  const fetchMenus = async () => {
    try {
      const res = await client.graphql({
        query: LIST_MEALS_FULL,
        variables: {},
        authMode: "apiKey",
      });
      setMenus(res.data?.listMeals?.items ?? []);
    } catch (e) {
      console.error("Failed to fetch meals:", e);
      alert("메뉴 목록 로드 중 오류가 발생했습니다.");
    }
  };

  const fetchPeopleAll = async () => {
    try {
      const res = await client.graphql({
        query: LIST_PEOPLE_COUNTS,
        variables: { limit: 1000 },
        authMode: "apiKey",
      });
      setPeopleCounts(res.data?.listPeopleCounts?.items ?? []);
    } catch (e) {
      console.error("Failed to fetch people counts:", e);
    }
  };

  // ---------- effects ----------
  useEffect(() => {
    fetchMenus();
    fetchPeopleAll();
  }, []);

  // selectedDate에 맞는 Meal/ratio 세팅
  useEffect(() => {
    if (!selectedDate) {
      setCurrentMeals(null);
      setRatios({ breakfast: null, lunch: null, dinner: null });
      return;
    }
    const existing = menus.find((item) => item.date === selectedDate);
    if (existing) {
      setCurrentMeals({
        id: existing.id,
        breakfast: existing.breakfast,
        lunch: existing.lunch,
        dinner: existing.dinner,
      });
      setRatios({
        breakfast: existing.breakfast?.predictedCount ?? null,
        lunch: existing.lunch?.predictedCount ?? null,
        dinner: existing.dinner?.predictedCount ?? null,
      });
    } else {
      setCurrentMeals(null);
      setRatios({ breakfast: null, lunch: null, dinner: null });
    }
  }, [selectedDate, menus]);

  // selectedDate 또는 peopleCounts가 바뀌면 해당 학기의 PeopleCount 선택
  useEffect(() => {
    if (!selectedDate) { setActivePeople(null); return; }
    const { year, term } = getYearAndTermFromISO(selectedDate);
    const match = peopleCounts.find((p) => p.year === year && p.term === term) || null;
    setActivePeople(match);
  }, [selectedDate, peopleCounts]);

  // ---------- 저장 ----------
  const handleSave = async ({ date, meals }) => {
    const existing = menus.find((item) => item.date === date);
    try {
      if (existing) {
        await client.graphql({
          query: updateMeal,
          variables: {
            input: {
              id: existing.id,
              date,
              breakfast: meals.breakfast,
              lunch: meals.lunch,
              dinner: meals.dinner,
            },
          },
          authMode: "apiKey",
        });
      } else {
        await client.graphql({
          query: createMeal,
          variables: {
            input: {
              date,
              breakfast: meals.breakfast,
              lunch: meals.lunch,
              dinner: meals.dinner,
            },
          },
          authMode: "apiKey",
        });
      }
      await fetchMenus();
      setShowPopup(false);
      setShowFileUpload(false);
    } catch (e) {
      console.error("Save failed:", e);
      alert("메뉴 저장 중 오류가 발생했습니다.");
    }
  };

  const handleSavePeople = async ({ id, year, term, count }) => {
    try {
      if (id) {
        await client.graphql({
          query: UPDATE_PEOPLE_COUNT,
          variables: { input: { id, year, term, count } },
          authMode: "apiKey",
        });
      } else {
        await client.graphql({
          query: CREATE_PEOPLE_COUNT,
          variables: { input: { year, term, count } },
          authMode: "apiKey",
        });
      }
      setShowPeoplePopup(false);
      await fetchPeopleAll(); // 전체 갱신 → activePeople는 useEffect에서 다시 맞춰짐
    } catch (e) {
      console.error("PeopleCount save failed:", e);
      alert("학생 수 저장 중 오류가 발생했습니다.");
    }
  };

  const handleDateClick = (date) => setSelectedDate(date);

  // ---------- 예측(내부 저장용) ----------
  const ENDPOINT =
    "https://qv4bwtokvj.execute-api.ap-northeast-2.amazonaws.com/dev/predict";

  // mealKey에 따라 features를 동적으로 생성
  const callPredict = async (slot, date, mealKey) => {
    if (!slot || !Array.isArray(slot.items) || slot.items.length === 0) return null;
    const menuLine = slot.items.join(", ");
    const energy = Number(slot.calories ?? 0);
    const protein = Number(slot.protein ?? 0);
    const payload = {
      date,
      menu: `${menuLine}, 에너지:${energy} Kcal, 단백질:${protein} g`,
      numeric_features: buildNumericFeatures(date, mealKey),
    };
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      return typeof data?.prediction === "number" ? data.prediction : null;
    } catch (e) {
      console.error("Predict API failed:", e);
      return null;
    }
  };

  // 비율이 없으면 계산해서 저장
  useEffect(() => {
    const run = async () => {
      if (!currentMeals) return;

      const nextRatios = { ...ratios };
      const updates = {};

      const ensureFor = async (key) => {
        const slot = currentMeals[key];
        if (!slot) return;

        if (typeof slot.predictedCount === "number" && Number.isFinite(slot.predictedCount)) {
          nextRatios[key] = slot.predictedCount;
          return;
        }

        const ratio = await callPredict(slot, selectedDate, key); // ✅ key 전달
        if (ratio == null) return;

        const rounded = parseFloat(Number(ratio).toFixed(4));
        nextRatios[key] = rounded;

        updates[key] = {
          items: slot.items ?? [],
          calories: slot.calories ?? 0,
          protein: slot.protein ?? 0,
          predictedCount: rounded,
        };
      };

      await Promise.all(["breakfast", "lunch", "dinner"].map(ensureFor));

      if (Object.keys(updates).length > 0) {
        try {
          await client.graphql({
            query: updateMeal,
            variables: { input: { id: currentMeals.id, ...updates } },
            authMode: "apiKey",
          });
          setCurrentMeals((prev) =>
            prev
              ? {
                  ...prev,
                  breakfast: updates.breakfast ? { ...prev.breakfast, ...updates.breakfast } : prev.breakfast,
                  lunch: updates.lunch ? { ...prev.lunch, ...updates.lunch } : prev.lunch,
                  dinner: updates.dinner ? { ...prev.dinner, ...updates.dinner } : prev.dinner,
                }
              : prev
          );
        } catch (e) {
          console.error("updateMeal (store predicted) failed", e);
        }
      }

      setRatios(nextRatios);
    };

    run();
  }, [currentMeals, selectedDate]);

  // ---------- UI ----------
  const renderSlot = (label, keyName, slot) => (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
      <h4 className="text-xl font-bold mb-3 border-b pb-2">{label}</h4>
      {!slot ? (
        <p className="text-gray-500 italic">데이터 없음</p>
      ) : (
        <>
          <div className="mb-2">
            <div className="text-sm font-semibold text-gray-600">메뉴</div>
            {Array.isArray(slot.items) && slot.items.length > 0 ? (
              <ul className="list-disc list-inside mt-1 space-y-1">
                {slot.items.map((name, idx) => (
                  <li
                    key={`item-${keyName}-${idx}-${name || "blank"}`}
                    className="text-gray-800"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-400 italic mt-1">미등록</div>
            )}
          </div>

          <div className="flex flex-wrap gap-6 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-600">칼로리</span>
              <span className="text-gray-800">{slot.calories ?? 0} kcal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-600">프로틴</span>
              <span className="text-gray-800">{slot.protein ?? 0} g</span>
            </div>

            {/* ✅ 비율 × (해당 학기 학생수) = 올림 결과 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-600">
                인원수
              </span>
              <span className="text-gray-800">
                {(() => {
                  const total = calcCeilByPeople(keyName, ratios, activePeople);
                  return total != null ? `${total} 명` : "—";
                })()}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
      {/* 상단: 선택 날짜의 학기 학생 수 */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow p-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold">총 학생 수</h2>
          <p className="text-sm text-gray-500">
            해당 학기의 총 학생 수 입니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedDate ? (
            activePeople ? (
              <p className="text-gray-700">
                {activePeople.year}년 {TERM_LABELS[activePeople.term] || activePeople.term} /{" "}
                <span className="font-bold">{activePeople.count}</span> 명
              </p>
            ) : (
              <p className="text-gray-500">해당 날짜 학기의 학생 수가 없습니다.</p>
            )
          ) : (
            <p className="text-gray-500">날짜를 선택하세요.</p>
          )}
          <button
            className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
            onClick={() => setShowPeoplePopup(true)}
          >
            학생 수 추가/수정
          </button>
        </div>
      </div>

      {/* 캘린더 */}
      <div className="flex justify-center mt-8">
        <Calendar
          size="large"
          onDateClick={handleDateClick}
          selectedDate={selectedDate}
        />
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-4 mt-6 mb-6 justify-center">
        <button
          onClick={() => setShowPopup(true)}
          disabled={!selectedDate}
          className={`px-4 py-2 rounded text-white transition-colors duration-200 ${
            selectedDate ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          메뉴 등록 / 수정
        </button>

        <button
          onClick={() => setShowFileUpload(true)}
          disabled={!selectedDate}
          className={`px-4 py-2 rounded text-white transition-colors duration-200 ${
            selectedDate ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          파일로 등록하기
        </button>
      </div>

      {/* 팝업들 */}
      {showPopup && (
        <MealPopup
          date={selectedDate}
          meals={currentMeals || {}}
          onSave={handleSave}
          onClose={() => setShowPopup(false)}
        />
      )}
      {showFileUpload && (
        <MealFileUpload
          date={selectedDate}
          onSave={handleSave}
          onClose={() => setShowFileUpload(false)}
        />
      )}
      {showPeoplePopup && (
        <PeopleCountPopup
          initial={
            activePeople ??
            (selectedDate
              ? { ...getYearAndTermFromISO(selectedDate), count: "" }
              : { ...getYearAndTermFromISO(getTodayString()), count: "" })
          }
          onSave={handleSavePeople}
          onClose={() => setShowPeoplePopup(false)}
        />
      )}

      {/* 본문 */}
      {!selectedDate ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 text-xl">날짜를 선택해주세요.</p>
        </div>
      ) : !currentMeals ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 text-xl">
            {selectedDate}에 저장된 식단이 없습니다.
          </p>
        </div>
      ) : (
        <div className="p-6 grid gap-6">
          <div className="col-span-full bg-white rounded-lg shadow p-4">
            <h3 className="text-2xl font-semibold text-center mb-4">
              {selectedDate}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mealOrder.map(({ label, key }) => (
              <div key={`slot-${key}`}>{renderSlot(label, key, currentMeals[key])}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

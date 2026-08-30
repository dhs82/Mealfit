// src/features/dashboard/components/MealMenuCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { generateClient } from "@aws-amplify/api";
import { getYearAndTermFromISO } from "shared/utils/dateFeatures";

// ✅ 오늘 날짜(로컬) YYYY-MM-DD
const getTodayString = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const today = getTodayString();

// ── GraphQL ───────────────────────────────────────────────────────────────────
const LIST_PEOPLE_COUNTS = /* GraphQL */ `
  query ListPeopleCounts($filter: ModelPeopleCountFilterInput) {
    listPeopleCounts(filter: $filter) {
      items { id year term count }
    }
  }
`;

const LIST_MEALS_TODAY = /* GraphQL */ `
  query ListMeals($filter: ModelMealFilterInput, $limit: Int, $nextToken: String) {
    listMeals(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        breakfast { items calories protein }
        lunch { items calories protein }
        dinner { items calories protein }
      }
      nextToken
    }
  }
`;

const MealMenuCard = () => {
  const client = useMemo(() => generateClient(), []);

  const [semesterCount, setSemesterCount] = useState(null);
  const [meals, setMeals] = useState({ breakfast: null, lunch: null, dinner: null });

  const [loadingCount, setLoadingCount] = useState(true);
  const [loadingMeals, setLoadingMeals] = useState(true);

  const [errorCount, setErrorCount] = useState(null);
  const [errorMeals, setErrorMeals] = useState(null);

  // ▶ 이번 학기 총 인원
  useEffect(() => {
    const fetchPeople = async () => {
      setLoadingCount(true);
      setErrorCount(null);
      try {
        const { year, term } = getYearAndTermFromISO(today);
        const res = await client.graphql({
          query: LIST_PEOPLE_COUNTS,
          variables: { filter: { year: { eq: year }, term: { eq: term } } },
          authMode: "apiKey",
        });
        const item = res.data?.listPeopleCounts?.items?.[0];
        setSemesterCount(item?.count ?? null);
      } catch (e) {
        console.error("PeopleCount fetch failed:", e);
        setErrorCount("인원 정보를 불러오지 못했습니다.");
        setSemesterCount(null);
      } finally {
        setLoadingCount(false);
      }
    };
    fetchPeople();
  }, [client]);

  // ▶ 오늘 메뉴
  useEffect(() => {
    const fetchMeals = async () => {
      setLoadingMeals(true);
      setErrorMeals(null);
      try {
        let all = [];
        let nextToken = null;
        do {
          const res = await client.graphql({
            query: LIST_MEALS_TODAY,
            variables: { filter: { date: { eq: today } }, limit: 100, nextToken },
            authMode: "apiKey",
          });
          const data = res.data?.listMeals;
          all = all.concat(data?.items ?? []);
          nextToken = data?.nextToken ?? null;
        } while (nextToken);

        const todayItem = all[0];
        if (todayItem) {
          setMeals({
            breakfast: todayItem.breakfast ?? null,
            lunch: todayItem.lunch ?? null,
            dinner: todayItem.dinner ?? null,
          });
        } else {
          setMeals({ breakfast: null, lunch: null, dinner: null });
        }
      } catch (e) {
        console.error("오늘의 식단 불러오기 실패:", e);
        setErrorMeals("오늘의 식단을 불러오지 못했습니다.");
        setMeals({ breakfast: null, lunch: null, dinner: null });
      } finally {
        setLoadingMeals(false);
      }
    };
    fetchMeals();
  }, [client]);

  // 표시 유틸
  const mealOrder = [
    { label: "아침", key: "breakfast" },
    { label: "점심", key: "lunch" },
    { label: "저녁", key: "dinner" },
  ];

  // 메뉴 목록만 렌더 (영양정보는 아래 별도 섹션)
  const renderItems = (slot) => {
    if (!slot) return <p className="text-gray-400 italic">저장된 메뉴 없음</p>;
    const hasItems = Array.isArray(slot.items) && slot.items.length > 0;
    return hasItems ? (
      <ul className="list-disc list-inside text-gray-700 space-y-1">
        {slot.items.map((it, idx) => (
          <li key={idx}>{it}</li>
        ))}
      </ul>
    ) : (
      <p className="text-gray-400 italic">메뉴 항목 없음</p>
    );
  };

  return (
    <div className="p-4 rounded-2xl shadow-md bg-white">
      <h2 className="text-lg font-semibold mb-4">급식 변수 정보</h2>

      {/* 학기 총인원 */}
      <div className="flex justify-between items-baseline mb-4">
        <span className="font-medium">총 인원</span>
        {loadingCount ? (
          <span className="text-gray-500 italic">불러오는 중…</span>
        ) : errorCount ? (
          <span className="text-red-500 text-sm">{errorCount}</span>
        ) : semesterCount != null ? (
          <span className="font-bold text-xl">{semesterCount.toLocaleString()}명</span>
        ) : (
          <span className="text-gray-400 italic">등록된 인원 없음</span>
        )}
      </div>

      {/* 오늘의 메뉴 (상단 섹션) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        {mealOrder.map(({ label, key }) => (
          <div key={key}>
            <h3 className="font-semibold mb-1">{label} 메뉴</h3>
            {loadingMeals ? (
              <p className="text-gray-500 italic">불러오는 중…</p>
            ) : errorMeals ? (
              <p className="text-red-500 text-xs">{errorMeals}</p>
            ) : (
              renderItems(meals[key])
            )}
          </div>
        ))}
      </div>

      {/* ▼▼▼ 새 하단 섹션: 영양 정보 ▼▼▼ */}
      <div className="mt-6 border-t pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {mealOrder.map(({ label, key }) => {
            const slot = meals[key] || {};
            return (
              <div
                key={`nutri-${key}`}
                className="rounded-xl border bg-gray-50 px-4 py-3 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between text-xs text-gray-700">
                  <span className="inline-flex items-center gap-1">
                    <span className="font-medium">에너지</span>
                    <span>{slot.calories ?? 0} kcal</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="font-medium">단백질</span>
                    <span>{slot.protein ?? 0} g</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 보조 정보 */}
      <div className="mt-4 text-xs text-gray-400">기준 날짜: {today}</div>
    </div>
  );
};

export default MealMenuCard;

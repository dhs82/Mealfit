// src/features/dashboard/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { generateClient } from "@aws-amplify/api";
import Calendar from "shared/components/Calendar";
import EnvBox from "../components/EnvBox";
import VariableSection from "../components/VariableSection";
import MealMenuCard from "../components/MealMenuCard";
import MealCountCard from "../components/MealCountCard";
import { Chart } from "react-google-charts";
import { getYearAndTermFromISO } from "shared/utils/dateFeatures";

// ── Helpers ───────────────────────────────────────────────────────────────────
const toISO = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};
const weekRangeISO = (date) => {
  const d = new Date(date);
  const dow = d.getDay(); // 0=일, 1=월 ... 6=토
  const monday = addDays(d, dow === 0 ? -6 : 1 - dow);
  const nextMonday = addDays(monday, 7);
  return { start: toISO(monday), endExclusive: toISO(nextMonday), monday };
};
const DOW_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const labelWithDow = (iso) => {
  const d = new Date(iso);
  const mmdd = iso.slice(5);
  const dow = DOW_LABELS[d.getDay()];
  return `${mmdd}(${dow})`;
};

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
        breakfast { predictedCount }
        lunch { predictedCount }
        dinner { predictedCount }
      }
      nextToken
    }
  }
`;
const LIST_MEALS_RANGE = LIST_MEALS_TODAY; // 같은 필드로 범위 조회 사용

const Dashboard = () => {
  const client = useMemo(() => generateClient(), []);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [semesterCount, setSemesterCount] = useState(null);
  const [ratios, setRatios] = useState({
    breakfast: null,
    lunch: null,
    dinner: null,
  });

  const [weekRows, setWeekRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        const iso = toISO(selectedDate);

        const { year, term } = getYearAndTermFromISO(iso);
        const pcRes = await client.graphql({
          query: LIST_PEOPLE_COUNTS,
          variables: { filter: { year: { eq: year }, term: { eq: term } } },
          authMode: "apiKey",
        });
        const pcItem = pcRes.data?.listPeopleCounts?.items?.[0] ?? null;
        const count = pcItem?.count ?? null;
        const peopleCount = typeof count === "number" ? count : null;
        setSemesterCount(peopleCount);

        let nextToken = null;
        let item = null;
        do {
          const mRes = await client.graphql({
            query: LIST_MEALS_TODAY,
            variables: { filter: { date: { eq: iso } }, limit: 100, nextToken },
            authMode: "apiKey",
          });
          const data = mRes.data?.listMeals;
          if (data?.items?.length) {
            item = data.items[0];
            break;
          }
          nextToken = data?.nextToken ?? null;
        } while (nextToken);

        setRatios({
          breakfast: item?.breakfast?.predictedCount ?? null,
          lunch: item?.lunch?.predictedCount ?? null,
          dinner: item?.dinner?.predictedCount ?? null,
        });

        const { start, endExclusive, monday } = weekRangeISO(selectedDate);
        let all = [];
        let next = null;
        do {
          const res = await client.graphql({
            query: LIST_MEALS_RANGE,
            variables: { filter: { date: { ge: start, lt: endExclusive } }, limit: 200, nextToken: next },
            authMode: "apiKey",
          });
          const data = res.data?.listMeals;
          all = all.concat(data?.items ?? []);
          next = data?.nextToken ?? null;
        } while (next);

        const mapByDate = new Map();
        all.forEach((it) => {
          mapByDate.set(it.date, {
            dateISO: it.date,
            ratios: {
              breakfast: it?.breakfast?.predictedCount ?? null,
              lunch: it?.lunch?.predictedCount ?? null,
              dinner: it?.dinner?.predictedCount ?? null,
            },
          });
        });

        const rowsOut = [];
        for (let i = 0; i < 5; i++) {
          const isoD = toISO(addDays(monday, i));
          const base = mapByDate.get(isoD) || {
            dateISO: isoD,
            ratios: { breakfast: null, lunch: null, dinner: null },
          };
          const counts = {};
          ["breakfast", "lunch", "dinner"].forEach((k) => {
            const r = base.ratios[k];
            counts[k] =
              typeof r === "number" && typeof peopleCount === "number"
                ? Math.floor(r * peopleCount)
                : null;
          });
          rowsOut.push({ dateISO: isoD, counts });
        }
        setWeekRows(rowsOut);
      } catch (e) {
        console.error(e);
        setErr("데이터를 불러오는 중 문제가 발생했어요.");
        setSemesterCount(null);
        setRatios({ breakfast: null, lunch: null, dinner: null });
        setWeekRows([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [client, selectedDate]);

  const cards = [
    { meal: "아침", key: "breakfast", gradient: ["#95dbe5", "#60a5fa"] },
    { meal: "점심", key: "lunch", gradient: ["#e38a8a", "#f87171"] },
    { meal: "저녁", key: "dinner", gradient: ["#6e6bcd", "#818cf8"] },
  ];

  const chartDataWeek = React.useMemo(() => {
    const header = ["날짜", "아침", "점심", "저녁"];
    const rowsData = weekRows.map((r) => [
      labelWithDow(r.dateISO),
      typeof r.counts.breakfast === "number" ? r.counts.breakfast : null,
      typeof r.counts.lunch === "number" ? r.counts.lunch : null,
      typeof r.counts.dinner === "number" ? r.counts.dinner : null,
    ]);
    return [header, ...rowsData];
  }, [weekRows]);

  const hasChartWeek = weekRows.some(
    (r) =>
      typeof r.counts.breakfast === "number" ||
      typeof r.counts.lunch === "number" ||
      typeof r.counts.dinner === "number"
  );

  const maxY = React.useMemo(() => {
    let maxVal = 0;
    weekRows.forEach((r) => {
      [r.counts.breakfast, r.counts.lunch, r.counts.dinner].forEach((v) => {
        if (typeof v === "number" && v > maxVal) maxVal = v;
      });
    });
    if (!maxVal) return null;
    return Math.ceil((maxVal * 1.1) / 50) * 50;
  }, [weekRows]);

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8 space-y-10">

      {/* 👉 식수 인원 섹션을 헤더 바로 아래로 이동 */}
      <section className="mt-4">

        {loading ? (
          <p className="text-center text-gray-500">불러오는 중…</p>
        ) : err ? (
          <p className="text-center text-red-500">{err}</p>
        ) : (
          <div className="bg-white border rounded-2xl shadow-sm p-6 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          오늘의 식수 인원
        </h2>

            <div className="flex flex-wrap justify-center gap-6">
             {cards.map(({ meal, key, gradient }) => {
              const ratio = ratios[key];
              const hasCount = typeof semesterCount === "number";
              const show = typeof ratio === "number" && hasCount;
              return show ? (
                <div key={key}>
                  <MealCountCard
                    meal={meal}
                    count={Math.floor(ratio * semesterCount)}
                    gradientColors={gradient}
                  />
                </div>
              ) : (
                <div
                  key={key}
                  className="h-[140px] rounded-2xl border bg-white shadow-sm flex items-center justify-center px-4 text-center"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">{meal}</div>
                    <div className="text-gray-400 text-sm">저장된 값이 없습니다</div>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}
      </section>

      {/* 상단 카드들 */}
      <div className="grid grid-cols-12 gap-6">
        {/* 캘린더 */}
        <div className="col-span-12 md:col-span-5 xl:col-span-4">
          <div className="h-full">
            <Calendar
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              interactive={true}
            />
          </div>
        </div>

        {/* 환경/변수 박스 */}
        <div className="col-span-12 md:col-span-7 xl:col-span-8 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-6">
            <EnvBox />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <VariableSection />
          </div>

          {/* 메뉴 카드 */}
          <div className="col-span-12">
            <div className="rounded-2xl bg-white border shadow-sm">
              <div className="px-5 pt-4 pb-3 border-b">
                <h3 className="text-base font-semibold text-gray-800">오늘의 급식 메뉴</h3>
              </div>
              <div className="max-h-[450px] overflow-y-auto p-4">
                <MealMenuCard />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 그래프 */}
      <section className="mt-8">
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-2xl font-bold text-gray-800">인원 그래프</h2>
          <p className="text-xs text-gray-400">월–금 기준</p>
        </div>

        {loading ? (
          <p className="text-gray-500">불러오는 중…</p>
        ) : err ? (
          <p className="text-red-500">{err}</p>
        ) : hasChartWeek ? (
          <div className="bg-white border rounded-2xl shadow-sm p-4">
          <Chart
            chartType="LineChart"
            width="100%"
            height="440px"
            data={chartDataWeek}
            options={{
              curveType: "function",
              pointSize: 4,
              lineWidth: 3,
              legend: { position: "top", alignment: "center", textStyle: { fontSize: 12 } },
              chartArea: { left: 56, right: 12, top: 36, bottom: 48, width: "100%", height: "72%" },
              hAxis: {
                slantedText: true,
                textStyle: { fontSize: 12 },
                gridlines: { color: "#f3f4f6" },
              },
              vAxis: {
                viewWindow: { min: 0, ...(maxY ? { max: maxY } : {}) },
                gridlines: { color: "#e5e7eb", count: 6 },
                textStyle: { fontSize: 12 },
              },
              crosshair: { trigger: "both", orientation: "both", color: "#9ca3af" },
              tooltip: { isHtml: true, trigger: "focus" },
              focusTarget: "category",
              series: {
                0: { color: "#2563eb" },
                1: { color: "#ef4444" },
                2: { color: "#f59e0b" },
              },
              backgroundColor: "transparent",
            }}
          />
          </div>
        ) : (
          <p className="text-gray-400">그래프를 표시할 데이터가 없습니다</p>
        )}
      </section>
    </div>
  );
};

export default Dashboard;

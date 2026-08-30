// src/features/reports/pages/Report.jsx
import React, { useEffect, useMemo, useState } from "react";
import { generateClient } from "@aws-amplify/api";
import Calendar from "shared/components/Calendar";
import { Chart } from "react-google-charts";
import { getYearAndTermFromISO } from "shared/utils/dateFeatures";

/** 날짜 유틸 */
const toISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};
// 요일 라벨(일~토)
const DOW_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const labelWithDow = (iso) => {
  // iso: YYYY-MM-DD
  const d = new Date(iso);
  const mmdd = iso.slice(5); // MM-DD
  const dow = DOW_LABELS[d.getDay()];
  return `${mmdd} (${dow})`;
};

/** 주간 범위(월~월) */
const weekRangeISO = (date) => {
  const d = new Date(date);
  const dow = d.getDay(); // 0=일, 1=월 ... 6=토
  const monday = addDays(d, dow === 0 ? -6 : 1 - dow);
  const nextMonday = addDays(monday, 7);
  return { start: toISO(monday), endExclusive: toISO(nextMonday), monday };
};
/** 월간 범위(1일~다음달 1일) */
const monthRangeISO = (date) => {
  const y = date.getFullYear();
  const m = date.getMonth();
  const first = new Date(y, m, 1);
  const next = new Date(y, m + 1, 1);
  return { start: toISO(first), endExclusive: toISO(next), first };
};
/** 학기 범위 (예시: 3~6월=1학기, 9~12월=2학기) */
const termRangeISO = (date) => {
  const iso = toISO(date);
  const { year, term } = getYearAndTermFromISO(iso);
  const startMonth = term === "FIRST" ? 2 : 8; // 0-indexed: 2=Mar, 8=Sep
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 4, 1); // 4개월 구간
  return { start: toISO(start), endExclusive: toISO(end), label: `${year}년 ${term}` };
};

/** GraphQL */
const LIST_MEALS_RANGE = /* GraphQL */ `
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
const LIST_PEOPLE_COUNTS = /* GraphQL */ `
  query ListPeopleCounts($filter: ModelPeopleCountFilterInput) {
    listPeopleCounts(filter: $filter) {
      items { id year term count }
    }
  }
`;

const MEAL_KEYS = [
  { key: "breakfast", label: "아침" },
  { key: "lunch", label: "점심" },
  { key: "dinner", label: "저녁" },
];

/** 드래그 스크롤 컨테이너 (행 많을 때 테이블 세로 드래그 스크롤) */
const DragScrollContainer = ({ enabled, maxHeight = 360, children }) => {
  const ref = React.useRef(null);
  const state = React.useRef({ isDown: false, startY: 0, scrollTop: 0 });

  const onMouseDown = (e) => {
    if (!enabled || !ref.current) return;
    state.current.isDown = true;
    state.current.startY = e.pageY - ref.current.offsetTop;
    state.current.scrollTop = ref.current.scrollTop;
    ref.current.classList.add("cursor-grabbing");
  };
  const onMouseMove = (e) => {
    if (!enabled || !ref.current || !state.current.isDown) return;
    e.preventDefault();
    const y = e.pageY - ref.current.offsetTop;
    const walkY = (y - state.current.startY) * 1;
    ref.current.scrollTop = state.current.scrollTop - walkY;
  };
  const endDrag = () => {
    state.current.isDown = false;
    ref.current?.classList.remove("cursor-grabbing");
  };

  // 터치 지원
  const onTouchStart = (e) => {
    if (!enabled || !ref.current) return;
    const touch = e.touches[0];
    state.current.isDown = true;
    state.current.startY = touch.pageY - ref.current.offsetTop;
    state.current.scrollTop = ref.current.scrollTop;
  };
  const onTouchMove = (e) => {
    if (!enabled || !ref.current || !state.current.isDown) return;
    const touch = e.touches[0];
    const y = touch.pageY - ref.current.offsetTop;
    const walkY = (y - state.current.startY) * 1;
    ref.current.scrollTop = state.current.scrollTop - walkY;
  };
  const onTouchEnd = () => {
    state.current.isDown = false;
  };

  return (
    <div
      ref={ref}
      style={{ maxHeight }}
      className={`overflow-auto select-none ${enabled ? "cursor-grab" : ""}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseLeave={endDrag}
      onMouseUp={endDrag}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </div>
  );
};

const Report = () => {
  const client = useMemo(() => generateClient(), []);

  const [selectedDate, setSelectedDate] = useState(new Date());

  // ▼ 드롭다운: 리포트 종류 & 범위
  const reportTypes = [
    { key: "week", label: "주간 리포트" },
    { key: "month", label: "월간 리포트" },
    { key: "term", label: "학기 리포트" },
  ];
  const [reportType, setReportType] = useState("week"); // 'week' | 'month' | 'term'

  const weekendOptions = [
    { key: "weekdays", label: "월~금" },
    { key: "all", label: "월~일" },
  ];
  const [rangeKey, setRangeKey] = useState("weekdays"); // 'weekdays' | 'all'
  const showWeekend = rangeKey === "all";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [peopleCount, setPeopleCount] = useState(null);
  const [rows, setRows] = useState([]); // [{dateISO, ratios:{}, counts:{}}]

  // 데이터 로드
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        // 1) 범위 계산
        let range;
        if (reportType === "week") range = weekRangeISO(selectedDate);
        else if (reportType === "month") range = monthRangeISO(selectedDate);
        else range = termRangeISO(selectedDate);

        // 2) Meals 조회
        let all = [];
        let nextToken = null;
        do {
          const res = await client.graphql({
            query: LIST_MEALS_RANGE,
            variables: {
              filter: { date: { ge: range.start, lt: range.endExclusive } },
              limit: 200,
              nextToken,
            },
            authMode: "apiKey",
          });
          const data = res.data?.listMeals;
          all = all.concat(data?.items ?? []);
          nextToken = data?.nextToken ?? null;
        } while (nextToken);

        all.sort((a, b) => (a?.date || "").localeCompare(b?.date || ""));

        // 3) 학기 인원
        const anyDateISO = all[0]?.date ?? range.start;
        const { year, term } = getYearAndTermFromISO(anyDateISO);
        const pcRes = await client.graphql({
          query: LIST_PEOPLE_COUNTS,
          variables: { filter: { year: { eq: year }, term: { eq: term } } },
          authMode: "apiKey",
        });
        const pc = pcRes.data?.listPeopleCounts?.items?.[0]?.count ?? null;
        setPeopleCount(typeof pc === "number" ? pc : null);

        // 4) 날짜 루프 구성
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

        const out = [];
        let cur = new Date(range.start);
        while (toISO(cur) < range.endExclusive) {
          const iso = toISO(cur);
          const base = mapByDate.get(iso) || {
            dateISO: iso,
            ratios: { breakfast: null, lunch: null, dinner: null },
          };
          const counts = {};
          MEAL_KEYS.forEach(({ key }) => {
            const r = base.ratios[key];
            counts[key] =
              typeof r === "number" && typeof pc === "number" ? Math.floor(r * pc) : null;
          });
          out.push({ ...base, counts });
          cur.setDate(cur.getDate() + 1);
        }
        setRows(out);
      } catch (e) {
        console.error(e);
        setErr("데이터를 불러오는 중 문제가 발생했습니다.");
        setRows([]);
        setPeopleCount(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [client, selectedDate, reportType]);

  /** 표시 범위(월~금/월~일) 적용 */
  const filteredRows = useMemo(() => {
    if (showWeekend) return rows;
    return rows.filter((r) => {
      const dow = new Date(r.dateISO).getDay(); // 0=일,6=토 제외
      return dow >= 1 && dow <= 5;
    });
  }, [rows, showWeekend]);

  /** KPI — 표시 범위 기준 */
  const coverage = useMemo(() => {
    const totalSlots = filteredRows.length * MEAL_KEYS.length;
    const filled = filteredRows.reduce(
      (acc, r) =>
        acc + MEAL_KEYS.filter(({ key }) => typeof r.ratios[key] === "number").length,
      0
    );
    return totalSlots ? Math.round((filled / totalSlots) * 100) : 0;
  }, [filteredRows]);

  // ✅ 일 평균(표시 범위): 각 날짜의 (아+점+저) 합을 구해, "데이터가 있는 날" 기준으로 평균
  const dailyAverageTotal = useMemo(() => {
    let sumTotals = 0;
    let daysWithAny = 0;
    filteredRows.forEach((r) => {
      const vals = [r.counts.breakfast, r.counts.lunch, r.counts.dinner].filter(
        (v) => typeof v === "number"
      );
      if (vals.length > 0) {
        sumTotals += vals.reduce((a, b) => a + b, 0);
        daysWithAny += 1;
      }
    });
    if (!daysWithAny) return null;
    return Math.round(sumTotals / daysWithAny);
  }, [filteredRows]);

  /** 표 데이터 */
  const tableHeader = ["날짜", "아침", "점심", "저녁"];
  const expectedTable = filteredRows.map((r) => [
    r.dateISO,
    r.counts.breakfast ?? "—",
    r.counts.lunch ?? "—",
    r.counts.dinner ?? "—",
  ]);
  const ratioTable = filteredRows.map((r) => [
    r.dateISO,
    typeof r.ratios.breakfast === "number" ? r.ratios.breakfast.toFixed(4) : "—",
    typeof r.ratios.lunch === "number" ? r.ratios.lunch.toFixed(4) : "—",
    typeof r.ratios.dinner === "number" ? r.ratios.dinner.toFixed(4) : "—",
  ]);

  // 표 렌더 여부
  const hasExpectedData = filteredRows.some(
    (r) =>
      typeof r.counts.breakfast === "number" ||
      typeof r.counts.lunch === "number" ||
      typeof r.counts.dinner === "number"
  );
  const hasRatioData = filteredRows.some(
    (r) =>
      typeof r.ratios.breakfast === "number" ||
      typeof r.ratios.lunch === "number" ||
      typeof r.ratios.dinner === "number"
  );

  /** 그래프 데이터 */
  const chartIsCounts = typeof peopleCount === "number";
const chartData = useMemo(() => {
  const header = ["날짜", "아침", "점심", "저녁"];
  const rowsData = filteredRows.map((r) => [
    labelWithDow(r.dateISO), // ⬅️ 기존 r.dateISO.slice(5) 대신 요일 포함 라벨
    chartIsCounts
      ? r.counts.breakfast ?? null
      : typeof r.ratios.breakfast === "number"
      ? Math.round(r.ratios.breakfast * 100)
      : null,
    chartIsCounts
      ? r.counts.lunch ?? null
      : typeof r.ratios.lunch === "number"
      ? Math.round(r.ratios.lunch * 100)
      : null,
    chartIsCounts
      ? r.counts.dinner ?? null
      : typeof r.ratios.dinner === "number"
      ? Math.round(r.ratios.dinner * 100)
      : null,
  ]);
  return [header, ...rowsData];
}, [filteredRows, chartIsCounts]);


  const hasChartData = filteredRows.some((r) =>
    chartIsCounts
      ? typeof r.counts.breakfast === "number" ||
        typeof r.counts.lunch === "number" ||
        typeof r.counts.dinner === "number"
      : typeof r.ratios.breakfast === "number" ||
        typeof r.ratios.lunch === "number" ||
        typeof r.ratios.dinner === "number"
  );
  // 그래프 y축 상한 자동 계산
const maxY = React.useMemo(() => {
  let maxVal = 0;
  filteredRows.forEach((r) => {
    const vals = chartIsCounts
      ? [r.counts.breakfast, r.counts.lunch, r.counts.dinner]
      : [
          typeof r.ratios.breakfast === "number" ? Math.round(r.ratios.breakfast * 100) : null,
          typeof r.ratios.lunch === "number" ? Math.round(r.ratios.lunch * 100) : null,
          typeof r.ratios.dinner === "number" ? Math.round(r.ratios.dinner * 100) : null,
        ];
    vals.forEach((v) => {
      if (typeof v === "number" && v > maxVal) maxVal = v;
    });
  });
  if (!maxVal) return null;
  // 여유 10% 주고, 보기 좋게 50 단위로 올림
  const padded = Math.ceil((maxVal * 1.1) / 50) * 50;
  return padded;
}, [filteredRows, chartIsCounts]);


  // 기간 라벨
  const periodLabel = (() => {
    if (reportType === "week") {
      const { monday } = weekRangeISO(selectedDate);
      const sun = addDays(monday, 6);
      return `${toISO(monday)} ~ ${toISO(sun)}`;
    }
    if (reportType === "month") {
      const { first, endExclusive } = monthRangeISO(selectedDate);
      const last = addDays(new Date(endExclusive), -1);
      return `${toISO(first)} ~ ${toISO(last)}`;
    }
    const { start, endExclusive } = termRangeISO(selectedDate);
    const last = addDays(new Date(endExclusive), -1);
    return `${start} ~ ${toISO(last)}`;
  })();

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">
      {/* 헤더: 제목 + 드롭다운 2종 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800">리포트</h1>

          {/* 리포트 종류 셀렉트 */}
          <div className="relative">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="appearance-none bg-white border px-3 py-1.5 rounded-md text-sm pr-7"
            >
              {reportTypes.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-600">▼</span>
          </div>

          {/* 범위 셀렉트 */}
          <div className="relative">
            <select
              value={rangeKey}
              onChange={(e) => setRangeKey(e.target.value)}
              className="appearance-none bg-white border px-3 py-1.5 rounded-md text-sm pr-7"
            >
              {weekendOptions.map((w) => (
                <option key={w.key} value={w.key}>
                  {w.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-600">▼</span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          기준 기간: <span className="font-medium text-gray-700">{periodLabel}</span>
        </div>
      </div>

      {/* 상단: 달력 + KPI (표시 범위 기준) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1">
          <Calendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>
        <div className="col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl border text-center">
            <div className="text-xs text-gray-500 mb-1">학기 총 인원</div>
            <div className="text-xl font-bold">
              {typeof peopleCount === "number" ? peopleCount.toLocaleString() : "—"}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border text-center">
            <div className="text-xs text-gray-500 mb-1">식단 저장율</div>
            <div className="text-xl font-bold">{coverage}%</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border text-center">
            <div className="text-xs text-gray-500 mb-1">일합계 평균</div>
            <div className="text-xl font-bold">
              {typeof dailyAverageTotal === "number" ? dailyAverageTotal.toLocaleString() : "—"}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border text-center">
            <div className="text-xs text-gray-500 mb-1">
              {reportType === "week" ? "기준 주" : reportType === "month" ? "기준 월" : "기준 학기"}
            </div>
            <div className="text-sm font-semibold">{periodLabel}</div>
          </div>
        </div>
      </div>

      {/* 표 섹션 (드래그 스크롤 & 토글 반영 & 데이터 없으면 표 숨김) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 예상 식수(명) 표 */}
        <div className="col-span-1">
          <h2 className="text-lg font-semibold mb-2">
            예상 식수(명) ({showWeekend ? "월~일" : "월~금"})
          </h2>
          {hasExpectedData ? (
            <DragScrollContainer enabled={filteredRows.length > 7} maxHeight={360}>
              <div className="border rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      {tableHeader.map((h) => (
                        <th key={h} className="p-2 border">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expectedTable.map((row, idx) => (
                      <tr key={idx} className="text-center">
                        {row.map((cell, i) => (
                          <td key={i} className="border p-1">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DragScrollContainer>
          ) : (
            <p className="text-gray-400 text-sm">예상 식수 데이터가 없습니다</p>
          )}
        </div>

        {/* 예측 비율 표 */}
        <div className="col-span-1">
          <h2 className="text-lg font-semibold mb-2">
            예측 비율 ({showWeekend ? "월~일" : "월~금"})
          </h2>
          {hasRatioData ? (
            <DragScrollContainer enabled={filteredRows.length > 7} maxHeight={360}>
              <div className="border rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      {tableHeader.map((h) => (
                        <th key={h} className="p-2 border">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ratioTable.map((row, idx) => (
                      <tr key={idx} className="text-center">
                        {row.map((cell, i) => (
                          <td key={i} className="border p-1">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DragScrollContainer>
          ) : (
            <p className="text-gray-400 text-sm">예측 비율 데이터가 없습니다</p>
          )}
        </div>
      </div>

      {/* 그래프 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {reportTypes.find((t) => t.key === reportType)?.label} 그래프 ({showWeekend ? "월~일" : "월~금"}{" "}
          {typeof peopleCount === "number" ? "예상 식수(명)" : "예측 비율(%)"})
        </h2>
        {loading ? (
          <p className="text-gray-500">불러오는 중…</p>
        ) : err ? (
          <p className="text-red-500">{err}</p>
        ) : hasChartData ? (
<Chart
  chartType="LineChart"
  width="100%"
  height="460px"
  data={chartData}
  options={{
    curveType: "function",
    // 선/포인트 가독성
    pointSize: 5,
    lineWidth: 3,
    // 범례를 위로
    legend: { position: "top", alignment: "center", textStyle: { fontSize: 12 } },
    // 차트 영역 확대 (레이블 겹침 방지)
    chartArea: { left: 60, right: 20, top: 40, bottom: 60, width: "100%", height: "70%" },
    // 축/눈금 스타일
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
    // 상호작용
    crosshair: { trigger: "both", orientation: "both", color: "#9ca3af" },
    tooltip: { isHtml: true, trigger: "focus" },
    focusTarget: "category",
    // 시리즈 컬러 (아침/점심/저녁)
    series: {
      0: { color: "#2563eb" }, // blue-600
      1: { color: "#ef4444" }, // red-500
      2: { color: "#f59e0b" }, // amber-500
    },
    // 배경
    backgroundColor: "transparent",
  }}
/>

        ) : (
          <p className="text-gray-400 text-sm">그래프를 표시할 데이터가 없습니다</p>
        )}
      </div>
    </div>
  );
};

export default Report;

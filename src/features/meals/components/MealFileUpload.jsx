// src/features/meals/components/MealFileUpload.jsx
import React, { useState } from "react";
import { generateClient } from "@aws-amplify/api";
import { createMeal, updateMeal } from "graphql/mutations";
import { buildNumericFeatures } from "shared/utils/dateFeatures";
import { predictMeal } from "features/prediction/api/predictMeal";

// 날짜/ID만 가져오는 간단 리스트(페이지네이션)
const LIST_MEALS_MIN = /* GraphQL */ `
  query ListMeals($limit: Int, $nextToken: String) {
    listMeals(limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
      }
      nextToken
    }
  }
`;

const client = generateClient();

// ---------- 유틸 ----------
const z2 = (n) => String(n).padStart(2, "0");
const isKoreanWeek = (s) =>
  ["월", "화", "수", "목", "금", "토", "일"].includes((s || "").trim());

/** 메뉴 필드에서 {items[], calories, protein} 추출 */
function parseMenuField(menuFieldRaw) {
  let raw = (menuFieldRaw ?? "").toString().trim();

  // 1) 필드 전체 감싼 따옴표 제거
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1).trim();
  }

  // 2) 칼로리/단백질 추출
  const calMatch = raw.match(/에너지\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*Kcal/i);
  const proMatch = raw.match(/단백질\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*g/i);
  const calories = calMatch ? Math.round(parseFloat(calMatch[1])) : 0;
  const protein = proMatch ? parseFloat(proMatch[1]) : 0;

  // 3) 텍스트에서 에너지/단백질 부분 제거
  let itemsStr = raw
    .replace(/에너지\s*:\s*[0-9]+(?:\.[0-9]+)?\s*Kcal/gi, "")
    .replace(/단백질\s*:\s*[0-9]+(?:\.[0-9]+)?\s*g/gi, "")
    .trim();

  // 4) 줄바꿈 정규화
  itemsStr = itemsStr.replace(/\r\n/g, "\n");

  // 5) 항목 분리: 콤마 또는 줄바꿈
  let tokens = itemsStr
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^["']+|["']+$/g, ""));

  // 6) 가끔 끼어드는 요일 토큰 제거
  tokens = tokens.filter((t) => !isKoreanWeek(t));

  return { items: tokens, calories, protein };
}

/** TSV/CSV 유사 텍스트 → [{date, mealKey, slot}] */
function parseTextToRows(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  // 헤더 제거
  const headerLike = /년|월|일|요일|끼니|메뉴/;
  if (headerLike.test(lines[0])) lines.shift();

  const rows = [];
  for (const line of lines) {
    // 기본은 탭, 없으면 콤마
    const parts = line.includes("\t") ? line.split("\t") : line.split(",");

    // 기대 컬럼: [년, 월, 일, 요일, 끼니, 메뉴(이후 전부)]
    if (parts.length < 6) continue;

    const year = parts[0].trim();
    const month = parts[1].trim();
    const day = parts[2].trim();
    const mealKo = parts[4]?.trim();
    const menuField = parts.slice(5).join(","); // 뒤는 전부 메뉴 텍스트

    const date = `${year}-${z2(month)}-${z2(day)}`;

    let mealKey = null;
    if (mealKo.includes("아침")) mealKey = "breakfast";
    else if (mealKo.includes("점심")) mealKey = "lunch";
    else if (mealKo.includes("저녁")) mealKey = "dinner";
    else continue;

    const slot = parseMenuField(menuField);
    rows.push({ date, mealKey, slot });
  }
  return rows;
}

/** 예측 호출 -> ratio(소수점 4자리) 또는 null */
async function predictRatio(date, slot, mealKey) {
  if (!slot || !Array.isArray(slot.items) || slot.items.length === 0) return null;
  const menuLine = slot.items.join(", ");
  const payload = {
    date,
    menu: `${menuLine}, 에너지:${slot.calories ?? 0} Kcal, 단백질:${slot.protein ?? 0} g`,
    numeric_features: buildNumericFeatures(date, mealKey),
  };
  try {
    const prediction = await predictMeal(payload);
    if (typeof prediction !== "number") return null;
    return parseFloat(Number(prediction).toFixed(4));
  } catch (e) {
    console.error("predict error:", e);
    return null;
  }
}

/** 기존 날짜->id 맵 전부 수집 */
async function getExistingDateIdMap() {
  const map = {};
  let nextToken = null;
  do {
    const res = await client.graphql({
      query: LIST_MEALS_MIN,
      variables: { limit: 1000, nextToken },
      authMode: "apiKey",
    });
    const page = res.data?.listMeals;
    (page?.items ?? []).forEach((it) => {
      if (it?.date) map[it.date] = it.id;
    });
    nextToken = page?.nextToken ?? null;
  } while (nextToken);
  return map;
}

// ---------- 컴포넌트 ----------
export default function MealFileUpload({ onClose }) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);

  const appendLog = (msg) => setLog((prev) => [...prev, msg]);

  const handleFile = async (file) => {
    const txt = await file.text();
    setText(txt);
    setFileName(file.name);
    setLog([`파일 로드: ${file.name}`]);
  };

  const handlePaste = (e) => {
    const txt = e.clipboardData.getData("text");
    setText(txt);
    setFileName("(클립보드 붙여넣기)");
    setLog(["클립보드 데이터 붙여넣기 완료"]);
  };

  const handleImport = async () => {
    if (!text.trim()) {
      alert("먼저 파일을 선택하거나 데이터를 붙여넣으세요.");
      return;
    }
    setBusy(true);
    setLog(["파싱 시작…"]);

    try {
      const rows = parseTextToRows(text);
      appendLog(`총 ${rows.length} 행 파싱`);

      // 날짜별로 묶기 → { date: { breakfast, lunch, dinner } }
      const grouped = {};
      for (const r of rows) {
        if (!grouped[r.date])
          grouped[r.date] = { breakfast: null, lunch: null, dinner: null };
        grouped[r.date][r.mealKey] = {
          items: r.slot.items ?? [],
          calories: r.slot.calories ?? 0,
          protein: r.slot.protein ?? 0,
        };
      }
      const dates = Object.keys(grouped);
      appendLog(`날짜 기준 그룹화: ${dates.length}건`);

      // 기존 날짜->id 맵
      const dateIdMap = await getExistingDateIdMap();
      appendLog(
        `기존 레코드 조회 완료 (총 ${Object.keys(dateIdMap).length}건)`
      );

      // 날짜별 예측 → 저장
      for (const date of dates) {
        const pack = grouped[date];

        // 슬롯별 예측 비율(없으면 null)
        const [b, l, d] = await Promise.all([
          pack.breakfast ? predictRatio(date, pack.breakfast, "breakfast") : Promise.resolve(null),
          pack.lunch ? predictRatio(date, pack.lunch, "lunch") : Promise.resolve(null),
          pack.dinner ? predictRatio(date, pack.dinner, "dinner") : Promise.resolve(null),
        ]);
        if (pack.breakfast) pack.breakfast.predictedCount = b ?? null;
        if (pack.lunch) pack.lunch.predictedCount = l ?? null;
        if (pack.dinner) pack.dinner.predictedCount = d ?? null;

        const existsId = dateIdMap[date];

        const input = {
          date,
          breakfast: pack.breakfast ?? {
            items: [],
            calories: 0,
            protein: 0,
            predictedCount: null,
          },
          lunch: pack.lunch ?? {
            items: [],
            calories: 0,
            protein: 0,
            predictedCount: null,
          },
          dinner: pack.dinner ?? {
            items: [],
            calories: 0,
            protein: 0,
            predictedCount: null,
          },
        };

        try {
          if (existsId) {
            await client.graphql({
              query: updateMeal,
              variables: { input: { id: existsId, ...input } },
              authMode: "apiKey",
            });
            appendLog(`UPDATE: ${date} (id=${existsId})`);
          } else {
            const res = await client.graphql({
              query: createMeal,
              variables: { input },
              authMode: "apiKey",
            });
            const newId = res.data?.createMeal?.id;
            appendLog(`CREATE: ${date} (id=${newId || "—"})`);
          }
        } catch (e) {
          console.error("save error:", e);
          appendLog(`❌ 저장 실패: ${date} - ${e.message || e}`);
        }
      }

      appendLog("완료!");
      alert("파일 저장을 완료했습니다.");
      onClose?.();
    } catch (e) {
      console.error(e);
      alert("가져오기 중 오류가 발생했습니다.");
      appendLog(`❌ 오류: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow p-6 w-[840px] max-h-[90vh] overflow-auto">
        <h2 className="text-lg font-semibold mb-4">파일로 등록하기</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".tsv,.csv,.txt"
              onChange={(e) =>
                e.target.files?.[0] && handleFile(e.target.files[0])
              }
              disabled={busy}
            />
            {fileName && (
              <span className="text-sm text-gray-500">{fileName}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              또는, 엑셀에서 표를 복사해서 여기에 붙여넣기
              (년도/월/일/요일/끼니/메뉴)
            </label>
            <textarea
              onPaste={handlePaste}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                '예)\n2025\t9\t1\t월\t점심\t"흰밥/김치\\n건새우아욱국\\n양념통살치킨", 에너지:688  Kcal, 단백질:27  g'
              }
              className="w-full h-48 border rounded-lg p-3 text-sm font-mono"
              disabled={busy}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleImport}
              disabled={busy || !text.trim()}
              className={`px-4 py-2 rounded text-white ${
                busy ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {busy ? "처리 중…" : "가져오기 & 저장"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded border"
              disabled={busy}
            >
              닫기
            </button>
          </div>

          {log.length > 0 && (
            <div className="bg-gray-50 border rounded-lg p-3 text-xs h-40 overflow-auto">
              {log.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

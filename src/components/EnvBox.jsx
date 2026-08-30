// src/components/EnvBox.jsx
import React, { useEffect, useState, useMemo } from "react";

const weatherCodeToKo = (code) => {
  const m = {
    0: "맑음", 1: "대체로 맑음", 2: "부분적으로 흐림", 3: "흐림",
    45: "안개", 48: "상고대",
    51: "약한 이슬비", 53: "이슬비", 55: "강한 이슬비",
    56: "약한 언 이슬비", 57: "강한 언 이슬비",
    61: "약한 비", 63: "비", 65: "강한 비",
    66: "약한 언 비", 67: "강한 언 비",
    71: "약한 눈", 73: "눈", 75: "강한 눈",
    77: "싸락눈", 80: "약한 소나기", 81: "소나기", 82: "강한 소나기",
    85: "약한 소낙눈", 86: "강한 소낙눈",
    95: "천둥번개", 96: "우박(약)", 99: "우박(강)",
  };
  return m[code] ?? "알 수 없음";
};

const EnvBox = ({ title = "충북대학교 날씨" }) => {
  const [tempC, setTempC] = useState(null);
  const [weatherText, setWeatherText] = useState("-");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const isWeekend = useMemo(() => {
    const day = new Date().getDay(); // 0=일, 6=토
    return day === 0 || day === 6;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setErr("");
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=36.6283&longitude=127.4560&current_weather=true&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const cw = json.current_weather;
        if (isMounted && cw) {
          setTempC(Math.round(cw.temperature));
          setWeatherText(weatherCodeToKo(cw.weathercode));
        }
      } catch (e) {
        if (isMounted) {
          setErr("날씨 정보를 불러오지 못했습니다.");
          setTempC(null);
          setWeatherText("-");
        }
      } finally {
        isMounted && setLoading(false);
      }
    }

    load();
    return () => (isMounted = false);
  }, []);

  return (
    <div className="p-4 rounded-2xl shadow-md bg-white">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      {loading && <div className="text-sm text-gray-500">불러오는 중…</div>}
      {!loading && err && <div className="text-sm text-red-600">{err}</div>}

      {!loading && !err && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img src="/assets/temp.png" alt="기온" className="w-8 h-8" />
            <span className="text-gray-700">
              기온 {tempC !== null ? `${tempC}℃` : "-"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <img src="/assets/weather.png" alt="날씨" className="w-8 h-8" />
            <span className="text-gray-700">날씨 {weatherText}</span>
          </div>

          <div className="flex items-center gap-3">
            <img src="/assets/holiday.png" alt="학사 일정" className="w-8 h-8" />
            <span className="text-gray-700">
              {isWeekend ? "주말입니다" : "평일입니다"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvBox;

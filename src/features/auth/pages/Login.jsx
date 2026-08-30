// src/features/auth/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "features/auth/AuthContext";

export default function Login() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const res = login(id.trim(), pw);
    if (res.ok) nav("/", { replace: true });
    else setErr(res.msg || "아이디 또는 비밀번호가 올바르지 않습니다.");
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* 상단 로고 라인 (선택) */}
      <div className="px-6 py-4">
        <h1 className="text-xl font-extrabold tracking-tight text-gray-800">
          Meal-Fit
        </h1>
      </div>

      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* 왼쪽: 비주얼 영역 */}
          <div className="relative hidden lg:block">
            {/* 배경 이미지 */}
            <div className="overflow-hidden rounded-3xl shadow-lg">
              <img
                src="/assets/Vtamin.jpg"
                alt="건강한 식사 비주얼"
                className="h-[600px] w-full object-cover"
              />
              {/* 그라데이션 오버레이 (가독성) */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/30 via-black/10 to-transparent" />
            </div>

            {/* 이미지 위 텍스트 */}
            <div className="absolute bottom-6 left-6 right-6 text-white drop-shadow">
              <h2 className="text-2xl font-bold">식단 기반 예측 서비스</h2>
              <p className="mt-2 text-sm text-white/90">
                저장된 메뉴와 환경 변수를 바탕으로 식수 인원을 예측합니다.
              </p>
            </div>
          </div>

          {/* 오른쪽: 로그인 카드 */}
          <div>
            <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                  로그인
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  관리자 계정으로 접속해주세요.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    아이디
                  </label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="admin"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    비밀번호
                  </label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="1234"
                  />
                </div>

                {err && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {err}
                  </p>
                )}

                <button
                  type="submit"
                  className="mt-2 w-full rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  로그인
                </button>
              </form>

              {/* 하단 작은 도움말 */}
              <div className="mt-6 text-center text-xs text-gray-400">
                © {new Date().getFullYear()} Meal-Fit. All rights reserved.
              </div>
            </div>

            {/* 모바일에서 이미지 대체 문구 */}
            <p className="mt-6 text-center text-sm text-gray-500 lg:hidden">
              더 나은 경험을 위해 큰 화면을 권장합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

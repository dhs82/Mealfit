// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { generateClient } from '@aws-amplify/api';
import { createMeal, updateMeal } from './graphql/mutations';
import { listMeals }  from './graphql/queries';

import Dashboard      from './pages/Dashboard';
import MealLogPage    from './pages/MealLogPage';
import Report         from './pages/Report';
import SavedMealsPage from './pages/SavedMealsPage';
import NavBar         from './components/NavBar';

// ⬇️ 추가: 간단 Auth 컨텍스트/가드
import { AuthProvider, useAuth } from './auth/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';

function AppInner() {
  const [menus, setMenus] = useState([]);
  const client = generateClient();
  const { authed } = useAuth();

  // 메뉴 조회 (로그인 되었을 때만)
  const fetchMenus = async () => {
    const res = await client.graphql({ query: listMeals, variables: {} });
    setMenus(res.data.listMeals.items);
  };

  // 저장 또는 업데이트
  const saveMenu = async ({ date, meals }) => {
    const mealsJson = JSON.stringify(meals);
    const existing = menus.find(item => item.date === date);

    try {
      if (existing) {
        await client.graphql({
          query: updateMeal,
          variables: { input: { id: existing.id, date, meals: mealsJson } }
        });
      } else {
        await client.graphql({
          query: createMeal,
          variables: { input: { date, meals: mealsJson } }
        });
      }
      fetchMenus();
    } catch(err) {
      console.error(err);
      alert(JSON.stringify(err, null, 2));
    }
  };

  useEffect(() => {
    if (authed) fetchMenus();
    else setMenus([]);
  }, [authed]);

  return (
    <Router>
      {/* 로그인 페이지에서는 NavBar 숨기고, 로그인 후엔 표시 */}
      {authed && <NavBar />}

      <Routes>
        {/* 공개 라우트 */}
        <Route path="/login" element={authed ? <Navigate to="/" replace /> : <Login />} />

        {/* 보호 라우트 그룹 */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Dashboard menus={menus} />} />
          <Route path="/meal-log" element={<MealLogPage menus={menus} onSave={saveMenu} />} />
          <Route path="/saved-meals" element={<SavedMealsPage menus={menus} />} />
          <Route path="/report" element={<Report menus={menus} />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={authed ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

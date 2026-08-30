import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "features/auth/AuthContext";
import PrivateRoute from "features/auth/components/PrivateRoute";
import Login from "features/auth/pages/Login";
import Dashboard from "features/dashboard/pages/Dashboard";
import MealLogPage from "features/meals/pages/MealLogPage";
import SavedMealsPage from "features/meals/pages/SavedMealsPage";
import Report from "features/reports/pages/Report";
import NavBar from "shared/layout/NavBar";

function AppRoutes() {
  const { authed } = useAuth();

  return (
    <BrowserRouter>
      {authed && <NavBar />}

      <Routes>
        <Route
          path="/login"
          element={authed ? <Navigate to="/" replace /> : <Login />}
        />

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/meal-log" element={<MealLogPage />} />
          <Route path="/saved-meals" element={<SavedMealsPage />} />
          <Route path="/report" element={<Report />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to={authed ? "/" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

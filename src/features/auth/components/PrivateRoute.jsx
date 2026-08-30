// src/features/auth/components/PrivateRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "features/auth/AuthContext";

export default function PrivateRoute() {
  const { authed } = useAuth();
  return authed ? <Outlet /> : <Navigate to="/login" replace />;
}

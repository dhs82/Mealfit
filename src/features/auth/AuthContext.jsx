// src/features/auth/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    // 새로고침해도 유지
    setAuthed(localStorage.getItem("mf_authed") === "1");
  }, []);

  const login = (id, pw) => {
    if (id === "admin" && pw === "1234") {
      setAuthed(true);
      localStorage.setItem("mf_authed", "1");
      return { ok: true };
    }
    return { ok: false, msg: "아이디 또는 비밀번호가 올바르지 않습니다." };
  };

  const logout = () => {
    setAuthed(false);
    localStorage.removeItem("mf_authed");
  };

  return (
    <AuthCtx.Provider value={{ authed, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

// src/shared/layout/NavBar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiMenu, HiX } from 'react-icons/hi';
import { useAuth } from 'features/auth/AuthContext';

const NavBar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useAuth();
  const nav = useNavigate();

  const linkClasses = (path) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
     ${currentPath === path ? 'bg-white text-gray-800' : 'text-white hover:bg-white hover:text-gray-800'}`;

  const handleLogout = () => {
    logout();
    nav('/login', { replace: true });
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-green-600 to-blue-600 shadow-lg fixed w-full top-0 left-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 로고 */}
            <div className="flex-shrink-0">
              <Link to="/" className="text-2xl font-extrabold text-white hover:text-gray-200">
                Meal-Fit
              </Link>
            </div>

            {/* 데스크탑 메뉴 */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <Link to="/" className={linkClasses('/')}>메인화면</Link>
              <Link to="/meal-log" className={linkClasses('/meal-log')}>급식일지 등록</Link>
              <Link to="/saved-meals" className={linkClasses('/saved-meals')}>직접예측</Link>
              <Link to="/report" className={linkClasses('/report')}>통계 리포트</Link>

              {/* 로그아웃 */}
              <button
                onClick={handleLogout}
                className="ml-4 px-3 py-2 rounded-md bg-white/20 text-white hover:bg-white/30 text-sm"
              >
                로그아웃
              </button>
            </div>

            {/* 모바일 메뉴 버튼 */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                {menuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        {menuOpen && (
          <div className="md:hidden bg-gradient-to-r from-green-600 to-blue-600 px-2 pt-2 pb-3 space-y-1">
            <Link to="/" onClick={() => setMenuOpen(false)} className={linkClasses('/') + ' block'}>
              메인화면
            </Link>
            <Link to="/meal-log" onClick={() => setMenuOpen(false)} className={linkClasses('/meal-log') + ' block'}>
              급식일지
            </Link>
            <Link to="/saved-meals" onClick={() => setMenuOpen(false)} className={linkClasses('/saved-meals') + ' block'}>
              직접예측
            </Link>
            <Link to="/report" onClick={() => setMenuOpen(false)} className={linkClasses('/report') + ' block'}>
              통계 리포트
            </Link>
            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="mt-2 w-full text-left px-3 py-2 rounded-md bg-white/20 text-white hover:bg-white/30 text-sm"
            >
              로그아웃
            </button>
          </div>
        )}
      </nav>
      {/* 네비게이션바 높이만큼 콘텐츠 아래로 밀기 */}
      <div className="h-16" />
    </>
  );
};

export default NavBar;

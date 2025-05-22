// src/components/NavBar.jsx
import { Link, useLocation } from "react-router-dom";

const NavBar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const linkClasses = (path) =>
    `text-sm md:text-base font-medium ${
      currentPath === path ? "font-bold text-white" : "text-gray-400"
    } hover:text-white transition`;

  return (
    <nav className="bg-black text-white py-4 px-8 flex justify-between items-center">
      <div className="text-xl font-bold tracking-tight">Meal-Fit</div>
      <div className="flex space-x-6">
        <Link to="/" className={linkClasses("/")}>
          오늘의 식수 인원 예측
        </Link>
        <Link to="/meal-log" className={linkClasses("/meal-log")}>
          급식 일지
        </Link>
        <Link to="/report" className={linkClasses("/report")}>
          통계 분석 리포트
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;

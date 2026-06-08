import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import AdminCoursesPage from "./pages/jsx/AdminCoursesPage";
import AdminDashboardPage from "./pages/jsx/AdminDashboardPage";
import AdminUIConfigPage from "./pages/jsx/AdminUIConfigPage";
import AdminUsersPage from "./pages/jsx/AdminUsersPage";

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang mặc định */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Dashboard */}
        <Route path="/admin" element={<AdminDashboardPage />} />

        {/* Quản lý khóa học */}
        <Route path="/admin/courses" element={<AdminCoursesPage />} />

        {/* Quản lý người dùng */}
        <Route path="/admin/users" element={<AdminUsersPage />} />

        {/* Cấu hình UI */}
        <Route path="/admin/ui-config" element={<AdminUIConfigPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
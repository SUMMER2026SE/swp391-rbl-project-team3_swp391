import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
    const token = localStorage.getItem("token");
    
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem("user") || "null");
    } catch (e) {
        console.error("Lỗi parse user từ localStorage:", e);
    }

    // 1. Nếu không có token, đá về trang login
    if (!token) {
        return <Navigate to="/auth" />; 
    }

    // 2. Đồng bộ điều kiện: Chấp nhận role là ADMIN hoặc roleId là 1 hoặc có chữ ADMIN trong role
    const isAdmin = user && (
        user.role === "ADMIN" || 
        user.roleId === 1 || 
        user.role?.toUpperCase()?.includes("ADMIN")
    );

    if (!isAdmin) {
        console.warn("⚠️ Truy cập bị từ chối: Không có quyền Admin", user);
        return <Navigate to="/auth" />;
    }

    // 3. Nếu hợp lệ thì cho phép hiển thị trang con bình thường
    return children;
}
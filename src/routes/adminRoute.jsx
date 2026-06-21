import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {

    const token = localStorage.getItem("token");

    const user = JSON.parse(localStorage.getItem("user"));

    if (!token) {
        return <Navigate to="/admin-login" />;
    }

    if (!user || user.role !== "ADMIN") {
        return <Navigate to="/auth" />;
    }

    return children;
}
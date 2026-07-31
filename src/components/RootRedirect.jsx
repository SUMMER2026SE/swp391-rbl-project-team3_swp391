import { Navigate } from "react-router-dom";
import HomePage from "../pages/jsx/HomePage";

export default function RootRedirect() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        return <HomePage />;
    }

    switch (user.role) {
        case "ADMIN":
            return <Navigate to="/admin" replace />;
        case "TEACHER":
            return <Navigate to="/teacher/dashboard" replace />;
        default:
            return <HomePage />;
    }
}
import axios from "axios";

const axiosClient = axios.create({
    baseURL: "http://localhost:8080/api",
    headers: {
        "Content-Type": "application/json"
    }
});

// Tự động gắn token + X-Student-Id (cho các API của Hải: entry-test, payment, AI)
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        const studentId = user?.id ?? user?.userId ?? user?.user_id;
        if (studentId) {
            config.headers["X-Student-Id"] = studentId;
        }
    } catch {
        // bỏ qua nếu user không hợp lệ
    }

    return config;
});

// auto logout nếu token hết hạn / invalid — KHÔNG tự điều hướng để tránh trang trắng.
// Chỉ xóa token; để từng trang tự xử lý việc yêu cầu đăng nhập.
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            // Chỉ chuyển sang trang đăng nhập nếu đang ở trang cần đăng nhập
            const path = window.location.pathname;
            const publicPaths = ["/", "/home", "/auth", "/courses", "/entry-test"];
            if (!publicPaths.some((p) => path === p || path.startsWith("/course/"))) {
                window.location.href = "/auth";
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
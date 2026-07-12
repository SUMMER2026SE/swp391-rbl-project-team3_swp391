import axios from "axios";

const axiosClient = axios.create({

    baseURL: "http://localhost:8080/api",
    headers: {
        "Content-Type": "application/json"
    }
});

// Tự động gắn token + X-Student-Id
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
}, (error) => {
    return Promise.reject(error);
});

// auto logout nếu token hết hạn / invalid
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // 🔥 PHÒNG VỆ AN TOÀN: Kiểm tra xem error và error.config có tồn tại hay không
        const urlStr = error?.config?.url || "";
        const isUrlTarget = urlStr.includes("/admin/");

        if (error?.response?.status === 401) {
            console.warn("⚠️ Phát hiện lỗi 401 Unauthorized tại URL:", urlStr);
            
            if (isUrlTarget) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                
                const path = window.location.pathname;
                const publicPaths = ["/", "/home", "/auth", "/courses", "/entry-test"];
                if (!publicPaths.some((p) => path === p || path.startsWith("/course/"))) {
                    window.location.href = "/auth";
                }
            }
        }
        
        // 🔥 BẮT BUỘC: Đảm bảo luôn ném lỗi ra ngoài để khối catch bên Form có thể bắt được và hủy trạng thái Loading!
        return Promise.reject(error);
    }
);

export default axiosClient;
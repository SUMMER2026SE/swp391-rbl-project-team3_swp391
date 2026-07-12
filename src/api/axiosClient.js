import axios from "axios";

const axiosClient = axios.create({
    baseURL: "http://localhost:8080/api",
    headers: {
        "Content-Type": "application/json"
    },
    withCredentials: true // 🔥 Quan trọng để gửi/nhận cookie httpOnly tự động
});

// Tự động gắn X-Student-Id (cho các API: entry-test, payment, AI)
axiosClient.interceptors.request.use((config) => {
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

// Cơ chế xếp hàng đợi (Queue) các request bị lỗi 401 chờ Refresh Token làm mới thành công
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Chặn lặp vô hạn ở api login hoặc refresh-token
            if (originalRequest.url.includes("/auth/login") || originalRequest.url.includes("/auth/refresh-token")) {
                localStorage.removeItem("user");
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        return axiosClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Gọi API refresh token, backend sẽ tự động đọc Cookie refreshToken và cấp accessToken mới vào Cookie
                await axios.post("http://localhost:8080/api/auth/refresh-token", {}, { withCredentials: true });
                isRefreshing = false;
                processQueue(null);
                return axiosClient(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                processQueue(refreshError);
                
                // Nếu refresh token cũng hết hạn -> Buộc đăng xuất
                localStorage.removeItem("user");
                const path = window.location.pathname;
                const publicPaths = ["/", "/home", "/auth", "/courses", "/entry-test"];
                if (!publicPaths.some((p) => path === p || path.startsWith("/course/"))) {
                    window.location.href = "/auth";
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
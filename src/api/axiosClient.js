import axios from "axios";

const axiosClient = axios.create({
    baseURL: "http://localhost:8080/api",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true
});


// Tự động gắn JWT vào mọi request
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);


// Xử lý lỗi response
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {

        if (error?.response?.status === 401) {

            console.warn("Token hết hạn hoặc không hợp lệ.");

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            const publicPaths = [
                "/",
                "/home",
                "/auth"
            ];

            const currentPath = window.location.pathname;

            if (!publicPaths.includes(currentPath)) {
                window.location.href = "/auth";
            }
        }

        return Promise.reject(error);
    }
);


export default axiosClient;
import axiosClient from "../api/axiosClient";

export const register = async (userData) => {
    const response = await axiosClient.post("/auth/register", userData);
    return response.data;
};

export const login = async (userData) => {
    const response = await axiosClient.post("/auth/login", userData);
    return response.data;
};

export const resendOtp = async (email) => {
    const response = await axiosClient.post("/auth/resend-otp", {
        email,
    });
    return response.data;
};

export const logout = async () => {
    try {
        const response = await axiosClient.post("/auth/logout");
        return response.data;
    } finally {
        // Dù API có lỗi vẫn xóa dữ liệu local
        localStorage.removeItem("user");
    }
};
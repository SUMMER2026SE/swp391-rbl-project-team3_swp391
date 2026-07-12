const API = "http://localhost:8080/api/auth";

export const register = async (userData) => {
    const response = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
    });

    return response.json();
};

export const login = async(userData) => {
    const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
    });

    return response.json();
}

export const logout = async () => {
    try {
        const response = await axiosClient.post("/auth/logout");
        return response.data;
    } finally {
        // Dù API có lỗi vẫn xóa dữ liệu local
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    }
};
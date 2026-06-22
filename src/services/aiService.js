import axiosClient from "../api/axiosClient";

// Cụm tính năng AI Interface (#26, #27, #28, #29, #30)
const aiService = {
    // #26 - Chatbot AI 24/7
    chat: (message) => axiosClient.post("/ai/chat", { message }).then((r) => r.data),

    // #27 - Biểu đồ năng lực + lộ trình thích ứng
    getAdaptivePath: () => axiosClient.get("/ai/adaptive-path").then((r) => r.data),

    // #28 - Quét lỗ hổng kiến thức
    getGapDiagnosis: () => axiosClient.get("/ai/gap-diagnosis").then((r) => r.data),

    // #29 - Dự đoán điểm thi
    getScoreForecast: () => axiosClient.get("/ai/score-forecast").then((r) => r.data),

    // #30 - Tư vấn ngành / trường
    getUniversityAdvising: (block) =>
        axiosClient
            .get("/ai/university-advising", { params: block ? { block } : {} })
            .then((r) => r.data),
};

export default aiService;

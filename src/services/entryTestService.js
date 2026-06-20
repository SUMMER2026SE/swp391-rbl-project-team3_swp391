import axiosClient from "../api/axiosClient";

// Tính năng #13 - Attempt Entry Test (luồng 2 bước)
const entryTestService = {
    // Danh sách đề kiểm tra đầu vào (chỉ metadata, không kèm câu hỏi)
    getQuizzes: () => axiosClient.get("/entry-test/quizzes").then((r) => r.data),

    // Bước 1: Bắt đầu bài kiểm tra → nhận về sessionsId + 20 câu hỏi ngẫu nhiên
    start: (quizId) =>
        axiosClient.post(`/entry-test/start/${quizId}`).then((r) => r.data),

    // Bước 2: Nộp bài → nhận đánh giá năng lực
    // answers = { [questionId]: "nội dung đáp án" }
    submit: (sessionsId, answers) =>
        axiosClient.post("/entry-test/submit", { sessionsId, answers }).then((r) => r.data),

    // Lấy lại kết quả đánh giá theo sessionsId
    getAssessment: (sessionsId) =>
        axiosClient.get(`/entry-test/assessment/${sessionsId}`).then((r) => r.data),
};

export default entryTestService;

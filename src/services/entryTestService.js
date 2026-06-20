import axiosClient from "../api/axiosClient";

// Tính năng #13 - Attempt Entry Test
const entryTestService = {
    // Danh sách đề kiểm tra đầu vào (kèm câu hỏi để làm bài inline)
    getQuizzes: () => axiosClient.get("/entry-test/quizzes").then((r) => r.data),

    // Nộp bài: answers = { [questionId]: "nội dung đáp án" }
    submit: (quizId, answers) =>
        axiosClient.post("/entry-test/submit", { quizId, answers }).then((r) => r.data),

    // Lấy lại kết quả đánh giá theo attemptId
    getAssessment: (attemptId) =>
        axiosClient.get(`/entry-test/assessment/${attemptId}`).then((r) => r.data),
};

export default entryTestService;

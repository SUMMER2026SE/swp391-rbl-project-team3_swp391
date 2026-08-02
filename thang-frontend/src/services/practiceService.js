import axiosClient from "../api/axiosClient";

// ENGINE THI THỐNG NHẤT: Kiểm tra đầu vào (20 câu) + Luyện đề & Thi thử (25 câu)
// axiosClient tự đính kèm Authorization: Bearer <token> + X-Student-Id
const practiceService = {
    // Danh sách đề thi. type = ENTRY_TEST | PRACTICE | MOCK_EXAM (bỏ trống = tất cả)
    getQuizzes: (type, subject) =>
        axiosClient
            .get("/practice/quizzes", { params: { ...(type && { type }), ...(subject && { subject }) } })
            .then((r) => r.data),

    // Bắt đầu thi → { attemptId, quizType, remainingSeconds, questions: [20|25 câu random] }
    start: (quizId) =>
        axiosClient.post(`/practice/start/${quizId}`).then((r) => r.data),

    // Resume đề đang làm dở (F5 giữa chừng) — backend trả 400 ALREADY_SUBMITTED nếu đã nộp
    getAttempt: (attemptId) =>
        axiosClient.get(`/practice/attempt/${attemptId}`).then((r) => r.data),

    // Nộp bài. answers = { [questionId]: optionId }
    // → { score, percentage, level, correctCount, details: [từng câu + explanation] }
    submit: (attemptId, answers) =>
        axiosClient.post("/practice/submit", { attemptId, answers }).then((r) => r.data),

    // Xem lại kết quả một lượt đã nộp
    getResult: (attemptId) =>
        axiosClient.get(`/practice/result/${attemptId}`).then((r) => r.data),

    // Lịch sử các lượt thi đã nộp (mới nhất trước)
    getHistory: () => axiosClient.get("/practice/history").then((r) => r.data),
};

/**
 * 🤖 AI Phân tích Lỗ hổng kiến thức (Gap Analysis).
 * Phân tích cục bộ từ chi tiết bài làm: nhóm câu sai/bỏ trống theo Topic,
 * chấm mức độ hổng và sinh lời khuyên lộ trình. Chạy tức thì, không phụ
 * thuộc quota AI bên ngoài (trang /ai/gap-diagnosis là bản chẩn đoán sâu).
 *
 * @param {Array<{topic?: string, correct: boolean, answered: boolean}>} items
 * @returns {{weakTopics: Array, strongTopics: Array, skipped: number,
 *            accuracy: number, summary: string, recommendations: string[]}}
 */
export function buildGapAnalysis(items = []) {
    const byTopic = new Map();
    let skipped = 0;

    for (const it of items) {
        const topic = it.topic || "Kiến thức khác";
        if (!byTopic.has(topic)) byTopic.set(topic, { topic, total: 0, wrong: 0 });
        const t = byTopic.get(topic);
        t.total += 1;
        if (!it.correct) t.wrong += 1;
        if (!it.answered) skipped += 1;
    }

    const topics = [...byTopic.values()].map((t) => ({
        ...t,
        accuracy: Math.round(((t.total - t.wrong) / t.total) * 100),
    }));

    // Lỗ hổng = topic có câu sai, xếp theo mức độ nghiêm trọng (sai nhiều + tỉ lệ thấp trước)
    const weakTopics = topics
        .filter((t) => t.wrong > 0)
        .sort((a, b) => a.accuracy - b.accuracy || b.wrong - a.wrong);
    const strongTopics = topics.filter((t) => t.wrong === 0 && t.total >= 2);

    const total = items.length || 1;
    const correct = items.filter((i) => i.correct).length;
    const accuracy = Math.round((correct / total) * 100);

    // Nhận xét tổng quan
    let summary;
    if (accuracy >= 80)
        summary = `Xuất sắc! Bạn đạt độ chính xác ${accuracy}%. Nền tảng kiến thức rất vững, chỉ cần tinh chỉnh vài điểm nhỏ dưới đây là hoàn hảo.`;
    else if (accuracy >= 65)
        summary = `Khá tốt! Độ chính xác ${accuracy}%. Bạn đã nắm phần lớn kiến thức, nhưng vẫn còn ${weakTopics.length} chủ đề cần củng cố để bứt phá điểm số.`;
    else if (accuracy >= 50)
        summary = `Trung bình — độ chính xác ${accuracy}%. AI phát hiện ${weakTopics.length} lỗ hổng kiến thức cần lấp ngay, ưu tiên theo thứ tự bên dưới.`;
    else
        summary = `Bạn đang hổng kiến thức khá nhiều (độ chính xác chỉ ${accuracy}%). Đừng nản — hãy học lại từ gốc theo lộ trình AI đề xuất bên dưới, ưu tiên từng chủ đề một.`;

    // Lộ trình đề xuất
    const recommendations = weakTopics.slice(0, 4).map((t) => {
        const severity = t.accuracy < 40 ? "hổng nặng" : t.accuracy < 70 ? "chưa vững" : "cần tinh chỉnh";
        return `Phần «${t.topic}» đang ${severity} (sai ${t.wrong}/${t.total} câu, đúng ${t.accuracy}%) — hãy xem lại lý thuyết, đọc kỹ lời giải các câu sai ở dưới rồi luyện lại đề mới.`;
    });
    if (skipped >= 3)
        recommendations.push(
            `Bạn bỏ trống ${skipped} câu — cần rèn tốc độ làm bài: luyện thêm đề bấm giờ và học mẹo loại trừ đáp án nhanh.`
        );
    if (recommendations.length === 0)
        recommendations.push("Không phát hiện lỗ hổng nào đáng kể. Hãy thử sức với đề Thi thử để kiểm chứng năng lực ở áp lực thời gian thật!");

    return { weakTopics, strongTopics, skipped, accuracy, summary, recommendations };
}

export default practiceService;

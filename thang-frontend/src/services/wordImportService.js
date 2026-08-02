import axiosClient from "../api/axiosClient";

/**
 * =====================================================================
 * wordImportService.js – Frontend service cho tính năng Import đề Word
 * =====================================================================
 * Giao tiếp với backend:
 *   POST /api/word-import/preview  → Phân tích file, trả preview (không lưu DB)
 *   POST /api/word-import/confirm  → Phân tích + lưu vào DB
 * =====================================================================
 */

const wordImportService = {
    /**
     * BƯỚC 1 – Preview: Parse file Word, trả kết quả phân tích.
     * KHÔNG lưu vào DB. Dùng để cho giáo viên xem trước.
     *
     * @param {File} file - File .docx chọn từ input
     * @returns {Promise<{
     *   totalQuestions: number,
     *   multipleChoiceCount: number,
     *   trueFalseCount: number,
     *   shortAnswerCount: number,
     *   previewQuestions: Array,
     *   warnings: string[]
     * }>}
     */
    preview: async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axiosClient.post("/word-import/preview", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    /**
     * BƯỚC 2 – Confirm: Parse file Word lần 2 và LƯU vào DB.
     *
     * @param {File}   file       - File .docx gốc (cùng file lúc preview)
     * @param {Object} metadata   - Thông tin đề thi
     * @param {string} metadata.quizTitle  - Tên đề thi
     * @param {string} metadata.subject    - Môn học (math/physics/...)
     * @param {number} metadata.duration   - Thời gian làm bài (phút)
     * @param {number} [metadata.courseId] - ID khóa học (optional)
     * @returns {Promise<{
     *   quizId: number,
     *   quizTitle: string,
     *   saved: boolean,
     *   totalQuestions: number,
     *   multipleChoiceCount: number,
     *   trueFalseCount: number,
     *   shortAnswerCount: number
     * }>}
     */
    confirm: async (file, metadata) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("quizTitle", metadata.quizTitle);
        formData.append("subject", metadata.subject || "general");
        formData.append("duration", String(metadata.duration || 90));

        if (metadata.courseId) {
            formData.append("courseId", String(metadata.courseId));
        }

        const response = await axiosClient.post("/word-import/confirm", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },
};

export default wordImportService;

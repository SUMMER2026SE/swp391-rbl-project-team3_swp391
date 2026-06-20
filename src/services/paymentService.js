import axiosClient from "../api/axiosClient";

// Tính năng #14 - Purchase Packages
const paymentService = {
    // Tạo giao dịch + lấy URL checkout (sandbox)
    createPayment: (courseId) =>
        axiosClient.post("/payments/create", { courseId }).then((r) => r.data),

    // Xác nhận kết quả thanh toán (callback giả lập từ cổng)
    confirmPayment: (transactionRef, success) =>
        axiosClient
            .post("/payments/confirm", { transactionRef, success })
            .then((r) => r.data),

    // Lịch sử giao dịch
    getHistory: () => axiosClient.get("/payments/history").then((r) => r.data),

    // Khóa học đã sở hữu
    getEnrollments: () => axiosClient.get("/payments/enrollments").then((r) => r.data),

    // Kiểm tra đã sở hữu khóa học chưa
    checkEnrolled: (courseId) =>
        axiosClient.get(`/payments/enrollments/${courseId}/check`).then((r) => r.data),

    // ── ZaloPay ──────────────────────────────────────────────
    // Tạo đơn ZaloPay -> trả về { order_url, transactionRef }
    createZaloPay: (courseId) =>
        axiosClient.post("/payments/zalopay/create", { courseId }).then((r) => r.data),

    // Đồng bộ trạng thái đơn ZaloPay (dùng ở trang trở về) -> { status: PAID|FAILED|PENDING }
    syncZaloPay: (transactionRef) =>
        axiosClient.get(`/payments/zalopay/status/${transactionRef}`).then((r) => r.data),

    // ── Chuyển khoản ngân hàng (VietQR) ──────────────────────
    createBank: (courseId) =>
        axiosClient.post("/payments/bank/create", { courseId }).then((r) => r.data),
    bankStatus: (ref) =>
        axiosClient.get(`/payments/bank/status/${ref}`).then((r) => r.data),
    confirmBank: (ref) =>
        axiosClient.post(`/payments/bank/confirm/${ref}`).then((r) => r.data),
};

export default paymentService;

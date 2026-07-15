import axiosClient from "../api/axiosClient";

// const paymentService = {

//     // Mua khóa học (MAIN FLOW)
//     purchaseCourse: (courseId) =>
//         axiosClient.post("/payments/purchase", {
//             courseId,
//             paymentMethod: "BANK"
//         }).then(r => r.data),

//     // Lịch sử thanh toán
//     getHistory: () =>
//         axiosClient.get("/payments/history").then(r => r.data),

//     // confirm payment (nếu có gateway sau này)
//     confirmPayment: (transactionCode) =>
//         axiosClient.post(`/payments/confirm/${transactionCode}`)
//             .then(r => r.data),

//     createBank: (courseId) =>
//         axiosClient.post("/payments/bank/create", {
//             courseId,
//             paymentMethod: "BANK"
//         }).then(r => r.data),

//     confirmBank: (ref) =>
//         axiosClient.post(`/payments/bank/confirm/${ref}`)
//             .then(r => r.data),
//     bankStatus: (transactionCode) =>
//             axiosClient
//                 .get(`/payments/status/${transactionCode}`)
//                 .then(res => res.data),
// };

const paymentService = {
    purchaseCourse: (courseId) =>
        axiosClient.post("/payments/purchase", {
            courseId,
            paymentMethod: "BANK"
        }).then(r => r.data),


    getHistory: () =>
        axiosClient.get("/payments/history")
        .then(r => r.data),


    createBank: (courseId) =>
        axiosClient.post("/payments/bank/create", {
            courseId,
            paymentMethod:"BANK"
        }).then(r=>r.data),


    confirmPayment:(transactionCode)=>
        axiosClient.post(`/payments/confirm/${transactionCode}`)
        .then(r=>r.data),


    waitingConfirm: (transactionCode) =>
        axiosClient.post(
            `/payments/waiting/${transactionCode}`
        )
        .then(r => r.data),

        // Admin lấy danh sách chờ xác nhận
    getPendingPayments: () =>
        axiosClient
            .get("/payments/admin/pending")
            .then(r => r.data),


    // Admin xác nhận thanh toán
    adminConfirmPayment: (transactionCode) =>
        axiosClient
            .post(`/payments/admin/confirm/${transactionCode}`)
            .then(r => r.data),
};

const getAdminPaymentDashboard = async () => {
    const response = await axiosClient.get(
        "/payments/admin/dashboard"
    );

    return response.data;
};

export default paymentService;
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import paymentService from "../../services/paymentService";
import "../css/CheckoutPage.css";

const formatVnd = (v) =>
    v == null ? "—" : Number(v).toLocaleString("vi-VN") + "đ";

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { courseId } = useParams();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [owned, setOwned] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            alert("Vui lòng đăng nhập để mua khóa học.");
            navigate("/auth", { state: { mode: "login" } });
            return;
        }

        // Lấy thông tin khóa học để hiển thị (dùng endpoint công khai /courses)
        axiosClient
            .get("/courses")
            .then((res) => {
                const found = (res.data || []).find((c) => String(c.id) === String(courseId));
                setCourse(found || { id: courseId, title: `Khóa học #${courseId}`, price: 0 });
            })
            .catch(() => setCourse({ id: courseId, title: `Khóa học #${courseId}`, price: 0 }))
            .finally(() => setLoading(false));

        // Kiểm tra đã sở hữu chưa
        paymentService
            .checkEnrolled(courseId)
            .then((d) => setOwned(!!d.enrolled))
            .catch(() => {});
    }, [courseId, navigate]);

    const handlePay = async () => {
        try {
            setProcessing(true);
            const payment = await paymentService.createPayment(Number(courseId));
            // Mô phỏng chuyển hướng sang cổng thanh toán
            navigate(`/payment/return?transactionRef=${payment.transactionRef}`, {
                state: {
                    amount: payment.amount,
                    courseTitle: payment.courseTitle,
                    courseId: payment.courseId,
                },
            });
        } catch (e) {
            alert("Không thể tạo giao dịch: " + (e.response?.data?.message || e.message));
            setProcessing(false);
        }
    };

    const handleZaloPay = async () => {
        try {
            setProcessing(true);
            const order = await paymentService.createZaloPay(Number(courseId));
            if (order.order_url) {
                // Chuyển thẳng sang cổng ZaloPay thật
                window.location.href = order.order_url;
            } else {
                alert("ZaloPay không trả về liên kết thanh toán.");
                setProcessing(false);
            }
        } catch (e) {
            alert("Không thể tạo đơn ZaloPay: " + (e.response?.data?.message || e.message));
            setProcessing(false);
        }
    };

    if (loading) return <div className="checkout-status">Đang tải thông tin thanh toán...</div>;

    return (
        <div className="checkout-page">
            <span className="back-btn" onClick={() => navigate(-1)}>← Quay lại</span>
            <h1 className="checkout-title">Thanh toán khóa học</h1>

            {owned ? (
                <div className="checkout-card owned">
                    <h2>✅ Bạn đã sở hữu khóa học này</h2>
                    <p>Vào học ngay để tiếp tục lộ trình của bạn.</p>
                    <button className="checkout-pay-btn" onClick={() => navigate(`/learn/${courseId}`)}>
                        Vào học ngay
                    </button>
                </div>
            ) : (
                <div className="checkout-card">
                    <div className="checkout-summary">
                        <h2>Thông tin đơn hàng</h2>
                        <div className="summary-row">
                            <span>Khóa học</span>
                            <strong>{course.title}</strong>
                        </div>
                        <div className="summary-row">
                            <span>Giảng viên</span>
                            <span>{course.teacherName || "PrepAce"}</span>
                        </div>
                        <div className="summary-row total">
                            <span>Tổng thanh toán</span>
                            <strong>{course.price ? formatVnd(course.price) : "Miễn phí"}</strong>
                        </div>
                    </div>

                    <div className="checkout-method">
                        <h3>Phương thức thanh toán</h3>
                        <label className="method-option selected">
                            <input type="radio" checked readOnly />
                            <span>🏦 Chuyển khoản ngân hàng (Quét mã VietQR)</span>
                        </label>
                        <p className="method-note">
                            Bạn sẽ nhận mã QR đã điền sẵn số tiền & nội dung. Chuyển khoản xong hệ thống
                            tự động mở khóa khóa học.
                        </p>
                    </div>

                    <button
                        className="checkout-pay-btn"
                        disabled={processing}
                        onClick={() => navigate(`/pay/bank/${courseId}`)}
                        style={{ background: "#0068ff" }}
                    >
                        🏦 Thanh toán qua chuyển khoản (VietQR)
                    </button>

                    <button
                        className="checkout-pay-btn"
                        disabled={processing}
                        onClick={handleZaloPay}
                        style={{ background: "#0d6efd", marginTop: 10, opacity: 0.92 }}
                    >
                        {processing ? "Đang xử lý..." : "💳 Thanh toán qua ZaloPay"}
                    </button>
                </div>
            )}
        </div>
    );
}

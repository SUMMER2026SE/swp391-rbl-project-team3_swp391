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

        // Lấy course info
        axiosClient
            .get("/courses")
            .then((res) => {
                const found = (res.data || []).find(
                    (c) => String(c.courseId || c.id) === String(courseId)
                );

                setCourse(
                    found || {
                        courseId,
                        title: `Khóa học #${courseId}`,
                        price: 0,
                    }
                );
            })
            .catch(() =>
                setCourse({
                    courseId,
                    title: `Khóa học #${courseId}`,
                    price: 0,
                })
            )
            .finally(() => setLoading(false));

        // ❌ BỎ checkEnrolled (API không tồn tại)
        setOwned(false);
    }, [courseId, navigate]);

    const handlePay = async () => {
        try {
            setProcessing(true);

            const res = await paymentService.createBank(courseId);

            navigate(`/payment/bank/${courseId}`, {
                state: res
            });

        } catch (e) {
            alert(e.response?.data?.message || e.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading)
        return (
            <div className="checkout-status">
                Đang tải thông tin thanh toán...
            </div>
        );

    return (
        <div className="checkout-page">
            <span className="back-btn" onClick={() => navigate(-1)}>
                ← Quay lại
            </span>

            <h1 className="checkout-title">Thanh toán khóa học</h1>

            {owned ? (
                <div className="checkout-card owned">
                    <h2>✅ Bạn đã sở hữu khóa học này</h2>
                    <button
                        className="checkout-pay-btn"
                        onClick={() => navigate(`/learn/${courseId}`)}
                    >
                        Vào học ngay
                    </button>
                </div>
            ) : (
                <div className="checkout-card">
                    {/* SUMMARY */}
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
                            <strong>
                                {course.price
                                    ? formatVnd(course.price)
                                    : "Miễn phí"}
                            </strong>
                        </div>
                    </div>

                    {/* PAYMENT INFO */}
                    <div className="checkout-method">
                        <h3>Phương thức thanh toán</h3>

                        <label className="method-option selected">
                            <input type="radio" checked readOnly />
                            <span>
                                💳 Thanh toán hệ thống
                            </span>
                        </label>

                        <p className="method-note">
                            Hệ thống sẽ tự động xử lý thanh toán và mở khóa khóa học.
                        </p>
                    </div>

                    {/* BUTTON */}
                    <button
                        className="checkout-pay-btn primary-gradient"
                        disabled={processing}
                        onClick={handlePay}
                    >
                        <i
                            className="fa-solid fa-credit-card"
                            style={{ marginRight: "8px" }}
                        ></i>

                        {processing ? "Đang xử lý..." : "Thanh toán ngay"}
                    </button>
                </div>
            )}
        </div>
    );
}
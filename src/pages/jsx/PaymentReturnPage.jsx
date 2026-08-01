import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import paymentService from "../../services/paymentService";
import "../css/PaymentReturnPage.css";

const formatVnd = (v) =>
    v == null ? "—" : Number(v).toLocaleString("vi-VN") + "đ";

export default function PaymentReturnPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [params] = useSearchParams();

    const transactionRef = params.get("transactionRef");
    const provider = params.get("provider"); // 'zalopay' khi trở về từ ZaloPay
    const amount = location.state?.amount ?? params.get("amount");
    const courseTitle = location.state?.courseTitle;
    const courseId = location.state?.courseId;

    // PayOS parameters
    const orderCode = params.get("orderCode");
    const isCancel = params.get("cancel") === "true";
    const payosStatus = params.get("status");

    const [result, setResult] = useState(null); // 'PAID' | 'FAILED'
    const [processing, setProcessing] = useState(false);
    const [syncing, setSyncing] = useState(provider === "zalopay");

    // Xử lý PayOS return
    useEffect(() => {
        if (orderCode) {
            if (isCancel || payosStatus === "CANCELLED") {
                setResult("FAILED");
            } else {
                setResult("PAID");
            }
        }
    }, [orderCode, isCancel, payosStatus]);

    // Trở về từ ZaloPay: tự động đồng bộ trạng thái đơn
    useEffect(() => {
        if (provider !== "zalopay" || !transactionRef) return;
        paymentService
            .syncZaloPay(transactionRef)
            .then((d) => setResult(d.status === "PAID" ? "PAID" : d.status === "FAILED" ? "FAILED" : null))
            .catch(() => setResult("FAILED"))
            .finally(() => setSyncing(false));
    }, [provider, transactionRef]);

    if (syncing) {
        return (
            <div className="pay-page">
                <div className="pay-card gateway">
                    <div className="pay-gateway-head">
                        <span className="pay-logo">ZaloPay</span>
                        <span className="pay-sandbox">Đang xác nhận</span>
                    </div>
                    <h2>Đang kiểm tra kết quả thanh toán ZaloPay...</h2>
                    <div className="pay-ref">Mã giao dịch: {transactionRef}</div>
                </div>
            </div>
        );
    }

    const confirm = async (success) => {
        if (!transactionRef) {
            alert("Thiếu mã giao dịch.");
            return;
        }
        try {
            setProcessing(true);
            const res = await paymentService.confirmPayment(transactionRef, success);
            setResult(res.status);
        } catch (e) {
            alert("Lỗi xác nhận giao dịch: " + (e.response?.data?.message || e.message));
        } finally {
            setProcessing(false);
        }
    };

    // Màn hình kết quả
    if (result) {
        const paid = result === "PAID";
        return (
            <div className="pay-page">
                <div className={`pay-card result ${paid ? "ok" : "fail"}`}>
                    <div className="pay-icon">{paid ? "✅" : "❌"}</div>
                    <h1>{paid ? "Thanh toán thành công!" : "Thanh toán thất bại"}</h1>
                    <p>
                        {paid
                            ? "Khóa học đã được kích hoạt vào tài khoản của bạn."
                            : "Giao dịch đã bị hủy hoặc không thành công."}
                    </p>
                    <div className="pay-ref">Mã giao dịch: {transactionRef}</div>
                    <div className="pay-actions">
                        {paid ? (
                            <>
                                <button className="pay-primary" onClick={() => navigate(courseId ? `/learn/${courseId}` : "/courses")}>
                                    Vào học ngay
                                </button>
                                <button className="pay-secondary" onClick={() => navigate("/home")}>Về trang chủ</button>
                            </>
                        ) : (
                            <button className="pay-primary" onClick={() => navigate(-1)}>Thử lại</button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Màn hình giả lập cổng thanh toán
    return (
        <div className="pay-page">
            <div className="pay-card gateway">
                <div className="pay-gateway-head">
                    <span className="pay-logo">PrepAce Pay</span>
                    <span className="pay-sandbox">SANDBOX</span>
                </div>
                <h2>Xác nhận thanh toán</h2>
                {courseTitle && <p className="pay-course">{courseTitle}</p>}
                <div className="pay-amount">{formatVnd(amount)}</div>
                <div className="pay-ref">Mã giao dịch: {transactionRef}</div>

                <div className="pay-actions vertical">
                    <button className="pay-primary" disabled={processing} onClick={() => confirm(true)}>
                        {processing ? "Đang xử lý..." : "Xác nhận & Thanh toán"}
                    </button>
                    <button className="pay-secondary" disabled={processing} onClick={() => confirm(false)}>
                        Hủy giao dịch
                    </button>
                </div>
                <p className="pay-note">Đây là cổng thanh toán giả lập phục vụ demo, không phát sinh giao dịch thật.</p>
            </div>
        </div>
    );
}

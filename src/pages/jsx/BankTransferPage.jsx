import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import paymentService from "../../services/paymentService";

const formatVnd = (v) => (v == null ? "—" : Number(v).toLocaleString("vi-VN") + "đ");

export default function BankTransferPage() {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paid, setPaid] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const pollRef = useRef(null);

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            alert("Vui lòng đăng nhập để thanh toán.");
            navigate("/auth", { state: { mode: "login" } });
            return;
        }
        paymentService
            .createBank(Number(courseId))
            .then((d) => setOrder(d))
            .catch((e) => setError(e.response?.data?.message || "Không tạo được đơn thanh toán."))
            .finally(() => setLoading(false));
    }, [courseId]);

    // Poll trạng thái mỗi 4s — khi tiền vào (webhook) sẽ tự chuyển vào khóa học
    useEffect(() => {
        if (!order?.transactionRef || paid) return;
        pollRef.current = setInterval(async () => {
            try {
                const s = await paymentService.bankStatus(order.transactionRef);
                if (s.status === "PAID") {
                    clearInterval(pollRef.current);
                    setPaid(true);
                    setTimeout(() => navigate(`/learn/${order.courseId}`), 1500);
                }
            } catch { /* bỏ qua */ }
        }, 4000);
        return () => clearInterval(pollRef.current);
    }, [order, paid]);

    const handleManualConfirm = async () => {
        try {
            setConfirming(true);
            await paymentService.confirmBank(order.transactionRef);
            setPaid(true);
            setTimeout(() => navigate(`/learn/${order.courseId}`), 1200);
        } catch (e) {
            alert("Xác nhận thất bại: " + (e.response?.data?.message || e.message));
            setConfirming(false);
        }
    };

    if (loading) return <div style={st.status}>Đang tạo mã thanh toán...</div>;
    if (error) return <div style={{ ...st.status, color: "#ef4444" }}>{error}</div>;

    if (paid) {
        return (
            <div style={st.page}>
                <div style={st.card}>
                    <div style={{ fontSize: 56 }}>✅</div>
                    <h1 style={{ color: "#10b981" }}>Thanh toán thành công!</h1>
                    <p>Khóa học đã được kích hoạt. Đang chuyển vào lớp học...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={st.page}>
            <div style={st.card}>
                <span style={st.back} onClick={() => navigate(-1)}>← Quay lại</span>
                <h1 style={st.title}>Chuyển khoản ngân hàng</h1>
                <p style={st.course}>{order.courseTitle}</p>
                <div style={st.amount}>{formatVnd(order.amount)}</div>

                <img src={order.qrUrl} alt="VietQR" style={st.qr} />

                <div style={st.info}>
                    <Row label="Ngân hàng" value={`VietQR (BIN ${order.bankBin})`} />
                    <Row label="Số tài khoản" value={order.accountNo} copy />
                    <Row label="Chủ tài khoản" value={order.accountName} />
                    <Row label="Số tiền" value={formatVnd(order.amount)} />
                    <Row label="Nội dung CK" value={order.content} copy highlight />
                </div>

                <p style={st.note}>
                    Quét mã QR bằng app ngân hàng (đã điền sẵn số tiền & nội dung). Sau khi chuyển
                    khoản thành công, hệ thống sẽ <b>tự động</b> mở khóa khóa học cho bạn.
                </p>

                <div style={st.spinner}>⏳ Đang chờ thanh toán...</div>

                <button style={st.confirmBtn} disabled={confirming} onClick={handleManualConfirm}>
                    {confirming ? "Đang xác nhận..." : "Tôi đã chuyển khoản (xác nhận thủ công)"}
                </button>
            </div>
        </div>
    );
}

function Row({ label, value, copy, highlight }) {
    return (
        <div style={st.row}>
            <span style={st.rowLabel}>{label}</span>
            <span style={{ ...st.rowValue, ...(highlight ? { color: "#0068ff", fontWeight: 700 } : {}) }}>
                {value}
                {copy && (
                    <button style={st.copyBtn} onClick={() => navigator.clipboard?.writeText(value)}>Sao chép</button>
                )}
            </span>
        </div>
    );
}

const st = {
    page: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "32px 16px", background: "#f1f5f9" },
    card: { background: "#fff", borderRadius: 16, padding: 28, maxWidth: 460, width: "100%", boxShadow: "0 8px 30px rgba(15,23,42,.08)", textAlign: "center" },
    back: { display: "inline-block", color: "#64748b", cursor: "pointer", marginBottom: 8, float: "left" },
    title: { fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "8px 0 4px" },
    course: { color: "#475569", margin: "0 0 4px" },
    amount: { fontSize: 30, fontWeight: 800, color: "#0068ff", margin: "8px 0 16px" },
    qr: { width: 240, height: 240, objectFit: "contain", border: "1px solid #e2e8f0", borderRadius: 12, padding: 6, background: "#fff" },
    info: { textAlign: "left", marginTop: 16, borderTop: "1px dashed #e2e8f0", paddingTop: 12 },
    row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", gap: 8 },
    rowLabel: { color: "#64748b", fontSize: 14 },
    rowValue: { color: "#0f172a", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 },
    copyBtn: { fontSize: 11, padding: "2px 8px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#f8fafc", cursor: "pointer" },
    note: { fontSize: 13, color: "#64748b", marginTop: 14, lineHeight: 1.5 },
    spinner: { marginTop: 12, color: "#f59e0b", fontWeight: 600 },
    confirmBtn: { marginTop: 16, width: "100%", padding: "12px", border: "none", borderRadius: 10, background: "#10b981", color: "#fff", fontWeight: 700, cursor: "pointer" },
    status: { padding: 40, textAlign: "center", color: "#475569" },
};

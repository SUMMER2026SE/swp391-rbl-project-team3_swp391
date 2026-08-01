import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import paymentService from "../../services/paymentService";
import axiosClient from "../../api/axiosClient";

const formatVnd = (v) => (v == null ? "—" : Number(v).toLocaleString("vi-VN") + "đ");

export default function BankTransferPage() {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [order, setOrder] = useState(null);
    const [creatingOrder, setCreatingOrder] = useState(true);
    const [qrLoading, setQrLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paid, setPaid] = useState(false);
    const pollRef = useRef(null);

    // Lưu log thanh toán khóa học thành công
    const logPaymentSuccess = async (courseTitle, amount) => {
        try {
            const userObj = JSON.parse(localStorage.getItem("user") || "{}");
            const userId = userObj?.id || userObj?.userId || 0;
            if (userId > 0) {
                await axiosClient.post(`/admin/users/${userId}/activity`, {
                    action: `Thanh toán thành công khóa học: [${courseTitle}], số tiền: ${formatVnd(amount)} qua cổng ngân hàng SePay`
                });
            }
        } catch (logErr) {
            console.error("Lỗi ghi nhận log thanh toán:", logErr);
        }
    };

    // Tạo đơn hàng thanh toán khi vào trang
    useEffect(() => {
        if (!localStorage.getItem("token")) {
            alert("Vui lòng đăng nhập để thanh toán.");
            navigate("/auth", { state: { mode: "login" } });
            return;
        }
        paymentService
            .createBank(Number(courseId))
            .then((d) => {
                if (d.checkoutUrl) {
                    window.location.href = d.checkoutUrl;
                } else {
                    setOrder(d);
                    setQrLoading(true);
                    setCreatingOrder(false);
                }
            })
            .catch((e) => {
                setError(
                    e.response?.data?.message ||
                    "Không tạo được đơn thanh toán."
                );
                setCreatingOrder(false);
            });
    }, [courseId]);

    // Cơ chế quét tự động (Polling) 4 giây một lần
    useEffect(() => {
        if (!order?.transactionCode || paid) return;
        pollRef.current = setInterval(async () => {
            try {
                const s = await paymentService.paymentStatus(order.transactionCode);
                if (s.paymentStatus === "SUCCESS") {
                    clearInterval(pollRef.current);
                    await logPaymentSuccess(
                        order.courseTitle,
                        order.amount
                    );
                    setPaid(true);
                    setTimeout(() => {
                        navigate(`/learn/${order.courseId}`);
                    }, 1500);
                }
            } catch (err) {
                console.error("Lỗi khi kiểm tra trạng thái thanh toán tự động:", err);
            }
        }, 4000);
        return () => clearInterval(pollRef.current);
    }, [order, paid]);

    if (creatingOrder) {
        return (
            <div style={st.statusPage}>
                <div style={st.spinner}></div>
                <p style={{ marginTop: 16 }}>Đang tạo giao dịch thanh toán...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={st.statusPage}>
                <div style={{ fontSize: 48 }}>⚠️</div>
                <p style={{ color: "#ef4444", fontWeight: 600, marginTop: 12 }}>{error}</p>
                <button style={st.backBtn} onClick={() => navigate(-1)}>Quay lại</button>
            </div>
        );
    }

    if (paid) {
        return (
            <div style={st.page}>
                <div style={st.card}>
                    <div style={{ fontSize: 64, animation: "bounce 1s infinite" }}>✅</div>
                    <h1 style={{ color: "#10b981", margin: "16px 0 8px", fontSize: 24, fontWeight: 800 }}>
                        Thanh toán thành công!
                    </h1>
                    <p style={{ color: "#64748b" }}>
                        Khóa học đã được kích hoạt. Đang chuyển hướng vào lớp học...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={st.page}>
            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0.3; }
                    50% { top: 100%; opacity: 1; }
                    100% { top: 0%; opacity: 0.3; }
                }
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.6; transform: scale(0.98); }
                    50% { opacity: 1; transform: scale(1.02); }
                }
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
            `}</style>

            <span style={st.backLink} onClick={() => navigate(-1)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Quay lại
            </span>

            <div style={st.card}>
                <h1 style={st.title}>Chuyển khoản ngân hàng</h1>
                <p style={st.courseName}>{order.courseTitle}</p>
                <div style={st.priceBadge}>{formatVnd(order.amount)}</div>

                {/* Khung QR Hiện Đại có dòng quét */}
                <div style={st.qrContainer}>
                    {order?.qrUrl && (
                        <div style={st.qrWrapper}>
                            {qrLoading && <div style={st.qrPlaceholder}>Đang tải mã QR...</div>}
                            <img
                                src={order.qrUrl}
                                alt="VietQR TPBank"
                                style={{
                                    ...st.qrImage,
                                    opacity: qrLoading ? 0.3 : 1
                                }}
                                onLoad={() => setQrLoading(false)}
                                onError={() => setQrLoading(false)}
                            />
                            {!qrLoading && <div style={st.scanLine}></div>}
                        </div>
                    )}
                    <p style={st.qrInstruction}>
                        Quét mã QR bằng ứng dụng ngân hàng của bạn<br/>
                        (Hệ thống tự điền sẵn số tiền & nội dung chuyển khoản)
                    </p>
                </div>

                {/* Thông tin chuyển khoản chi tiết */}
                <div style={st.infoList}>
                    <Row label="Ngân hàng" value="TPBank" />
                    <Row label="Số tài khoản" value="10001805232" copy />
                    <Row label="Chủ tài khoản" value="NGUYEN VAN HAI" />
                    <Row label="Số tiền" value={formatVnd(order?.amount)} />
                    <Row label="Nội dung CK" value={order?.transferContent} copy highlight />
                </div>

                {/* Loading kiểm tra tự động */}
                <div style={st.statusBox}>
                    <div style={st.pulseCircle}></div>
                    <div style={{ textAlign: "left" }}>
                        <div style={st.statusText}>Đang chờ thanh toán...</div>
                        <div style={st.statusSubtext}>
                            Hệ thống tự động quét giao dịch sau mỗi 4 giây. Hãy giữ nguyên trang này khi chuyển tiền.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Subcomponent hiển thị thông tin kèm tính năng copy thông minh
function Row({ label, value, copy, highlight }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={st.row}>
            <span style={st.rowLabel}>{label}</span>
            <span style={{ ...st.rowValue, ...(highlight ? st.highlightText : {}) }}>
                {value}
                {copy && (
                    <button
                        style={copied ? st.copiedButton : st.copyButton}
                        onClick={handleCopy}
                    >
                        {copied ? "✓ Đã chép" : "Sao chép"}
                    </button>
                )}
            </span>
        </div>
    );
}

// Cấu hình CSS CSS-in-JS cao cấp, mượt mà
const st = {
    page: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 20px",
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        fontFamily: "'Inter', sans-serif"
    },
    card: {
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px)",
        borderRadius: "24px",
        padding: "36px",
        maxWidth: "480px",
        width: "100%",
        boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(15, 23, 42, 0.04)",
        textAlign: "center",
        boxSizing: "border-box"
    },
    backLink: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        color: "#64748b",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        marginBottom: "16px",
        transition: "color 0.2s ease",
        alignSelf: "center",
    },
    title: {
        fontSize: "20px",
        fontWeight: "800",
        color: "#0f172a",
        margin: "0 0 6px 0"
    },
    courseName: {
        fontSize: "14px",
        color: "#64748b",
        fontWeight: "500",
        margin: "0 0 16px 0"
    },
    priceBadge: {
        display: "inline-block",
        fontSize: "30px",
        fontWeight: "900",
        background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        margin: "0 0 24px 0"
    },
    qrContainer: {
        background: "#f8fafc",
        borderRadius: "18px",
        padding: "20px",
        border: "1px solid #e2e8f0",
        marginBottom: "24px"
    },
    qrWrapper: {
        position: "relative",
        width: "220px",
        height: "220px",
        margin: "0 auto 14px",
        background: "#ffffff",
        borderRadius: "12px",
        padding: "10px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },
    qrPlaceholder: {
        fontSize: "13px",
        color: "#94a3b8"
    },
    qrImage: {
        width: "100%",
        height: "100%",
        objectFit: "contain",
        transition: "opacity 0.3s ease"
    },
    scanLine: {
        position: "absolute",
        left: 0,
        width: "100%",
        height: "3px",
        background: "linear-gradient(90deg, rgba(37,99,235,0) 0%, rgba(37,99,235,1) 50%, rgba(37,99,235,0) 100%)",
        animation: "scan 3.5s linear infinite"
    },
    qrInstruction: {
        fontSize: "13px",
        color: "#64748b",
        lineHeight: "1.5",
        fontWeight: "500",
        margin: 0
    },
    infoList: {
        textAlign: "left",
        borderTop: "1px dashed #e2e8f0",
        paddingTop: "16px",
        marginBottom: "24px"
    },
    row: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid #f8fafc"
    },
    rowLabel: {
        color: "#64748b",
        fontSize: "13px",
        fontWeight: "500"
    },
    rowValue: {
        color: "#0f172a",
        fontWeight: "600",
        fontSize: "13px",
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    highlightText: {
        color: "#2563eb",
        fontWeight: "700"
    },
    copyButton: {
        fontSize: "11px",
        padding: "3px 8px",
        border: "1px solid #cbd5e1",
        borderRadius: "6px",
        background: "#ffffff",
        color: "#475569",
        cursor: "pointer",
        fontWeight: "600",
        transition: "all 0.15s ease",
        outline: "none",
        userSelect: "none"
    },
    copiedButton: {
        fontSize: "11px",
        padding: "3px 8px",
        border: "1px solid #10b981",
        borderRadius: "6px",
        background: "#ecfdf5",
        color: "#10b981",
        cursor: "default",
        fontWeight: "600",
        userSelect: "none"
    },
    statusBox: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "#eff6ff",
        borderRadius: "14px",
        padding: "14px 16px",
        border: "1px solid #dbeafe"
    },
    pulseCircle: {
        width: "12px",
        height: "12px",
        background: "#2563eb",
        borderRadius: "50%",
        flexShrink: 0,
        boxShadow: "0 0 0 4px rgba(37, 99, 235, 0.2)",
        animation: "pulse-glow 2s infinite ease-in-out"
    },
    statusText: {
        fontSize: "13px",
        fontWeight: "700",
        color: "#1e40af",
        marginBottom: "2px"
    },
    statusSubtext: {
        fontSize: "11px",
        color: "#2563eb",
        lineHeight: "1.4",
        fontWeight: "500"
    },
    statusPage: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#f8fafc",
        fontFamily: "'Inter', sans-serif",
        color: "#64748b"
    },
    spinner: {
        width: "36px",
        height: "36px",
        border: "3px solid #e2e8f0",
        borderTopColor: "#2563eb",
        borderRadius: "50%",
        animation: "rotate 1s linear infinite"
    },
    backBtn: {
        marginTop: "16px",
        padding: "8px 16px",
        borderRadius: "8px",
        border: "none",
        background: "#0f172a",
        color: "#ffffff",
        fontWeight: "600",
        cursor: "pointer"
    }
};
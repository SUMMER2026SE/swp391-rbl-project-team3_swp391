import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import paymentService from "../../services/paymentService";
import axiosClient from "../../api/axiosClient"; // 🔥 ĐÃ THÊM IMPORT ĐỂ GỌI LOG

const formatVnd = (v) => (v == null ? "—" : Number(v).toLocaleString("vi-VN") + "đ");

export default function BankTransferPage() {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [order, setOrder] = useState(null);
    const [creatingOrder, setCreatingOrder] = useState(true);
    const [qrLoading, setQrLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paid, setPaid] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [waitingConfirm,setWaitingConfirm]=useState(false);
    const pollRef = useRef(null);

    const handleWaitingConfirm = async()=>{
        try{
            setConfirming(true);
            await paymentService.waitingConfirm(
                order.transactionCode
            );
            alert(
                "Đã gửi yêu cầu xác nhận.\nAdmin sẽ kiểm tra và mở khóa khóa học."
            );
        }
        catch(e){
            alert(
                e.response?.data?.message ||
                "Không gửi được yêu cầu xác nhận."
            );
        }
        finally{
            setConfirming(false);
        }
    };

    // 🔥 HÀM HELPER: Lưu log thanh toán khóa học
    const logPaymentSuccess = async (courseTitle, amount) => {
        try {
            const userObj = JSON.parse(localStorage.getItem("user") || "{}");
            const userId = userObj?.id || userObj?.userId || 0;
            if (userId > 0) {
                await axiosClient.post(`/admin/users/${userId}/activity`, {
                    action: `Thanh toán thành công khóa học: [${courseTitle}], số tiền: ${formatVnd(amount)} qua cổng ngân hàng SePay`
                });
            }
        } catch (logErr) { console.error("Lỗi ghi nhận log thanh toán:", logErr); }
    };

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            alert("Vui lòng đăng nhập để thanh toán.");
            navigate("/auth", { state: { mode: "login" } });
            return;
        }
        paymentService
            .createBank(Number(courseId))
            .then((d) => {
                console.log("PAYMENT RESPONSE:", d);

                setOrder(d);
                setQrLoading(true);
            })
            .catch((e) => {
                setError(
                    e.response?.data?.message ||
                    "Không tạo được đơn thanh toán."
                );
            })
            .finally(() => {
                setCreatingOrder(false);
            });
    }, [courseId]);

    // Poll trạng thái mỗi 4s — khi tiền vào (webhook) tự động
    // useEffect(() => {
    //     if (!order?.transactionCode || paid) return;
    //     pollRef.current = setInterval(async () => {
    //         try {
    //             const s = await paymentService.paymentStatus(order.transactionCode);
    //             if (s.paymentStatus === "SUCCESS") {

    //                 clearInterval(pollRef.current);

    //                 await logPaymentSuccess(
    //                     order.courseTitle,
    //                     order.amount
    //                 );

    //                 setPaid(true);

    //                 setTimeout(() => {
    //                     navigate(`/learn/${order.courseId}`);
    //                 },1500);
    //             }
    //         } catch { /* bỏ qua */ }
    //     }, 4000);
    //     return () => clearInterval(pollRef.current);
    // }, [order, paid]);

    // Xác nhận thủ công bằng tay
    // const handleManualConfirm = async () => {
    //     try {
    //         setConfirming(true);
    //         // Chỉ kiểm tra trạng thái, KHÔNG xác nhận
    //         const s = await paymentService.bankStatus(order.transactionCode);
    //         if (s.paymentStatus === "SUCCESS") {
    //             clearInterval(pollRef.current);

    //             await logPaymentSuccess(order.courseTitle, order.amount);

    //             setPaid(true);

    //             setTimeout(() => {
    //                 navigate(`/learn/${order.courseId}`);
    //             }, 1500);
    //         } else {
    //             alert(
    //                 "Hệ thống chưa ghi nhận giao dịch.\n\n" +
    //                 "Nếu bạn vừa chuyển khoản, vui lòng đợi khoảng 5-10 giây rồi thử lại."
    //             );
    //         }
    //     } catch (e) {
    //         alert(
    //             e.response?.data?.message ||
    //             "Không kiểm tra được trạng thái thanh toán."
    //         );
    //     } finally {
    //         setConfirming(false);
    //     }
    // };
    

    if (creatingOrder) {
        return (
            <div style={st.status}>
                Đang tạo giao dịch thanh toán...
            </div>
        );
    }
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
            <span style={st.back} onClick={() => navigate(-1)}>← Quay lại</span>
            <div style={st.card}>
                <h1 style={st.title}>Chuyển khoản ngân hàng</h1>
                <p style={st.course}>{order.courseTitle}</p>
                <div style={st.amount}>{formatVnd(order.amount)}</div>

                <div style={{ textAlign: "center", margin: "20px 0 24px" }}>
                    {order?.qrUrl && (
                        <>
                            {qrLoading && (
                                <p>
                                    Đang tải mã QR...
                                </p>
                            )}

                            <img
                                src={order.qrUrl}
                                alt="VietQR"
                                style={{
                                    ...st.qr,
                                    opacity: qrLoading ? 0.5 : 1
                                }}
                                onLoad={() => setQrLoading(false)}
                                onError={() => {
                                    setQrLoading(false);
                                }}
                            />
                        </>
                    )}
                    <p style={{ marginTop: 12, fontSize: 14, color: "#64748b", fontWeight: 500 }}>
                        Quét mã QR bằng app ngân hàng<br/>
                        (Đã điền sẵn số tiền & nội dung chuyển khoản)
                    </p>
                </div>

                <div style={st.info}>
                    <Row label="Ngân hàng" value="VietQR (VCB)" />
                    <Row label="Số tài khoản" value="9703391695" copy />
                    <Row label="Chủ tài khoản" value="NGUYEN CUU THANG" />
                    <Row label="Số tiền" value={formatVnd(order?.amount)} />
                    <Row label="Nội dung CK" value={order?.content} copy highlight />
                </div>

                <p style={st.note}>
                    Quét mã QR bằng app ngân hàng (đã điền sẵn số tiền & nội dung). Sau khi chuyển
                    khoản thành công, hệ thống sẽ <b>tự động</b> mở khóa khóa học cho bạn.
                </p>

                {
                    waitingConfirm ?

                    <div style={{
                        ...st.spinner,
                        color:"#2563eb"
                    }}>
                        ⏳ Đang chờ Admin xác nhận thanh toán...
                    </div>

                    :

                    <div style={st.spinner}>
                        ⏳ Đang chờ bạn chuyển khoản...
                    </div>

                    }

                <button
                    disabled={confirming || waitingConfirm}
                    onClick={handleWaitingConfirm}
                    style={{
                        marginTop:16,
                        width:"100%",
                        padding:"12px",
                        border:"none",
                        borderRadius:"10px",
                        background:
                            waitingConfirm
                            ? "#94a3b8"
                            : "#10b981",
                        color:"#fff",
                        fontWeight:700,
                        cursor:
                            waitingConfirm || confirming
                            ? "not-allowed"
                            : "pointer"
                    }}
                >
                {
                    confirming
                    ?
                    "Đang gửi xác nhận..."
                    :
                    waitingConfirm
                    ?
                    "⏳ Đang chờ Admin xác nhận"

                    :
                    "Tôi đã chuyển khoản"
                }
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
import { useLocation, useNavigate } from "react-router-dom";
import paymentService from "../../services/paymentService";

export default function BankPaymentPage() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const handleConfirm = async () => {
        try {
            await paymentService.confirmBank(state.transactionCode);
            alert("Thanh toán thành công!");
            navigate(`/learn/${state.courseId}`);
        } catch (e) {
            alert("Xác nhận thất bại");
        }
    };

    return (
        <div style={{ textAlign: "center", padding: 30 }}>
            <h2>{state.courseTitle}</h2>

            <img src={state.qrUrl} width="300" />

            <p>Số tiền: {state.amount}</p>
            <p>Nội dung: {state.content}</p>

            <button onClick={handleConfirm}>
                Tôi đã chuyển khoản
            </button>
        </div>
    );
}
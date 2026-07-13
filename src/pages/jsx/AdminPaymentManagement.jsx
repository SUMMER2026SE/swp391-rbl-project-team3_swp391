import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import "../css/AdminPaymentManagement.css";

export default function AdminPaymentManagement() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(null);

    const formatMoney = (amount) => {
        return Number(amount || 0).toLocaleString("vi-VN") + "đ";
    };

    const fetchPendingPayments = async () => {
        try {
            setLoading(true);

            const res = await axiosClient.get(
                "/payments/admin/pending"
            );

            setPayments(res.data);

        } catch (err) {
            console.error(
                "Load pending payment error:",
                err
            );

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const handleConfirm = async (transactionCode) => {
        const confirm = window.confirm(
            `Bạn có chắc muốn xác nhận giao dịch ${transactionCode}?\n\nSau khi xác nhận học viên sẽ được mở khóa học.`
        );
        if (!confirm) return;
        try {
            setConfirming(transactionCode);
            await axiosClient.post(
                `/payments/admin/confirm/${transactionCode}`
            );
            alert(
                "Xác nhận thanh toán thành công!"
            );
            await fetchPendingPayments();
        } catch (err) {
            console.error(
                "Confirm payment error:",
                err
            );

            alert(
                err.response?.data?.message ||
                "Xác nhận thanh toán thất bại"
            );
        } finally {
            setConfirming(null);
        }
    };

    const handleCancel = async(transactionCode)=>{
        if(!window.confirm(
            "Bạn chắc chắn muốn hủy giao dịch này?"
        )){
            return;
        }

        try{
            await axiosClient.post(
                `/payments/admin/cancel/${transactionCode}`
            );
            alert(
                "Đã hủy giao dịch."
            );

            fetchPendingPayments();

        }catch(err){
            alert(
                err.response?.data?.message ||
                "Hủy giao dịch thất bại"
            );
        }
    };

    if (loading) {
        return (
            <div className="payment-loading">
                Đang tải giao dịch...
            </div>
        );
    }


    return (
        <div className="admin-payment-container">
            <h1>
                Quản lý thanh toán
            </h1>

            <p className="subtitle">
                Danh sách giao dịch đang chờ xác nhận
            </p>
            {
                payments.length === 0 ?
                (
                    <div className="empty">
                        Không có giao dịch chờ xử lý
                    </div>
                )
                :
                (
                <table className="payment-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Khóa học</th>
                            <th>Số tiền</th>
                            <th>Mã giao dịch</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            payments.map(payment => (
                                <tr key={payment.paymentId}>
                                    <td>
                                        {payment.studentName}
                                    </td>
                                    <td>
                                        {payment.courseTitle}
                                    </td>
                                    <td>
                                        {formatMoney(payment.amount)}
                                    </td>
                                    <td className="txn">
                                        {payment.transactionCode}
                                    </td>
                                    <td>
                                        <span className="pending">
                                            {payment.paymentStatus}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-group">
                                            <button
                                                className="confirm-btn"
                                                disabled={
                                                    confirming===payment.transactionCode
                                                }
                                                onClick={()=>
                                                    handleConfirm(
                                                        payment.transactionCode
                                                    )
                                                }
                                            >
                                                Xác nhận
                                            </button>
                                            <button
                                                className="cancel-btn"
                                                onClick={()=>
                                                    handleCancel(
                                                        payment.transactionCode
                                                    )
                                                }
                                            >
                                                Hủy
                                            </button>
                                            </div>
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
                )
            }
        </div>
    );
}
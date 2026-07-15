import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import "../css/AdminRevenueDashboard.css";


export default function AdminRevenueDashboard() {

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    const formatMoney = (amount) => {
        return Number(amount || 0)
            .toLocaleString("vi-VN") + "đ";
    };


    const formatDate = (date) => {

        if (!date) return "-";

        return new Date(date)
            .toLocaleString("vi-VN");
    };



    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const response =
                await axiosClient.get(
                    "/payments/admin/dashboard"
                );
            setDashboard(response.data);
        } catch (err) {
            console.error(
                "Load revenue dashboard error:",
                err
            );
            setError(
                err.response?.data?.message ||
                "Không thể tải dữ liệu doanh thu."
            );
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchDashboard();
    }, []);
    if (loading) {

        return (
            <div className="revenue-loading">
                Đang tải dữ liệu doanh thu...
            </div>
        );

    }



    if (error) {

        return (
            <div className="revenue-error">
                ⚠️ {error}
            </div>
        );

    }



    return (

        <div className="revenue-container">


            <div className="revenue-header">

                <h1>
                    Doanh thu hệ thống
                </h1>

                <p>
                    Thống kê tình hình thanh toán khóa học
                </p>

            </div>




            {/* SUMMARY CARDS */}

            <div className="revenue-summary">


                <div className="revenue-card">

                    <div className="card-title">
                        Tổng doanh thu
                    </div>

                    <div className="card-value money">

                        {
                            formatMoney(
                                dashboard.totalRevenue
                            )
                        }

                    </div>

                </div>




                <div className="revenue-card">

                    <div className="card-title">
                        Giao dịch thành công
                    </div>


                    <div className="card-value">

                        {
                            dashboard.totalTransactions
                            || 0
                        }

                        <span>
                            {" "}đơn
                        </span>

                    </div>

                </div>


            </div>





            {/* RECENT PAYMENT */}

            <div className="recent-section">


                <h2>
                    Người mua gần đây
                </h2>



                {
                    !dashboard.recentPayments ||
                    dashboard.recentPayments.length === 0

                    ?

                    (
                        <div className="empty">
                            Chưa có giao dịch thành công
                        </div>
                    )


                    :


                    (

                    <table className="recent-table">


                        <thead>

                            <tr>

                                <th>
                                    Học viên
                                </th>


                                <th>
                                    Khóa học
                                </th>


                                <th>
                                    Số tiền
                                </th>


                                <th>
                                    Trạng thái
                                </th>


                                <th>
                                    Thời gian
                                </th>


                            </tr>


                        </thead>



                        <tbody>


                        {
                            dashboard.recentPayments.map(
                                payment => (

                                <tr
                                    key={
                                        payment.paymentId
                                    }
                                >

                                    <td>
                                        {
                                            payment.studentName
                                            ||
                                            "Unknown"
                                        }
                                    </td>


                                    <td>
                                        {
                                            payment.courseTitle
                                            ||
                                            "Unknown"
                                        }
                                    </td>



                                    <td className="amount">

                                        {
                                            formatMoney(
                                                payment.amount
                                            )
                                        }

                                    </td>



                                    <td>

                                        <span className="success-badge">

                                            {
                                                payment.paymentStatus
                                            }

                                        </span>

                                    </td>



                                    <td>

                                        {
                                            formatDate(
                                                payment.paidAt
                                            )
                                        }

                                    </td>



                                </tr>


                            ))

                        }


                        </tbody>


                    </table>

                    )

                }



            </div>



        </div>

    );
}
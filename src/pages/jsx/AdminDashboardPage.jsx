import { useNavigate } from "react-router-dom";
import "../css/AdminDashboardPage.css";
import React, { useState, useEffect } from "react"; // <--- Thêm useEffect vào đây

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
        alert("⚠️ Bạn chưa đăng nhập quyền Admin!");
        navigate("/");
        return;
    }

    const userObj = JSON.parse(storedUser);
    if (userObj.role !== "ADMIN" && userObj.roleId !== 1) {
        alert("❌ Bạn không có quyền truy cập vào phân hệ Quản trị!");
        navigate("/home");
        return;
    }
}, [navigate]);
    const [activeMenu, setActiveMenu] = useState("dashboard");

    // Mock dữ liệu KPI
    const kpiData = {
        revenue: "125,500,000đ",
        students: "3,250",
        activeCourses: "15",
        conversionRate: "4.8%"
    };

    // Mock dữ liệu biểu đồ doanh thu các tháng (để vẽ bằng CSS)
    const chartData = [
        { month: "T1", value: 40 },
        { month: "T2", value: 65 },
        { month: "T3", value: 45 },
        { month: "T4", value: 80 },
        { month: "T5", value: 60 },
        { month: "T6", value: 100 }, // Tháng hiện tại cao nhất
    ];

    // Mock dữ liệu giao dịch gần đây (từ bảng Payments)
    const recentTransactions = [
        { id: "TX1001", student: "Phạm Đức Anh", course: "Toán học 12", amount: "599,000đ", status: "Thành công", time: "10 phút trước" },
        { id: "TX1002", student: "Võ Minh Trí", course: "Vật lý 12", amount: "499,000đ", status: "Thành công", time: "1 giờ trước" },
        { id: "TX1003", student: "Nguyễn Thanh Đạt", course: "Tiếng Anh", amount: "399,000đ", status: "Chờ xử lý", time: "2 giờ trước" },
        { id: "TX1004", student: "Lê Thị Lan", course: "Toán học 12", amount: "599,000đ", status: "Thành công", time: "5 giờ trước" },
    ];

    const handleLogout = () => {
        console.log("Before:", localStorage.getItem("user"));
        
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        console.log("After:", localStorage.getItem("user"));

        navigate("/auth");
    };

    return (
        <div className="admin-layout">
            {/* SIDEBAR */}
            <aside className="admin-sidebar">
                <div className="admin-brand" onClick={() => navigate("/home")}>
                    <h2>PrepAce <span>Admin</span></h2>
                </div>
                <ul className="admin-menu">
    <li className={activeMenu === "dashboard" ? "active" : ""} onClick={() => navigate("/admin")}>📊 Dashboard</li>
    <li className={activeMenu === "courses" ? "active" : ""} onClick={() => navigate("/admin/courses")}>📚 Quản lý khóa học</li>
    <li className={activeMenu === "users" ? "active" : ""} onClick={() => navigate("/admin/users")}>👥 Quản lý người dùng</li>
    <li className={activeMenu === "question-bank" ? "active" : ""} onClick={() => navigate("/admin/question-bank")}>📝 Quản lý thư viện đề</li>
    <li className={activeMenu === "ui" ? "active" : ""} onClick={() => navigate("/admin/ui-config")}>🎨 Cấu hình UI</li>
    <li className={activeMenu === "sepay" ? "active" : ""} onClick={() => navigate("/admin/sepay-guide")}>💳 Cấu hình SePay</li>
</ul>
                <div className="admin-logout">
                    <button onClick={handleLogout}>Đăng xuất</button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="admin-main">
                <header className="admin-header">
                    <div className="header-title">
                        <h1>Tổng quan doanh thu</h1>
                        <p>Theo dõi dòng tiền và sự phát triển của nền tảng.</p>
                    </div>
                    <div className="admin-profile">
                        <img src="https://i.pravatar.cc/100?img=11" alt="Admin" />
                        <span>System Admin</span>
                    </div>
                </header>

                <div className="admin-content">
                    {/* KPI CARDS */}
                    <div className="kpi-grid">
                        <div className="kpi-card revenue">
                            <h3>Tổng doanh thu (Tháng)</h3>
                            <div className="kpi-value">{kpiData.revenue}</div>
                            <div className="kpi-trend positive">↑ +15.2% so với tháng trước</div>
                        </div>
                        <div className="kpi-card">
                            <h3>Học viên mới</h3>
                            <div className="kpi-value">{kpiData.students}</div>
                            <div className="kpi-trend positive">↑ +5.8%</div>
                        </div>
                        <div className="kpi-card">
                            <h3>Khóa học đang bán</h3>
                            <div className="kpi-value">{kpiData.activeCourses}</div>
                            <div className="kpi-trend neutral">- Không đổi</div>
                        </div>
                        <div className="kpi-card">
                            <h3>Tỷ lệ chuyển đổi</h3>
                            <div className="kpi-value">{kpiData.conversionRate}</div>
                            <div className="kpi-trend positive">↑ +1.2%</div>
                        </div>
                    </div>

                    <div className="dashboard-bottom">
                        {/* CHART SECTION */}
                        <div className="chart-section">
                            <div className="section-head">
                                <h3>Biểu đồ tăng trưởng doanh thu (2026)</h3>
                                <select className="chart-filter">
                                    <option>6 Tháng qua</option>
                                    <option>Năm nay</option>
                                </select>
                            </div>
                            <div className="css-bar-chart">
                                {chartData.map((data, index) => (
                                    <div className="bar-wrapper" key={index}>
                                        <div className="bar-bg">
                                            <div className="bar-fill" style={{ height: `${data.value}%` }}></div>
                                        </div>
                                        <span className="bar-label">{data.month}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RECENT TRANSACTIONS */}
                        <div className="transactions-section">
                            <div className="section-head">
                                <h3>Giao dịch gần đây</h3>
                                <span className="view-more">Xem tất cả</span>
                            </div>
                            <div className="table-responsive">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Mã GD</th>
                                            <th>Học viên</th>
                                            <th>Khóa học</th>
                                            <th>Số tiền</th>
                                            <th>Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentTransactions.map((tx, idx) => (
                                            <tr key={idx}>
                                                <td>{tx.id}</td>
                                                <td>
                                                    <div className="tx-student">
                                                        <strong>{tx.student}</strong>
                                                        <span>{tx.time}</span>
                                                    </div>
                                                </td>
                                                <td>{tx.course}</td>
                                                <td className="tx-amount">{tx.amount}</td>
                                                <td>
                                                    <span className={`status-badge ${tx.status === 'Thành công' ? 'success' : 'pending'}`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
import { useNavigate } from "react-router-dom";
import "../css/AdminDashboardPage.css";
import React, { useState, useEffect } from "react"; 
import axiosClient from "../../api/axiosClient";

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const [activeMenu, setActiveMenu] = useState("dashboard");
    
    const [stats, setStats] = useState({
        revenue: "0đ",
        students: "0",
        activeCourses: "0",
        conversionRate: "0.0%",
        revenueTrend: "↑ +0% so với tháng trước",
        studentTrend: "↑ +0%",
        courseTrend: "- Không đổi",
        conversionTrend: "— Chưa có chuyển đổi"
    });
    
    const [transactions, setTransactions] = useState([]); 
    const [chartData, setChartData] = useState([]); 
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                setLoading(true);
                const res = await axiosClient.get('/admin/dashboard/stats');
                
                if (res.data) {
                    const formattedRevenue = new Intl.NumberFormat('vi-VN', { 
                        style: 'currency', 
                        currency: 'VND' 
                    }).format(res.data.revenue || 0);

                    setStats({
                        revenue: formattedRevenue,
                        students: String(res.data.totalStudents || 0),
                        activeCourses: String(res.data.totalCourses || 0),
                        conversionRate: res.data.conversionRate || "0.0%",
                        revenueTrend: res.data.revenueTrend || "↑ +0%",
                        studentTrend: res.data.studentTrend || "↑ +0%",
                        courseTrend: res.data.courseTrend || "- Không đổi",
                        conversionTrend: res.data.conversionTrend || "— Chưa có chuyển đổi"
                    });

                    if (res.data.recentTransactions) {
                        setTransactions(res.data.recentTransactions);
                    }

                    if (res.data.chartData) {
                        setChartData(res.data.chartData);
                    }
                }
            } catch (err) {
                console.error("Lỗi kết nối API Dashboard:", err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchDashboardStats();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
    };

    return (
        <div className="admin-layout">
            {/* SIDEBAR */}
            <aside className="admin-sidebar">
                <div className="admin-brand" onClick={() => navigate("/admin")}>
                    <h2>PrepAce <span>Admin</span></h2>
                </div>
                <ul className="admin-menu">
                    <li className={activeMenu === "dashboard" ? "active" : ""} onClick={() => navigate("/admin")}>📊 Dashboard</li>
                    <li className={activeMenu === "courses" ? "active" : ""} onClick={() => navigate("/admin/courses")}>📚 Quản lý khóa học</li>
                    <li className={activeMenu === "users" ? "active" : ""} onClick={() => navigate("/admin/users")}>👥 Quản lý người dùng</li>
                    <li className={activeMenu === "question-bank" ? "active" : ""} onClick={() => navigate("/admin/question-bank")}>📝 Quản lý thư viện đề</li>
                    <li className={activeMenu === "violations" ? "active" : ""} onClick={() => navigate("/admin/violations")}>🚨 Quản lý vi phạm</li>
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
                        <p>Theo dõi dòng tiền và sự phát triển của nền tảng thực tế.</p>
                    </div>
                    <div className="admin-profile">
                        <img src="https://i.pravatar.cc/100?img=11" alt="Admin" />
                        <span>System Admin</span>
                    </div>
                </header>

                <div className="admin-content">
                    {/* KPI CARDS ĐÃ ĐỒNG BỘ TOÀN BỘ TREND ĐỘNG */}
                    <div className="kpi-grid">
                        <div className="kpi-card revenue">
                            <h3>Tổng doanh thu (Tháng)</h3>
                            <div className="kpi-value">{loading ? "Đang nạp..." : stats.revenue}</div>
                            <div className="kpi-trend positive">{stats.revenueTrend}</div>
                        </div>
                        <div className="kpi-card">
                            <h3>Học viên mới</h3>
                            <div className="kpi-value">{loading ? "..." : stats.students}</div>
                            <div className="kpi-trend positive">{stats.studentTrend}</div>
                        </div>
                        <div className="kpi-card">
                            <h3>Khóa học đang bán</h3>
                            <div className="kpi-value">{loading ? "..." : stats.activeCourses}</div>
                            <div className={`kpi-trend ${stats.courseTrend.includes('↓') ? 'negative' : stats.courseTrend.includes('↑') ? 'positive' : 'neutral'}`}>
                                {stats.courseTrend}
                            </div>
                        </div>
                        <div className="kpi-card">
                            <h3>Tỷ lệ chuyển đổi</h3>
                            <div className="kpi-value">{stats.conversionRate}</div>
                            <div className="kpi-trend positive">{stats.conversionTrend}</div>
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
                                {chartData.length === 0 ? (
                                    <p style={{ color: '#64748b', fontSize: '14px', padding: '20px' }}>Chưa có dữ liệu biểu đồ</p>
                                ) : (
                                    chartData.map((data, index) => (
                                        <div className="bar-wrapper" key={index}>
                                            <div className="bar-bg">
                                                <div className="bar-fill" style={{ height: `${data.value}%` }}></div>
                                            </div>
                                            <span className="bar-label">{data.month}</span>
                                        </div>
                                    ))
                                )}
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
                                        {transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                                                    Chưa có lịch sử giao dịch nào dưới hệ thống Database.
                                                </td>
                                            </tr>
                                        ) : (
                                            transactions.map((tx, idx) => (
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
                                            ))
                                        )}
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
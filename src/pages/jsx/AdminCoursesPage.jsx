import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/AdminUsersPage.css";

export default function AdminCoursesPage() {
    const navigate = useNavigate();
    const [activeMenu] = useState("courses");
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // 1. KHỞI TẠO STATE: Giữ nguyên dữ liệu mẫu để demo
    const [courses, setCourses] = useState([
        { id: 1, title: "Mastering Mathematics 12", teacher: "Nguyễn Minh Quân", price: "599,000đ", status: "PUBLISHED" },
        { id: 2, title: "Physics Problem Solving", teacher: "Trần Bảo Châu", price: "499,000đ", status: "PUBLISHED" },
        { id: 4, title: "Tuyệt đỉnh Casio", teacher: "Nguyễn Minh Quân", price: "299,000đ", status: "PENDING" }, 
    ]);

    useEffect(() => {
    // 1. KIỂM TRA QUYỀN ADMIN TRƯỚC
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

    // 2. NẾU HỢP LỆ THÌ MỚI GỌI API LẤY COURSES
    const fetchAllCourses = async () => {
        try {
            const response = await axiosClient.get("/admin/courses");
            console.log("📡 DỮ LIỆU THỰC TẾ TỪ BACKEND TRẢ VỀ:", response.data);

            if (response.data && Array.isArray(response.data)) {
                setCourses(response.data);
            }
        } catch (error) {
            console.error("❌ LỖI GỌI API BACKEND (Có thể do Token/URL):", error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            alert("⚠️ Bạn chưa đăng nhập quyền Admin!");
            navigate("/");
            return;
        }
    };

        const userObj = JSON.parse(storedUser);
        if (userObj.role !== "ADMIN" && userObj.roleId !== 1) {
            alert("❌ Bạn không có quyền truy cập vào phân hệ Quản trị!");
            navigate("/home");
            return;
        }

        fetchAllCourses();
    }, [navigate]);

    const handleApproveCourse = async (courseId) => {
        if (!courseId || !window.confirm(`Bạn có chắc chắn muốn duyệt khóa học #${courseId}?`)) return;
        try {
            await axiosClient.patch(`/admin/courses/${courseId}/status`, { status: "PUBLISHED" });
            setCourses(prev => prev.map(c => (c.id === courseId || c.courseId === courseId) ? { ...c, status: "PUBLISHED" } : c));
            alert(`✅ Khóa học #${courseId} đã được duyệt và xuất bản!`);
        } catch (error) {
            alert("Lỗi kết nối hoặc không thể duyệt khóa học này.");
        }
    };

    const handleRejectCourse = async (courseId) => {
        if (!courseId) return;
        const reason = prompt("Nhập lý do yêu cầu giảng viên chỉnh sửa lại:");
        if (!reason) return;

        try {
            await axiosClient.patch(`/admin/courses/${courseId}/status`, { status: "REJECTED", note: reason });
            setCourses(prev => prev.map(c => (c.id === courseId || c.courseId === courseId) ? { ...c, status: "REJECTED" } : c));
            alert(`Đã gửi yêu cầu chỉnh sửa cho giảng viên.`);
        } catch (error) {
            alert("Lỗi kết nối hoặc không thể từ chối khóa học này.");
        }
    };

    const handleRevokeToPending = async (courseId) => {
        if (!courseId || !window.confirm(`Hạ khóa học #${courseId} từ "Đã xuất bản" xuống "Chờ duyệt"?`)) return;
        try {
            await axiosClient.patch(`/admin/courses/${courseId}/status`, { status: "PENDING" });
            setCourses(prev => prev.map(c => (c.id === courseId || c.courseId === courseId) ? { ...c, status: "PENDING" } : c));
            alert(`🔄 Khóa học #${courseId} đã chuyển về trạng thái Chờ kiểm duyệt.`);
        } catch (error) {
            alert("Lỗi kết nối hoặc không thể hạ trạng thái khóa học.");
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!courseId || !window.confirm(`🚨 CẢNH BÁO: Bạn có chắc chắn muốn XÓA HOÀN TOÀN khóa học #${courseId}? Hành động này không thể hoàn tác!`)) return;
        try {
            await axiosClient.delete(`/admin/courses/${courseId}`);
            alert(`🗑️ Đã xóa hoàn toàn khóa học #${courseId} thành công!`);
            fetchAllCourses();
        } catch (error) {
            alert("Lỗi kết nối hoặc không có quyền xóa khóa học vĩnh viễn.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-brand" onClick={() => navigate("/admin")}>
                    <h2>PrepAce <span>Admin</span></h2>
                </div>
                <ul className="admin-menu">
                    <li onClick={() => navigate("/admin")}>📊 Dashboard</li>
                    <li className="active" onClick={() => navigate("/admin/courses")}>📚 Quản lý khóa học</li>
                    <li onClick={() => navigate("/admin/users")}>👥 Quản lý người dùng</li>
                    <li onClick={() => navigate("/admin/question-bank")}>📝 Quản lý thư viện đề</li>
                    <li onClick={() => navigate("/admin/violations")}>🚨 Quản lý vi phạm</li>
                    <li onClick={() => navigate("/admin/ui-config")}>🎨 Cấu hình UI</li>
                    <li onClick={() => navigate("/admin/sepay-guide")}>💳 Cấu hình SePay</li>
                    <li onClick={() => navigate("/admin/categories")}>⚙️ Cấu hình danh mục</li>
                </ul>
                <div className="admin-logout">
                    <button onClick={handleLogout}>Đăng xuất</button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div className="header-title">
                        <h1>Quản lý khóa học</h1>
                        <p>Kiểm duyệt, xem trước giao diện và quyết định xuất bản khóa học.</p>
                    </div>
                </header>

                <div className="admin-content">
                    <div className="manage-card">
                        <div className="manage-header">
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên hoặc ID khóa học..."
                                className="manage-search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tên khóa học</th>
                                        <th>Giáo viên</th>
                                        <th>Giá bán</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(filteredCourses) && filteredCourses.length > 0 ? (
                                        filteredCourses.map((c, index) => {
                                            // Fallback an toàn cho ID nếu object lỗi rỗng id
                                            const currentId = c.id || c.courseId || (index + 1);

                                            // Nhận diện linh hoạt trường tên khóa học
                                            const currentTitle = c.title || c.courseTitle || c.courseDescription || c.course_description || `Khóa học số #${currentId}`;
                                            const currentStatus = c.status ? String(c.status).toUpperCase() : "PENDING";

                                            let formattedPrice = "0đ";
                                            if (c.price !== undefined && c.price !== null) {
                                                formattedPrice = typeof c.price === "number"
                                                    ? c.price.toLocaleString() + "đ"
                                                    : String(c.price) + "đ";
                                            }

                                            return (
                                                <tr key={currentId}>
                                                    <td>#{currentId}</td>
                                                    <td>
                                                        <strong
                                                            style={{ cursor: "pointer", color: "#2563eb" }}
                                                            onClick={() => navigate(`/course/${currentId}`)}
                                                        >
                                                            {currentTitle}
                                                        </strong>
                                                    </td>
                                                    <td>{c.teacherName || c.teacher_name || `ID Giáo viên: ${c.teacherId || c.teacher_id || "Chưa rõ"}`}</td>
                                                    <td>{formattedPrice}</td>
                                                    <td>
                                                        <span className={`status-badge ${currentStatus === 'PUBLISHED' || currentStatus === 'APPROVED' ? 'success' : (currentStatus === 'REJECTED' ? 'banned' : 'pending')}`}>
                                                            {currentStatus === 'PUBLISHED' || currentStatus === 'APPROVED' ? 'Đã xuất bản' : (currentStatus === 'REJECTED' ? 'Yêu cầu sửa' : 'Chờ duyệt')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="action-btn view"
                                                            onClick={() => navigate(`/admin/preview/${currentId}`)}
                                                        >
                                                            👁️ Thẩm định
                                                        </button>

                                                        {(currentStatus === 'PENDING' || currentStatus === 'DRAFT') && (
                                                            <>
                                                                <button className="action-btn approve" style={{ marginLeft: "6px" }} onClick={() => handleApproveCourse(currentId)}>✅ Duyệt</button>
                                                                <button className="action-btn reject" style={{ marginLeft: "6px" }} onClick={() => handleRejectCourse(currentId)}>❌ Sửa</button>
                                                            </>
                                                        )}

                                                        {(currentStatus === 'PUBLISHED' || currentStatus === 'APPROVED') && (
                                                            <>
                                                                <button
                                                                    className="action-btn reject"
                                                                    style={{ marginLeft: "6px", backgroundColor: "#ea580c", color: "#fff" }}
                                                                    onClick={() => handleRevokeToPending(currentId)}
                                                                >
                                                                    ↩️ Hạ
                                                                </button>
                                                                <button
                                                                    className="action-btn reject"
                                                                    style={{ marginLeft: "6px", backgroundColor: "#dc2626", color: "#fff" }}
                                                                    onClick={() => handleDeleteCourse(currentId)}
                                                                >
                                                                    🗑️ Xóa
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#9ca3af" }}>
                                                {searchTerm ? "❌ Không tìm thấy khóa học nào khớp từ khóa!" : "Hệ thống chưa hiển thị được dữ liệu. Vui lòng kiểm tra lại cấu trúc thuộc tính."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/AdminUsersPage.css";

export default function AdminCoursesPage() {
    const navigate = useNavigate();
    
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // Lọc khóa học theo từ khóa tìm kiếm
    const filteredCourses = courses.filter(course => {
        const title = (course.title || course.courseTitle || "").toLowerCase();
        const teacher = (course.teacherName || course.teacher || "").toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return title.includes(search) || teacher.includes(search);
    });

    // Kiểm tra quyền Admin + Load dữ liệu
    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            alert("⚠️ Bạn chưa đăng nhập!");
            navigate("/");
            return;
        }

        const userObj = JSON.parse(storedUser);
        if (userObj.role !== "ADMIN" && userObj.roleId !== 1) {
            alert("❌ Bạn không có quyền truy cập vào phân hệ Quản trị!");
            navigate("/home");
            return;
        }

        fetchAllCourses();
    }, [navigate]);

    const fetchAllCourses = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get("/admin/courses");
            console.log("📡 Dữ liệu khóa học từ backend:", response.data);
            
            if (response.data && Array.isArray(response.data)) {
                setCourses(response.data);
            } else {
                setCourses([]);
            }
        } catch (error) {
            console.error("❌ Lỗi khi tải danh sách khóa học:", error);
            alert("Không thể tải danh sách khóa học từ server.");
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveCourse = async (courseId) => {
        if (!courseId || !window.confirm(`Bạn có chắc chắn muốn duyệt khóa học #${courseId}?`)) return;
        
        try {
            await axiosClient.patch(`/admin/courses/${courseId}/status`, { status: "PUBLISHED" });
            setCourses(prev => prev.map(c => 
                (c.id === courseId || c.courseId === courseId) 
                    ? { ...c, status: "PUBLISHED" } 
                    : c
            ));
            alert(`✅ Khóa học #${courseId} đã được duyệt và xuất bản!`);
        } catch (error) {
            alert("❌ Lỗi khi duyệt khóa học: " + (error.response?.data?.message || error.message));
        }
    };

    const handleRejectCourse = async (courseId) => {
        if (!courseId) return;
        const reason = prompt("Nhập lý do yêu cầu giảng viên chỉnh sửa lại:");
        if (!reason) return;

        try {
            await axiosClient.patch(`/admin/courses/${courseId}/status`, { 
                status: "REJECTED", 
                note: reason 
            });
            setCourses(prev => prev.map(c => 
                (c.id === courseId || c.courseId === courseId) 
                    ? { ...c, status: "REJECTED" } 
                    : c
            ));
            alert("✅ Đã gửi yêu cầu chỉnh sửa cho giảng viên.");
        } catch (error) {
            alert("❌ Lỗi khi từ chối khóa học: " + (error.response?.data?.message || error.message));
        }
    };

    const handleRevokeToPending = async (courseId) => {
        if (!courseId || !window.confirm(`Hạ khóa học #${courseId} xuống trạng thái "Chờ duyệt"?`)) return;
        
        try {
            await axiosClient.patch(`/admin/courses/${courseId}/status`, { status: "PENDING" });
            setCourses(prev => prev.map(c => 
                (c.id === courseId || c.courseId === courseId) 
                    ? { ...c, status: "PENDING" } 
                    : c
            ));
            alert(`🔄 Khóa học #${courseId} đã chuyển về trạng thái Chờ duyệt.`);
        } catch (error) {
            alert("❌ Lỗi khi hạ trạng thái: " + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!courseId || !window.confirm(`🚨 CẢNH BÁO: Xóa vĩnh viễn khóa học #${courseId}?`)) return;
        
        try {
            await axiosClient.delete(`/admin/courses/${courseId}`);
            alert(`🗑️ Đã xóa khóa học #${courseId} thành công!`);
            fetchAllCourses();
        } catch (error) {
            alert("❌ Lỗi khi xóa khóa học: " + (error.response?.data?.message || error.message));
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const filteredCourses = courses.filter(c => {
        const title = (c.title || c.courseTitle || c.courseDescription || "").toLowerCase();
        const idStr = String(c.id || c.courseId || "");
        const term = searchTerm.toLowerCase();
        return title.includes(term) || idStr.includes(term);
    });

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-brand" onClick={() => navigate("/admin")} style={{ cursor: "pointer" }}>
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
                        <p>Kiểm duyệt, thẩm định và quyết định xuất bản khóa học trên PrepAce.</p>
                    </div>
                </header>

                <div className="admin-content">
                    <div className="manage-card">
                        <div className="manage-header">
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên khóa học hoặc giáo viên..."
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
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                                                Đang tải dữ liệu...
                                            </td>
                                        </tr>
                                    ) : filteredCourses.length > 0 ? (
                                        filteredCourses.map((c, index) => {
                                            const currentId = c.id || c.courseId || index + 1;
                                            const currentTitle = c.title || c.courseTitle || `Khóa học #${currentId}`;
                                            const currentStatus = String(c.status || "PENDING").toUpperCase();
                                            const formattedPrice = c.price 
                                                ? (typeof c.price === "number" ? c.price.toLocaleString() : String(c.price)) + "đ" 
                                                : "0đ";

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
                                                    <td>
                                                        {c.teacherName || c.teacher || c.teacher_id 
                                                            ? `GV: ${c.teacherName || c.teacher || c.teacher_id}` 
                                                            : "Chưa có"}
                                                    </td>
                                                    <td>{formattedPrice}</td>
                                                    <td>
                                                        <span className={`status-badge ${
                                                            currentStatus === 'PUBLISHED' || currentStatus === 'APPROVED' 
                                                                ? 'success' 
                                                                : currentStatus === 'REJECTED' 
                                                                    ? 'banned' 
                                                                    : 'pending'
                                                        }`}>
                                                            {currentStatus === 'PUBLISHED' || currentStatus === 'APPROVED' 
                                                                ? 'Đã xuất bản' 
                                                                : currentStatus === 'REJECTED' 
                                                                    ? 'Yêu cầu sửa' 
                                                                    : 'Chờ duyệt'}
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
                                                                <button 
                                                                    className="action-btn approve" 
                                                                    style={{ marginLeft: "6px" }}
                                                                    onClick={() => handleApproveCourse(currentId)}
                                                                >
                                                                    ✅ Duyệt
                                                                </button>
                                                                <button 
                                                                    className="action-btn reject" 
                                                                    style={{ marginLeft: "6px" }}
                                                                    onClick={() => handleRejectCourse(currentId)}
                                                                >
                                                                    ❌ Sửa
                                                                </button>
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
                                            <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                                                {searchTerm ? "Không tìm thấy khóa học nào khớp với từ khóa." : "Chưa có khóa học nào."}
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
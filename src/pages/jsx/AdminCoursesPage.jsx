import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import Swal from "sweetalert2";
import "../css/AdminUsersPage.css";

export default function AdminCoursesPage() {
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    const filteredCourses = courses.filter(course => {
        const search = (searchTerm || "").toLowerCase();
        if (!search.trim()) return true;

        const title = (course.courseName || course.title || course.courseTitle || "").toLowerCase();

        let teacherText = "";
        if (typeof course.teacherName === "string") {
            teacherText = course.teacherName;
        } else if (course.teacher && typeof course.teacher === "object") {
            teacherText = course.teacher.fullName || course.teacher.name || course.teacher.fullNameTeacher || "";
        } else if (typeof course.teacher === "string") {
            teacherText = course.teacher;
        }

        const teacher = teacherText.toLowerCase();

        return title.includes(search) || teacher.includes(search);
    });

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
            Swal.fire({
                icon: "warning",
                title: "Không có quyền truy cập",
                text: "Bạn không được phép sử dụng chức năng này.",
                confirmButtonColor: "#2563eb"
            }).then(() => {
                navigate("/home");
            });
            return;
        }

        fetchAllCourses();
    }, [navigate]);

    const fetchAllCourses = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get("/admin/courses");

            if (response.data && Array.isArray(response.data)) {
                setCourses(response.data);
            } else {
                setCourses([]);
            }
        } catch (error) {
            console.error("❌ Lỗi khi tải danh sách khóa học:", error);
            Swal.fire({
                icon: "error",
                title: "Không thể tải dữ liệu",
                text: "Vui lòng thử lại sau.",
                confirmButtonColor: "#2563eb"
            });
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    // 🔥 DUYỆT KHÓA HỌC
    const handleApproveCourse = async (course) => {
        const courseId = course.id || course.courseId;
        const courseTitle = course.title || course.courseTitle || `Khóa học #${courseId}`;

        const result = await Swal.fire({
            title: "Xuất bản khóa học?",
            html: `
                <b>${courseTitle}</b><br/><br/>
                Khóa học sẽ được xuất bản và gửi thông báo tới giảng viên.
            `,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "✅ Duyệt",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#2563eb",
            cancelButtonColor: "#9ca3af"
        });

        if (!result.isConfirmed) return;
        await Swal.fire({
            icon: "success",
            title: "Đã xuất bản!",
            text: "Khóa học đã được duyệt và thông báo đã gửi tới giảng viên.",
            confirmButtonColor: "#2563eb"
        });

        try {
            await axiosClient.patch(`/admin/courses/${courseId}/status`, { 
                status: "PUBLISHED" 
            });

            setCourses(prev => prev.map(c =>
                (c.id === courseId || c.courseId === courseId)
                    ? { ...c, status: "PUBLISHED" }
                    : c
            ));
            alert(`✅ Khóa học #${courseId} đã được duyệt và hệ thống đã gửi thông báo tới giảng viên!`);
        } catch (error) {
            alert("❌ Lỗi khi duyệt khóa học: " + (error.response?.data?.message || error.message));
        }
    };

    // 🔥 TỪ CHỐI / YÊU CẦU SỬA (GỬI LÝ DO QUA API STATUS)
    const handleRejectCourse = async (course) => {
        const courseId = course.id || course.courseId;
        const courseTitle = course.title || course.courseTitle || `Khóa học #${courseId}`;

        if (!courseId) return;
        const { value: reason } = await Swal.fire({
            title: "Yêu cầu chỉnh sửa",
            input: "textarea",
            inputPlaceholder: "Nhập lý do cần chỉnh sửa...",
            inputAttributes: {
                rows: 5
            },
            showCancelButton: true,
            confirmButtonText: "Gửi yêu cầu",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#f59e0b",
            inputValidator: (value) => {
                if (!value) {
                    return "Bạn phải nhập lý do.";
                }
            }
        });

        if (!reason || !reason.trim()) {
            alert("⚠️ Bạn cần phải nhập lý do yêu cầu chỉnh sửa!");
            return;
        }

        await Swal.fire({
            icon: "success",
            title: "Đã gửi!",
            text: "Giảng viên đã nhận được yêu cầu chỉnh sửa.",
            confirmButtonColor: "#2563eb"
        });

        try {
            await axiosClient.patch(`/admin/courses/${courseId}/status`, {
                status: "REJECTED",
                note: reason.trim()
            });

            setCourses(prev => prev.map(c =>
                (c.id === courseId || c.courseId === courseId)
                    ? { ...c, status: "REJECTED" }
                    : c
            ));
            alert("✅ Đã gửi yêu cầu chỉnh sửa và thông báo tới giảng viên!");
        } catch (error) {
            alert("❌ Lỗi khi từ chối khóa học: " + (error.response?.data?.message || error.message));
        }
    };

    // 🔥 HẠ KHÓA HỌC XUỐNG CHỜ DUYỆT
    const handleRevokeToPending = async (course) => {
        const courseId = course.id || course.courseId;
        const courseTitle = course.title || course.courseTitle || `Khóa học #${courseId}`;

        if (!courseId) return;

        const { value: reason } = await Swal.fire({
            title: "Hạ khóa học",
            text: "Khóa học sẽ quay về trạng thái Chờ duyệt.",
            input: "textarea",
            inputPlaceholder: "Nhập lý do...",
            showCancelButton: true,
            confirmButtonText: "Hạ khóa học",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#ea580c",
            inputValidator: (value) => {
                if (!value) return "Bạn phải nhập lý do.";
            }
        });

        if (!reason || !reason.trim()) {
            alert("⚠️ Bạn phải nhập lý do để hạ khóa học!");
            return;
        }

        await Swal.fire({
            icon: "success",
            title: "Đã chuyển trạng thái",
            text: "Khóa học đã quay về Chờ duyệt.",
            confirmButtonColor: "#2563eb"
        });

        try {
            await axiosClient.patch(`/admin/courses/${courseId}/status`, {
                status: "PENDING",
                note: reason.trim()
            });

            setCourses(prev => prev.map(c =>
                (c.id === courseId || c.courseId === courseId)
                    ? { ...c, status: "PENDING" }
                    : c
            ));
            alert(`🔄 Khóa học #${courseId} đã chuyển về Chờ duyệt và gửi thông báo tới giảng viên!`);
        } catch (error) {
            alert("❌ Lỗi khi hạ trạng thái: " + (error.response?.data?.message || error.message));
        }
    };

    // 🔥 XÓA KHÓA HỌC
    const handleDeleteCourse = async (course) => {
        const courseId = course.id || course.courseId;
        const courseTitle = course.title || course.courseTitle || `Khóa học #${courseId}`;

        if (!courseId) return;

        const { value: reason } = await Swal.fire({
            title: "Xóa khóa học?",
            html: `
                <b style="color:#dc2626">${courseTitle}</b><br><br>
                Hành động này không thể hoàn tác.
            `,
            icon: "warning",
            input: "textarea",
            inputPlaceholder: "Nhập lý do xóa...",
            showCancelButton: true,
            confirmButtonText: "🗑️ Xóa",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#9ca3af",
            inputValidator: (value) => {
                if (!value) return "Bạn phải nhập lý do.";
            }
        });


        if (!reason || !reason.trim()) {
            alert("⚠️ Bạn phải nhập lý do xóa khóa học!");
            return;
        }

        await Swal.fire({
            icon: "success",
            title: "Đã xóa",
            text: "Khóa học đã bị xóa khỏi hệ thống.",
            confirmButtonColor: "#2563eb"
        });

        try {
            await axiosClient.delete(`/admin/courses/${courseId}`, {
                data: { reason: reason.trim() }
            });
            alert(`🗑️ Đã xóa khóa học #${courseId} và gửi thông báo tới giảng viên!`);
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

                                            // 🔥 XỬ LÝ LẤY TÊN GIÁO VIÊN AN TOÀN TRÁNH [object Object]
                                            let teacherDisplayName = "Chưa có";
                                            if (typeof c.teacherName === "string" && c.teacherName.trim()) {
                                                teacherDisplayName = c.teacherName;
                                            } else if (c.teacher && typeof c.teacher === "object") {
                                                teacherDisplayName = c.teacher.fullName || c.teacher.name || c.teacher.fullNameTeacher || "Giáo viên";
                                            } else if (typeof c.teacher === "string" && c.teacher.trim()) {
                                                teacherDisplayName = c.teacher;
                                            } else if (c.teacher_id || c.teacherId) {
                                                teacherDisplayName = `GV #${c.teacher_id || c.teacherId}`;
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
                                                    <td>
                                                        {teacherDisplayName !== "Chưa có" ? `GV: ${teacherDisplayName}` : "Chưa có"}
                                                    </td>
                                                    <td>{formattedPrice}</td>
                                                    <td>
                                                        <span className={`status-badge ${currentStatus === 'PUBLISHED' || currentStatus === 'APPROVED'
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
                                                                    onClick={() => handleApproveCourse(c)}
                                                                >
                                                                    ✅ Duyệt
                                                                </button>
                                                                <button
                                                                    className="action-btn reject"
                                                                    style={{ marginLeft: "6px" }}
                                                                    onClick={() => handleRejectCourse(c)}
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
                                                                    onClick={() => handleRevokeToPending(c)}
                                                                >
                                                                    ↩️ Hạ
                                                                </button>
                                                                <button
                                                                    className="action-btn reject"
                                                                    style={{ marginLeft: "6px", backgroundColor: "#dc2626", color: "#fff" }}
                                                                    onClick={() => handleDeleteCourse(c)}
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
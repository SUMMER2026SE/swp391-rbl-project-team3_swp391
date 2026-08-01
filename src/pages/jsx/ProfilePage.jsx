import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AvatarUpload from "./AvatarUpload";
import axiosClient from "../../api/axiosClient";
import "../css/ProfilePage.css";

function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [baselineUser, setBaselineUser] = useState(null); // Lưu thông tin gốc để so sánh thay đổi
    const [enrolledCourses, setEnrolledCourses] = useState([]); // Khóa học đã mua
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [activeTab, setActiveTab] = useState("profile");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Lấy thông tin profile
                const profileRes = await axiosClient.get("/auth/profile");
                setUser(profileRes.data);
                setBaselineUser(profileRes.data);

                // Lấy danh sách khóa học đã đăng ký
                const enrollRes = await axiosClient.get("/enrollments/me");
                setEnrolledCourses(enrollRes.data || []);
            } catch (err) {
                console.error("Lỗi tải thông tin:", err);
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setUser(parsed);
                    setBaselineUser(parsed);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // So sánh xem form có thay đổi không
    const hasChanges = user && baselineUser && (
        (user.fullName || "") !== (baselineUser.fullName || "") ||
        (user.phone || "") !== (baselineUser.phone || "") ||
        (user.school || "") !== (baselineUser.school || "") ||
        (user.bio || "") !== (baselineUser.bio || "") ||
        (user.avatarUrl || user.avatar_url || "") !== (baselineUser.avatarUrl || baselineUser.avatar_url || "")
    );

    // Lắng nghe sự kiện F5 / Đóng Tab khi có thay đổi chưa lưu
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = "Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời đi không?";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasChanges]);

    // Hàm điều hướng tùy biến để kiểm tra thay đổi chưa lưu
    const handleNavigate = (path) => {
        if (hasChanges) {
            if (!window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời đi không?")) {
                return;
            }
        }
        navigate(path);
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await axiosClient.put("/auth/profile", {
                fullName: user.fullName,
                phone: user.phone,
                school: user.school,
                bio: user.bio
            });

            localStorage.setItem("user", JSON.stringify(user));
            setBaselineUser(user); // Cập nhật lại dữ liệu gốc
            alert("✅ Cập nhật thông tin thành công!");
        } catch (err) {
            alert("❌ Cập nhật thất bại: " + (err.response?.data?.message || "Vui lòng thử lại!"));
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm("Bạn có chắc muốn đăng xuất khỏi PrepAce?")) {
            localStorage.clear();
            navigate("/auth");
        }
    };

    const getAvatarUrl = () => {
        let url = user?.avatarUrl || user?.avatar_url;
        if (!url || url === "null" || url.trim() === "") {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}&background=64748b&color=fff`;
        }
        if (url.startsWith("http")) return url;
        return `${import.meta.env.VITE_API_URL.replace("/api","")}${url}`;
    };
    const currentAvatar = getAvatarUrl();

    if (loading) return <div className="profile-loading">Đang tải thông tin cá nhân...</div>;
    if (!user) return <div className="error-text">Không tìm thấy thông tin. Vui lòng đăng nhập lại.</div>;

    return (
        <div className="profile-page">
            <header className="topbar">
                <h2 onClick={() => navigate("/home")} style={{ cursor: "pointer" }}>PrepAce</h2>
                <button className="logout-btn" onClick={handleLogout}>Đăng xuất</button>
            </header>

            <div className="main-layout">
                {/* Sidebar */}
                <aside className="sidebar">
                    <div className="user-box">
                        <img className="sidebar-avatar" src={currentAvatar} onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}&background=64748b&color=fff`; }} alt="avatar" />
                        <h4>{user.fullName || "Học sinh PrepAce"}</h4>
                        <p className="role-tag student">Học sinh THPT</p>
                    </div>

                    <ul>
                        <li onClick={() => navigate("/home")}>← Về Trang chủ</li>

                        {/* Tab thông tin cá nhân */}
                        <li
                            className={activeTab === "profile" ? "active" : ""}
                            onClick={() => setActiveTab("profile")}
                        >
                            Thông tin cá nhân
                        </li>

                        {/* Tab khóa học đã mua */}
                        <li
                            className={activeTab === "courses" ? "active" : ""}
                            onClick={() => setActiveTab("courses")}
                        >
                            📚 Khóa học của tôi
                        </li>

                        <li onClick={() => navigate("/entry-test")}>📝 Kiểm tra đầu vào</li>
                        <li onClick={() => navigate("/adaptive-path")}>🗺️ Lộ trình AI</li>
                    </ul>
                </aside>

                {/* Main Content */}
                <div className="content">
                    {/* ==================== TAB 1: THÔNG TIN CÁ NHÂN ==================== */}
                    {activeTab === "profile" && (
                        <>
                            <h1>Thông tin cá nhân</h1>
                            <p className="subtitle">Quản lý thông tin để PrepAce đồng hành cùng bạn ôn thi Đại học hiệu quả hơn.</p>

                            {/* Avatar */}
                            <div className="avatar-card">
                                <img className="avatar" src={currentAvatar} onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}&background=64748b&color=fff`; }} alt="avatar" />
                                <div>
                                    <h3>Ảnh đại diện</h3>
                                    <AvatarUpload
                                        onUploaded={(url) => {
                                            setUser((prev) => ({
                                                ...prev,
                                                avatarUrl: url,
                                                avatar_url: url,
                                            }));
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Form thông tin */}
                            <div className="form-grid">
                                <div>
                                    <label>Họ và tên</label>
                                    <input
                                        value={user.fullName || ""}
                                        onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label>Email</label>
                                    <input value={user.email || ""} disabled />
                                </div>
                                <div>
                                    <label>Số điện thoại</label>
                                    <input
                                        value={user.phone || ""}
                                        onChange={(e) => setUser({ ...user, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label>Trường học</label>
                                    <input
                                        value={user.school || ""}
                                        onChange={(e) => setUser({ ...user, school: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="bio-section">
                                <label>Giới thiệu / Mục tiêu ôn thi</label>
                                <textarea
                                    rows="4"
                                    value={user.bio || ""}
                                    onChange={(e) => setUser({ ...user, bio: e.target.value })}
                                    placeholder="Ví dụ: Mình đang lớp 12, mục tiêu 28+ khối A, đặc biệt cần cải thiện Vật lý..."
                                />
                            </div>

                            <div className="actions">
                                <button className="password-btn" onClick={() => navigate("/change-password")}>
                                    🔐 Đổi mật khẩu
                                </button>
                                <button
                                    className={`save-btn ${hasChanges ? "active" : ""}`}
                                    onClick={handleSave}
                                    disabled={saving || !hasChanges}
                                >
                                    {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ==================== TAB 2: KHÓA HỌC CỦA TÔI ==================== */}
                  {activeTab === "courses" && (
                        <div className="enrolled-courses-section">
                            <h1>📚 Khóa học của tôi</h1>
                            <p className="subtitle" style={{ marginBottom: "20px" }}>Danh sách các khóa học bạn đang tham gia ôn luyện trên hệ thống PrepAce.</p>
                            
                            {enrolledCourses.length > 0 ? (
                                /* 🔥 Sử dụng class grid và card chuẩn đẹp của ông */
                                <div className="course-grid">
                                    {enrolledCourses.map(course => (
                                        <div
                                            key={course.id}
                                            className="course-card"
                                            onClick={() => navigate(`/learn/${course.id}`)}
                                        >
                                            {/* Phần ảnh bìa khóa học */}
                                            <div className="course-thumb">
                                                <img
                                                    src={
                                                        course.thumbnail_url
                                                            ? (course.thumbnail_url.startsWith("http")
                                                                ? course.thumbnail_url
                                                                : `${import.meta.env.VITE_API_URL.replace("/api","")}${course.thumbnail_url}`)
                                                            : "https://placehold.co/600x400?text=PrepAce"
                                                    }
                                                    alt={course.title}
                                                />
                                                {/* Nhãn môn học tự động lấy từ DB */}
                                                <span className="subject-badge">{course.subjectName || "Môn học"}</span>
                                                {/* Lớp phủ hover hiện chữ Vào học */}
                                                <div className="course-overlay">
                                                    <button>Vào học ngay →</button>
                                                </div>
                                            </div>

                                            {/* Phần thông tin chi tiết (Chỉ giữ lại Tiêu đề & Giáo viên tối giản) */}
                                            <div className="course-info">
                                                <h3 className="course-title">{course.title}</h3>
                                                <p className="course-teacher">👨‍🏫 Giảng viên: {course.teacherName}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>Bạn chưa có khóa học nào. <span onClick={() => navigate("/courses")} style={{ color: "#3b82f6", cursor: "pointer" }}>Khám phá ngay</span></p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
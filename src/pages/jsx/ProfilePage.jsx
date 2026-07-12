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

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Lấy thông tin profile
                const profileRes = await axiosClient.get("/auth/profile");
                setUser(profileRes.data);
                setBaselineUser(profileRes.data);

                // Lấy danh sách khóa học đã đăng ký
                const enrollRes = await axiosClient.get("/api/enrollments/me");
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

    const currentAvatar = user?.avatarUrl || user?.avatar_url || "https://i.pravatar.cc/150?img=12";

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
                        <img className="sidebar-avatar" src={currentAvatar} alt="avatar" />
                        <h4>{user.fullName || "Học sinh PrepAce"}</h4>
                        <p className="role-tag student">Học sinh THPT</p>
                    </div>

                    <ul>
                        <li onClick={() => navigate("/home")}>← Về Trang chủ</li>
                        <li className="active">Thông tin cá nhân</li>
                        <li onClick={() => navigate("/change-password")}>🔐 Bảo mật</li>
                        <li onClick={() => navigate("/entry-test")}>📝 Kiểm tra đầu vào</li>
                        <li onClick={() => navigate("/adaptive-path")}>🗺️ Lộ trình AI</li>
                    </ul>
                </aside>

                {/* Main Content */}
                <div className="content">
                    <h1>Thông tin cá nhân</h1>
                    <p className="subtitle">Quản lý thông tin để PrepAce đồng hành cùng bạn ôn thi Đại học hiệu quả hơn.</p>

                    {/* Avatar */}
                    <div className="avatar-card">
                        <img className="avatar" src={currentAvatar} alt="avatar" />
                        <div>
                            <h3>Ảnh đại diện</h3>
                            <AvatarUpload
                                onUploaded={(url) => {
                                    const updatedUser = {
                                        ...user,
                                        avatarUrl: url,
                                        avatar_url: url
                                    };
                                    setUser(updatedUser);
                                    localStorage.setItem(
                                        "user",
                                        JSON.stringify(updatedUser)
                                    );

                                    axiosClient.put("/auth/avatar", {
                                        avatarUrl: url
                                    });
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

                    {/* === KHÓA HỌC ĐÃ MUA === */}
                    <div className="enrolled-courses-section" style={{ marginTop: "30px" }}>
                        <h3>📚 Khóa học của tôi</h3>
                        {enrolledCourses.length > 0 ? (
                            <div className="enrolled-grid">
                                {enrolledCourses.map(course => (
                                    <div 
                                        key={course.id} 
                                        className="enrolled-card"
                                        onClick={() => navigate(`/learn/${course.id}`)}
                                    >
                                        <img src={course.thumbnail} alt={course.title} />
                                        <div>
                                            <strong>{course.title}</strong>
                                            <p>Giảng viên: {course.teacher}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>Bạn chưa có khóa học nào. <span onClick={() => navigate("/courses")} style={{color:"#3b82f6", cursor:"pointer"}}>Khám phá ngay</span></p>
                        )}
                    </div>

                    <div className="actions">
                        <button className="password-btn" onClick={() => navigate("/change-password")}>
                            🔐 Đổi mật khẩu
                        </button>
                        <button className="save-btn" onClick={handleSave} disabled={saving}>
                            {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
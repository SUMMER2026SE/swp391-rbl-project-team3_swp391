import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AvatarUpload from "./AvatarUpload";
import axiosClient from "../../api/axiosClient";
import "../css/ProfilePage.css";

function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // =========================================================
    // TỐI ƯU GỌI API: Dùng axiosClient để thừa hưởng Interceptor bảo mật
    // =========================================================
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axiosClient.get("/auth/profile");
                setUser(response.data);
            } catch (err) {
                console.log("Error fetching profile:", err);
                // Nếu lỗi, thử cứu nguy bằng dữ liệu lưu trong bộ nhớ máy
                const storedUser = localStorage.getItem("user");
                if (storedUser) setUser(JSON.parse(storedUser));
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSave = async () => {
        try {
            await axiosClient.put("/auth/profile", user);
            // Cập nhật lại bộ nhớ local của máy sau khi lưu thành công
            localStorage.setItem("user", JSON.stringify(user));
            alert("Saved successfully!");
            navigate("/home")
        } catch (err) {
            console.log(err);
            alert("Save failed!");
        }
    };

    const handleLogout = () => {
        localStorage.clear(); // Xóa sạch toàn bộ token và user để bảo mật
        navigate("/");
    };

    // MẸO AN TOÀN: Đọc song song cả camelCase và snake_case đề phòng Backend trả về kiểu nào cũng cân được
    const currentAvatar = user?.avatarUrl || user?.avatar_url || "https://i.pravatar.cc/150?img=12";
    const currentRole = user?.role || "STUDENT";

    if (loading) return <div className="loading-state">Loading profile...</div>;

    return (
        <div className="profile-page">
            {/* NAVBAR */}
            <header className="topbar">
                <h2 onClick={() => navigate(-1)} style={{ cursor: "pointer" }}>PrepAce</h2>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </header>

            <div className="main-layout">
                {/* SIDEBAR */}
                <aside className="sidebar">
                    <div className="user-box">
                        <img className="sidebar-avatar" src={currentAvatar} alt="avatar" />
                        <h4>{user?.fullName || "Người dùng"}</h4>
                        <p className={`role-tag ${currentRole.toLowerCase()}`}>{currentRole}</p>
                    </div>

                    <ul>
                        <li onClick={() => navigate(-1)}>⬅ Quay lại làm việc</li>
                        <li className="active">Profile Settings</li>
                        <li>Security</li>
                        {currentRole === "STUDENT" && <li>Study History</li>}
                        <li>Notifications</li>
                    </ul>
                </aside>

                {/* CONTENT */}
                <div className="content">
                    <h1>Edit Profile</h1>
                    <p>Manage your personal information and how others see you on the platform.</p>

                    {/* AVATAR */}
                    <div className="avatar-card">
                        <img className="avatar" src={currentAvatar} alt="avatar" />
                        <div>
                            <h3>Profile Photo</h3>
                            <AvatarUpload
                                onUploaded={async (url) => {
                                    // Cập nhật song song cả 2 định dạng cho an toàn tuyệt đối
                                    setUser((prev) => ({
                                        ...prev,
                                        avatarUrl: url,
                                        avatar_url: url
                                    }));

                                    // Gọi API lưu riêng ảnh đại diện lên Database
                                    await axiosClient.put("/auth/avatar", { avatarUrl: url, avatar_url: url });
                                }}
                            />
                        </div>
                    </div>

                    {/* FORM INPUTS */}
                    <div className="form-grid">
                        <div>
                            <label>Full Name</label>
                            <input
                                value={user?.fullName || ""}
                                onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label>Email</label>
                            <input value={user?.email || ""} disabled />
                        </div>

                        <div>
                            <label>Phone Number</label>
                            <input
                                value={user?.phone || ""}
                                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                            />
                        </div>

                        <div>
                            <label>School</label>
                            <input
                                value={user?.school || ""}
                                onChange={(e) => setUser({ ...user, school: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bio-section">
                        <label>Bio</label>
                        <textarea
                            rows="4"
                            value={user?.bio || ""}
                            onChange={(e) => setUser({ ...user, bio: e.target.value })}
                        />
                    </div>

                    <div className="actions">
                        <button className="password-btn" onClick={() => navigate("/change-password")}>
                            Change Password
                        </button>

                        <div className="right-actions">
                            {/* Dùng navigate(-1) để quay về trang trước đó một cách thông minh */}
                            <button className="save-btn" onClick={handleSave}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
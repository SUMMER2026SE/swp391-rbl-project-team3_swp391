import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import AvatarUpload from "./AvatarUpload";

/**
 * Component chỉnh sửa hồ sơ giảng viên.
 * Được nhúng vào TeacherDashboard khi activeTab === "PROFILE".
 * Tham khảo cách làm từ ProfilePage.jsx (bên học sinh).
 */
export default function TeacherProfileEdit({ user, setUser, setHasUnsavedProfile }) {
    const [profileData, setProfileData] = useState(null);
    const [baselineData, setBaselineData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch profile từ API khi mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axiosClient.get("/auth/profile");
                setProfileData(res.data);
                setBaselineData(res.data);
            } catch (err) {
                console.error("Lỗi tải hồ sơ giảng viên:", err);
                // Fallback dùng user từ localStorage
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setProfileData(parsed);
                    setBaselineData(parsed);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // Kiểm tra có thay đổi không
    const hasChanges = profileData && baselineData &&
        (
            (profileData.fullName || "") !== (baselineData.fullName || "") ||
            (profileData.phone || "") !== (baselineData.phone || "") ||
            (profileData.school || "") !== (baselineData.school || "") ||
            (profileData.bio || "") !== (baselineData.bio || "") ||
            (profileData.avatarUrl || profileData.avatar_url || "") !==
            (baselineData.avatarUrl || baselineData.avatar_url || "")
        );

    useEffect(() => {
        if (setHasUnsavedProfile) {
            setHasUnsavedProfile(!!hasChanges);
        }
    }, [hasChanges, setHasUnsavedProfile]);

    // useEffect(() => {
    //     const handleBeforeUnload = (e) => {
    //         if (!hasChanges) return;

    //         e.preventDefault();
    //         e.returnValue = "";
    //     };

    //     window.addEventListener(
    //         "beforeunload",
    //         handleBeforeUnload
    //     );

    //     return () => {
    //         window.removeEventListener(
    //             "beforeunload",
    //             handleBeforeUnload
    //         );
    //     };
    // }, [hasChanges]);

    const handleSave = async () => {
        if (!profileData) return;
        setSaving(true);
        try {
            await axiosClient.put("/auth/profile", {
                fullName: profileData.fullName,
                phone: profileData.phone,
                school: profileData.school,
                bio: profileData.bio,
                avatarUrl: profileData.avatarUrl
            });

            // Cập nhật localStorage và state cha
            localStorage.setItem("user", JSON.stringify(profileData));
            setBaselineData(profileData);
            if (setUser) {
                setUser(profileData);
            }
            alert("✅ Cập nhật hồ sơ thành công!");

            setBaselineData(profileData);
            if (setHasUnsavedProfile) {
                setHasUnsavedProfile(false);
            }
        } catch (err) {
            alert("❌ Cập nhật thất bại: " + (err.response?.data?.message || "Vui lòng thử lại!"));
        } finally {
            setSaving(false);
        }
    };

    const getAvatarUrl = () => {
        let url = profileData?.avatarUrl || profileData?.avatar_url;
        if (!url || url === "null" || url.trim() === "") {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData?.fullName || "Teacher")}&background=2747d9&color=fff`;
        }
        if (url.startsWith("http")) return url;
        return `http://localhost:8080${url}`;
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                <div style={{ textAlign: "center", color: "#64748b" }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>⏳</div>
                    <div style={{ fontWeight: "600" }}>Đang tải hồ sơ giảng viên...</div>
                </div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div style={{ textAlign: "center", padding: "60px", color: "#ef4444" }}>
                ❌ Không thể tải thông tin. Vui lòng thử lại.
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Tiêu đề */}
            <div>
                <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>
                    👤 Hồ sơ giảng viên
                </h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                    Quản lý thông tin cá nhân của bạn. Học sinh sẽ thấy thông tin này khi xem hồ sơ giảng viên.
                </p>
            </div>

            {/* Card Avatar */}
            <div style={{
                background: "linear-gradient(135deg, #1e3a8a, #312e81)",
                borderRadius: "20px",
                padding: "32px",
                display: "flex",
                alignItems: "center",
                gap: "24px",
                color: "#fff"
            }}>
                <div style={{ position: "relative" }}>
                    <img
                        src={getAvatarUrl()}
                        alt="Avatar"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData?.fullName || "Teacher")}&background=2747d9&color=fff`;
                        }}
                        style={{
                            width: "100px",
                            height: "100px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "4px solid rgba(255,255,255,0.3)",
                            boxShadow: "0 8px 20px rgba(0,0,0,0.2)"
                        }}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "700" }}>
                        {profileData.fullName || "Giảng viên"}
                    </h3>
                    <p style={{ margin: "0 0 12px 0", fontSize: "14px", opacity: 0.8 }}>
                        {profileData.email}
                    </p>
                    <AvatarUpload
                        onUploaded={(url) => {
                            const updated = {
                                ...profileData,
                                avatarUrl: url,
                                avatar_url: url
                            };
                            setProfileData(updated);
                            localStorage.setItem("user", JSON.stringify(updated));

                            // Gọi API lưu avatar
                            axiosClient.put("/auth/avatar", { avatarUrl: url });

                            if (setUser) {
                                setUser(updated);
                            }
                        }}
                    />
                </div>
            </div>

            {/* Form thông tin */}
            <div style={{
                background: "#fff",
                borderRadius: "18px",
                padding: "28px",
                boxShadow: "0 6px 20px rgba(20, 40, 120, 0.04)",
                border: "1px solid #f0f4ff"
            }}>
                <h3 style={{ margin: "0 0 20px 0", fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
                    📝 Thông tin cá nhân
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
                    {/* Họ và tên */}
                    <div>
                        <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#475569", marginBottom: "6px" }}>
                            Họ và tên *
                        </label>
                        <input
                            type="text"
                            value={profileData.fullName || ""}
                            onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                            style={{
                                width: "100%",
                                padding: "11px 14px",
                                borderRadius: "10px",
                                border: "1px solid #cbd5e1",
                                fontSize: "14px",
                                boxSizing: "border-box",
                                transition: "border-color 0.2s"
                            }}
                        />
                    </div>

                    {/* Email (không chỉnh sửa) */}
                    <div>
                        <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#475569", marginBottom: "6px" }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={profileData.email || ""}
                            disabled
                            style={{
                                width: "100%",
                                padding: "11px 14px",
                                borderRadius: "10px",
                                border: "1px solid #e2e8f0",
                                fontSize: "14px",
                                boxSizing: "border-box",
                                background: "#f8fafc",
                                color: "#94a3b8",
                                cursor: "not-allowed"
                            }}
                        />
                    </div>

                    {/* Số điện thoại */}
                    <div>
                        <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#475569", marginBottom: "6px" }}>
                            Số điện thoại
                        </label>
                        <input
                            type="tel"
                            value={profileData.phone || ""}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            placeholder="Nhập số điện thoại..."
                            style={{
                                width: "100%",
                                padding: "11px 14px",
                                borderRadius: "10px",
                                border: "1px solid #cbd5e1",
                                fontSize: "14px",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>

                    {/* Trường / Cơ quan */}
                    <div>
                        <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#475569", marginBottom: "6px" }}>
                            Trường / Cơ quan công tác
                        </label>
                        <input
                            type="text"
                            value={profileData.school || ""}
                            onChange={(e) => setProfileData({ ...profileData, school: e.target.value })}
                            placeholder="VD: Đại học Sư phạm Hà Nội..."
                            style={{
                                width: "100%",
                                padding: "11px 14px",
                                borderRadius: "10px",
                                border: "1px solid #cbd5e1",
                                fontSize: "14px",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>
                </div>

                {/* Giới thiệu bản thân */}
                <div style={{ marginTop: "18px" }}>
                    <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#475569", marginBottom: "6px" }}>
                        Giới thiệu bản thân
                    </label>
                    <textarea
                        rows="4"
                        value={profileData.bio || ""}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        placeholder="VD: Tốt nghiệp Xuất sắc khoa Toán trường Đại học Sư phạm Hà Nội. Có hơn 5 năm kinh nghiệm luyện thi THPT Quốc gia..."
                        style={{
                            width: "100%",
                            padding: "11px 14px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            fontSize: "14px",
                            boxSizing: "border-box",
                            resize: "vertical",
                            lineHeight: "1.6"
                        }}
                    />
                </div>

                {/* Nút hành động */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                    {hasChanges && (
                        <span style={{
                            display: "flex",
                            alignItems: "center",
                            fontSize: "13px",
                            color: "#f59e0b",
                            fontWeight: "600",
                            marginRight: "auto"
                        }}>
                            ⚠️ Bạn có thay đổi chưa lưu
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        style={{
                            padding: "12px 28px",
                            background: hasChanges ? "#2747d9" : "#94a3b8",
                            color: "#fff",
                            border: "none",
                            borderRadius: "10px",
                            fontWeight: "700",
                            fontSize: "15px",
                            cursor: hasChanges ? "pointer" : "not-allowed",
                            transition: "background 0.2s",
                            boxShadow: hasChanges ? "0 4px 12px rgba(39, 71, 217, 0.3)" : "none"
                        }}
                    >
                        {saving ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
                    </button>
                </div>
            </div>

            {/* Thông báo nhỏ */}
            <div style={{
                background: "#eff3ff",
                borderRadius: "12px",
                padding: "16px 20px",
                border: "1px solid #c7d2fe",
                fontSize: "13px",
                color: "#4338ca",
                display: "flex",
                alignItems: "center",
                gap: "10px"
            }}>
                <span style={{ fontSize: "18px" }}>💡</span>
                <span>
                    Thông tin hồ sơ của bạn sẽ được hiển thị cho học sinh khi họ nhấn vào tên giảng viên ở trang khóa học.
                    Hãy cập nhật đầy đủ để tạo ấn tượng tốt nhé!
                </span>
            </div>
        </div>
    );
}
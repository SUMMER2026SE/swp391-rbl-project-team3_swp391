import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AvatarUpload from "./AvatarUpload";
import axiosClient from "../../api/axiosClient";
import "../css/ProfilePage.css";

function ProfilePage() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await fetch(
                    "http://localhost:8080/api/auth/profile",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();
                setUser(data);
            } catch (err) {
                console.log("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSave = async () => {
        try {
            await axiosClient.put("/auth/profile", user);
            alert("Saved successfully!");
        } catch (err) {
            console.log(err);
            alert("Save failed!");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="profile-page">
            {/* NAVBAR */}
            <header className="topbar">
                <h2>PrepAce</h2>

                <button
                    className="logout-btn"
                    onClick={() => {
                        localStorage.removeItem("token");
                        navigate("/");
                    }}
                >
                    Logout
                </button>
            </header>

            <div className="main-layout">
                {/* SIDEBAR */}
                <aside className="sidebar">
                    <div className="user-box">
                        <img
                            className="sidebar-avatar"
                            src={
                                user?.avatarUrl ||
                                "https://i.pravatar.cc/100?img=12"
                            }
                            alt="avatar"
                        />

                        <h4>{user?.fullName}</h4>
                        <p>{user?.role || "Student"}</p>
                    </div>

                    <ul>
                        <li>Overview</li>
                        <li className="active">Profile Settings</li>
                        <li>Security</li>
                        <li>Study History</li>
                        <li>Notifications</li>
                    </ul>
                </aside>

                {/* CONTENT */}
                <div className="content">
                    <h1>Edit Profile</h1>
                    <p>
                        Manage your personal information and how others see you
                        on the platform.
                    </p>

                    {/* AVATAR */}
                    <div className="avatar-card">
                        <img
                            className="avatar"
                            src={
                                user?.avatarUrl ||
                                "https://i.pravatar.cc/150?img=12"
                            }
                            alt="avatar"
                        />

                        <div>
                            <h3>Profile Photo</h3>

                            <AvatarUpload
                                onUploaded={async (url) => {
                                    setUser((prev) => ({
                                        ...prev,
                                        avatarUrl: url,
                                    }));

                                    await axiosClient.put("/auth/avatar", {
                                        avatarUrl: url,
                                    });
                                }}
                            />
                        </div>
                    </div>

                    {/* FORM */}
                    <div className="form-grid">
                        <div>
                            <label>Full Name</label>
                            <input
                                value={user?.fullName || ""}
                                onChange={(e) =>
                                    setUser({
                                        ...user,
                                        fullName: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div>
                            <label>Email</label>
                            <input
                                value={user?.email || ""}
                                disabled
                            />
                        </div>

                        <div>
                            <label>Phone Number</label>
                            <input
                                value={user?.phone || ""}
                                onChange={(e) =>
                                    setUser({
                                        ...user,
                                        phone: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div>
                            <label>School</label>
                            <input
                                value={user?.school || ""}
                                onChange={(e) =>
                                    setUser({
                                        ...user,
                                        school: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className="bio-section">
                        <label>Bio</label>
                        <textarea
                            rows="4"
                            value={user?.bio || ""}
                            onChange={(e) =>
                                setUser({
                                    ...user,
                                    bio: e.target.value,
                                })
                            }
                        />
                    </div>

                    <div className="actions">
                        <button
                            className="password-btn"
                            onClick={() => navigate("/change-password")}
                        >
                            Change Password
                        </button>

                        <div className="right-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => navigate("/")}
                            >
                                Cancel
                            </button>

                            <button
                                className="save-btn"
                                onClick={handleSave}
                            >
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
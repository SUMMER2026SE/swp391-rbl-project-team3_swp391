import { useNavigate } from "react-router-dom";
import "../css/HomePage.css";

export default function HomePage() {
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const user = JSON.parse(
        localStorage.getItem("user")
    );

    return (
        <div className="home-layout">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="logo">PrepAce</div>

                <ul className="menu">
                    <li>🏠 Trang chủ</li>
                    <li>📚 Khóa học</li>
                    <li>📝 Luyện đề</li>
                    <li>📊 Tiến độ</li>
                    <li>🎯 Tư vấn ngành</li>
                </ul>

                <div className="sidebar-actions">
                    {token ? (
                        <>
                            <button
                                className="profile-btn"
                                onClick={() =>
                                    navigate("/profile")
                                }
                            >
                                {user?.fullName || "Profile"}
                            </button>

                            <button
                                className="logout-btn"
                                onClick={() => {
                                    localStorage.removeItem(
                                        "token"
                                    );

                                    localStorage.removeItem(
                                        "user"
                                    );

                                    navigate("/");
                                }}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() =>
                                    navigate("/auth", {
                                        state: {
                                            mode: "login",
                                        },
                                    })
                                }
                            >
                                Login
                            </button>

                            <button
                                className="register-btn"
                                onClick={() =>
                                    navigate("/auth", {
                                        state: {
                                            mode: "register",
                                        },
                                    })
                                }
                            >
                                Register
                            </button>
                        </>
                    )}
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="content">
                {/* HERO */}
                <section className="hero">
                    <h1>
                        Nền tảng học tập dành cho học sinh THPT
                        chuẩn bị thi Đại học 🎓
                    </h1>

                    <p>
                        Ôn luyện kiến thức THPT, làm bài kiểm tra
                        online và theo dõi tiến độ học tập mỗi ngày.
                    </p>

                    <button
                        className="start-btn"
                        onClick={() =>
                            navigate("/auth")
                        }
                    >
                        Bắt đầu học ngay
                    </button>
                </section>

                {/* CARDS */}
                <section className="cards">
                    <div className="card">
                        <h3>📚 Khóa học</h3>
                        <p>
                            Toán, Lý, Hóa, Văn, Anh đầy đủ theo
                            chương trình THPT.
                        </p>
                    </div>

                    <div className="card">
                        <h3>📝 Luyện đề</h3>
                        <p>
                            Hàng trăm đề thi thử và bài kiểm tra.
                        </p>
                    </div>

                    <div className="card">
                        <h3>📊 Tiến độ</h3>
                        <p>
                            Theo dõi kết quả và cải thiện từng ngày.
                        </p>
                    </div>
                </section>

                {/* CTA */}
                <section className="cta">
                    <h2>Sẵn sàng cho kỳ thi Đại học?</h2>

                    <p>
                        Đăng ký miễn phí và bắt đầu ngay hôm nay.
                    </p>

                    <button
                        className="register-btn"
                            onClick={() =>
                                navigate("/auth", {
                                    state: {
                                        mode: "register",
                                    },
                                })
                            }
                        >
                            Đăng Ký Miễn Phí
                    </button>
                </section>
            </main>
        </div>
    );
}
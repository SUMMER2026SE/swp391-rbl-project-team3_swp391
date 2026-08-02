import { useEffect, useState } from "react";
import { useNavigate,useParams } from "react-router-dom";
import { getChapterSummary } from "../../services/aiChapterSummaryService";
import "../css/AIChapterSummaryPage.css";

function AIChapterSummaryPage() {
    const { chapterId } = useParams();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingStep, setLoadingStep] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        loadSummary();
    }, []);

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const loadSummary = async () => {
        try {
            setLoadingStep(1);
            await sleep(600);
            setLoadingStep(2);
            await sleep(800);
            setLoadingStep(3);
            const data = await getChapterSummary(chapterId);
            await sleep(600);
            setSummary(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="summary-loading-container">
                <div className="summary-loading-card">
                    <div className="ai-icon">
                        🤖
                    </div>
                    <h2>AI đang tạo bản tổng kết</h2>
                    <p>
                        Vui lòng chờ trong giây lát...
                    </p>
                    <div className="loading-steps">
                        <div className={loadingStep >= 1 ? "step done" : "step"}>
                            {loadingStep >= 1 ? "✅" : "⏳"}
                            <span>Đọc toàn bộ nội dung chương học</span>
                        </div>
                        <div className={loadingStep >= 2 ? "step done" : "step"}>
                            {loadingStep >= 2 ? "✅" : "⏳"}
                            <span>Phân tích tiến độ học tập</span>
                        </div>
                        <div className={loadingStep >= 3 ? "step done" : "step"}>
                            {loadingStep >= 3 ? "✅" : "⏳"}
                            <span>Tạo AI Summary cá nhân hóa</span>
                        </div>
                    </div>
                    <div className="typing-loader">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="summary-loading">
                Không tìm thấy AI Summary.
            </div>
        );
    }

    return (
        <div className="summary-page">
            <div className="summary-card">
                <div className="summary-header">
                    <div
                        onClick={() => navigate(-1)}
                        style={{
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "rgba(255, 255, 255, 0.2)",
                            padding: "8px 16px",
                            borderRadius: "99px",
                            fontSize: "14px",
                            fontWeight: "600",
                            marginBottom: "20px",
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"}
                    >
                        <span>&larr;</span> Quay về khóa học
                    </div>
                    <br/>
                    <span className="summary-badge">
                        🤖 AI Chapter Summary
                    </span>

                    <h1>{summary.courseTitle}</h1>
                    <h2>{summary.chapterTitle}</h2>

                    <div className="summary-meta">
                        <span>
                            🧠 {summary.aiModel}
                        </span>
                        <span>
                            📅 {new Date(summary.createdAt).toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="summary-content">
                    {summary.summaryContent
                        .split("\n")
                        .filter(line => line.trim() !== "")
                        .map((line, index) => (
                            <p key={index}>{line}</p>
                        ))}
                </div>
            </div>
        </div>
    );
}

export default AIChapterSummaryPage;
import { useEffect, useState } from "react";
import { useNavigate,useParams } from "react-router-dom";
import { getChapterSummary } from "../../services/aiChapterSummaryService";
import "../css/AIChapterSummaryPage.css";

function AIChapterSummaryPage() {
    const { chapterId } = useParams();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        try {
            const data = await getChapterSummary(chapterId);
            setSummary(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="summary-loading">
                🤖 AI đang chuẩn bị bản tổng kết...
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
            <div
                className="topbar-left"
                onClick={() => navigate(-1)}
                style={{ cursor: "pointer", marginBottom: "20px" }}
            >
                ← Quay về khóa học
            </div>
            <div className="summary-card">
                <div className="summary-header">
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
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/LearningPage.css";

export default function LearningPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [expandedChapter, setExpandedChapter] = useState(0);
    const [resumePrompt, setResumePrompt] = useState(null); // Quản lý popup xem tiếp video


    // State quản lý danh sách câu hỏi QnA
    const [questions, setQuestions] = useState([]);
    const [newQuestionContent, setNewQuestionContent] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    const [qnaTimestamp, setQnaTimestamp] = useState(null);

    // State quản lý Ghi chú
    const [notes, setNotes] = useState([]);
    const [newNoteContent, setNewNoteContent] = useState("");

    // IN-VIDEO QUIZZES STATES
    const [inVideoQuestions, setInVideoQuestions] = useState([]);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [answeredQuizzes, setAnsweredQuizzes] = useState(new Set());
    const [quizSelectedOption, setQuizSelectedOption] = useState("");
    
    const inVideoQuestionsRef = useRef([]);
    const answeredQuizzesRef = useRef(new Set());
    useEffect(() => { inVideoQuestionsRef.current = inVideoQuestions; }, [inVideoQuestions]);
    useEffect(() => { answeredQuizzesRef.current = answeredQuizzes; }, [answeredQuizzes]);

    useEffect(() => {
        if (!currentLesson) return;
        const fetchInVideoQuestions = async () => {
            try {
                const res = await axiosClient.get(`/outlines/lessons/${currentLesson.id}/in-video-questions`);
                setInVideoQuestions(res.data || []);
                setAnsweredQuizzes(new Set()); // Reset khi đổi bài
                setCurrentQuiz(null);
            } catch (err) {
                console.error("Lỗi lấy câu hỏi popup", err);
            }
        };
        fetchInVideoQuestions();
    }, [currentLesson]);

    const checkQuiz = (currentTime, pauseFunc) => {
        const questions = inVideoQuestionsRef.current;
        const answered = answeredQuizzesRef.current;
        if (!questions || questions.length === 0) return;
        
        // Bắt chính xác hơn: Nếu thời gian hiện tại đã vượt qua mốc thời gian cài đặt và chưa trả lời
        const quiz = questions.find(q => currentTime >= Number(q.timestampSeconds) && !answered.has(q.id));
        
        if (quiz && !currentQuiz) {
            pauseFunc();
            setCurrentQuiz(quiz);
            setQuizSelectedOption("");
        }
    };

    const videoRef = useRef(null);
    const youtubePlayerRef = useRef(null);

    const getCurrentVideoTime = () => {
        if (currentLesson && isYouTube(currentLesson.videoUrl)) {
            return youtubePlayerRef.current && youtubePlayerRef.current.getCurrentTime ? Math.floor(youtubePlayerRef.current.getCurrentTime()) : 0;
        } else {
            return videoRef.current ? Math.floor(videoRef.current.currentTime) : 0;
        }
    };

    const seekToTime = (seconds) => {
        if (currentLesson && isYouTube(currentLesson.videoUrl)) {
            if (youtubePlayerRef.current && youtubePlayerRef.current.seekTo) {
                youtubePlayerRef.current.seekTo(seconds, true);
            }
        } else {
            if (videoRef.current) {
                videoRef.current.currentTime = seconds;
                videoRef.current.play();
            }
        }
    };

    const formatTime = (totalSeconds) => {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const [completedLessonIds, setCompletedLessonIds] = useState([]);
    const [isEnrolled, setIsEnrolled] = useState(false); // Thêm state kiểm tra Mua Khóa Học

    // 1. GỌI API LẤY DỮ LIỆU KHÓA HỌC THẬT VÀ TIẾN ĐỘ
    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                const response = await axiosClient.get(`/courses/${courseId}`);
                let fetchedCourse = response.data;
                
                // KIỂM TRA BẢO MẬT: XEM ĐÃ MUA KHÓA HỌC CHƯA
                let userIsEnrolled = false;
                try {
                    const token = localStorage.getItem("token");
                    if (token) {
                        const enrollRes = await axiosClient.get(`/courses/${courseId}/check-enrollment`);
                        if (enrollRes.data && enrollRes.data.isEnrolled) {
                            userIsEnrolled = true;
                            setIsEnrolled(true);
                        }
                    }
                } catch (e) {
                    console.log("Lỗi check enrollment", e);
                }

                // NẾU KHÓA HỌC MIỄN PHÍ -> TỰ ĐỘNG XEM NHƯ ĐÃ ĐĂNG KÝ
                const cleanPrice = Number(String(fetchedCourse.price || fetchedCourse.Price || 0).replace(/[^0-9]/g, ''));
                if (cleanPrice === 0 && localStorage.getItem("token")) {
                    userIsEnrolled = true;
                    setIsEnrolled(true);
                }

                // NẾU CHƯA MUA HOẶC CHƯA ĐĂNG NHẬP: CHỈ HIỂN THỊ CÁC VIDEO ĐƯỢC GIÁO VIÊN CHỌN HỌC THỬ (isPreview = true)
                // NẾU KHÔNG CÓ VIDEO NÀO, MẶC ĐỊNH LẤY VIDEO ĐẦU TIÊN
                if (!userIsEnrolled && fetchedCourse.chapters) {
                    let hasPreview = false;
                    const filteredChapters = fetchedCourse.chapters.map(chapter => {
                        const previewLessons = (chapter.lessons || []).filter(lesson => lesson.isPreview || lesson.is_preview);
                        if (previewLessons.length > 0) hasPreview = true;
                        return {
                            ...chapter,
                            lessons: previewLessons
                        };
                    }).filter(chapter => chapter.lessons.length > 0);

                    if (hasPreview) {
                        fetchedCourse.chapters = filteredChapters;
                    } else if (fetchedCourse.chapters.length > 0 && fetchedCourse.chapters[0].lessons && fetchedCourse.chapters[0].lessons.length > 0) {
                        const firstChapter = fetchedCourse.chapters[0];
                        const firstLesson = firstChapter.lessons[0];
                        fetchedCourse.chapters = [{
                            ...firstChapter,
                            lessons: [{ ...firstLesson, isPreview: true }]
                        }];
                    } else {
                        fetchedCourse.chapters = [];
                    }
                }

                setCourse(fetchedCourse);

                if (fetchedCourse.chapters?.[0]?.lessons?.[0]) {
                    setCurrentLesson(fetchedCourse.chapters[0].lessons[0]);
                }

                // Lấy tiến độ (chỉ lấy nếu đã mua để tránh lỗi API)
                if (userIsEnrolled) {
                    try {
                        const progressRes = await axiosClient.get(`/reports/progress/course/${courseId}/completed`);
                        if (progressRes.data) {
                            setCompletedLessonIds(progressRes.data);
                        }
                    } catch (e) { console.log(e); }
                }
            } catch (error) {
                console.error("Lỗi tải nội dung bài học:", error);
            }
        };
        fetchCourseData();
    }, [courseId]);

    // Tự động tải danh sách câu hỏi khi chuyển bài
    useEffect(() => {
        const fetchQuestionsAndNotes = async () => {
            if (currentLesson?.id) {
                try {
                    const response = await axiosClient.get(`/questions/lesson/${currentLesson.id}`);
                    setQuestions(response.data);
                } catch (error) {
                    console.error("Lỗi tải danh sách câu hỏi thảo luận:", error);
                }
                
                try {
                    const resNotes = await axiosClient.get(`/notes/lessons/${currentLesson.id}`);
                    setNotes(resNotes.data);
                } catch (error) {
                    console.error("Lỗi tải danh sách ghi chú:", error);
                }
            }
        };
        fetchQuestionsAndNotes();
    }, [currentLesson]);

    // AUTO SYNC TIẾN ĐỘ VIDEO LÊN BACKEND MỖI 10 GIÂY
    useEffect(() => {
        if (!currentLesson) return;
        const syncInterval = setInterval(() => {
            const currentTime = getCurrentVideoTime();
            if (currentTime > 0) {
                const token = localStorage.getItem("token");
                if (token) {
                    axiosClient.post("/reports/progress", {
                        lessonId: currentLesson.id,
                        lastVideoTime: currentTime
                    }).catch(() => {});
                }
            }
        }, 10000); // 10s lưu 1 lần
        return () => clearInterval(syncInterval);
    }, [currentLesson]);

    // Tự động tua video về mốc cũ (DÀNH CHO VIDEO THƯỜNG - TẢI LÊN MP4)
    useEffect(() => {
        if (!currentLesson) return;
        
        let timeoutId;
        const currentVideoUrl = currentLesson.videoUrl || "";
        
        if (!isYouTube(currentVideoUrl)) {
            const fetchAndResume = async () => {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) return;
                    const res = await axiosClient.get(`/reports/progress/lesson/${currentLesson.id}`);
                    const savedTime = res.data?.lastVideoTime || 0;
                    if (savedTime > 0 && videoRef.current) {
                        setResumePrompt({ savedTime: parseFloat(savedTime) });
                    }
                } catch(e) {
                    console.log(e);
                }
            };
            timeoutId = setTimeout(fetchAndResume, 500);
        }
        
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [currentLesson]);

    const handleMarkAsComplete = async (lessonId) => {
        if (!lessonId) return;
        
        const isCurrentlyCompleted = completedLessonIds.includes(lessonId);
        const newStatus = !isCurrentlyCompleted;

        try {
            const token = localStorage.getItem("token");
            if (!token) return alert("Vui lòng đăng nhập!");
            
            await axiosClient.post("/reports/progress", {
                lessonId: lessonId,
                isCompleted: newStatus
            });
            
            if (newStatus) {
                setCompletedLessonIds(prev => [...prev, lessonId]);
            } else {
                setCompletedLessonIds(prev => prev.filter(id => id !== lessonId));
            }
        } catch (error) {
            console.error("Lỗi cập nhật tiến độ:", error);
        }
    };

    // XỬ LÝ RIÊNG CHO YOUTUBE: Tích hợp API của YouTube để theo dõi tiến độ và hỏi người dùng
    useEffect(() => {
        if (!currentLesson || !currentLesson.videoUrl || !isYouTube(currentLesson.videoUrl)) return;

        let player;
        let progressInterval;
        let timeoutId;
        let isCancelled = false;

        const initYouTubePlayer = async () => {
            if (isCancelled) return;
            const embedUrl = getYouTubeEmbedUrl(currentLesson.videoUrl);
            const videoId = embedUrl.includes('/embed/') ? embedUrl.split('/embed/')[1].split('?')[0] : "";
            if (!videoId) return;
            
            // Xử lý hỏi xem tiếp hay không trước khi load iframe bằng Backend
            let startSeconds = 0;
            try {
                const token = localStorage.getItem("token");
                if (token) {
                    const res = await axiosClient.get(`/reports/progress/lesson/${currentLesson.id}`);
                    const savedTime = res.data?.lastVideoTime || 0;
                    if (savedTime > 0) {
                        const wantsToResume = window.confirm("Hệ thống ghi nhận bạn đang xem dở bài học này. Bạn có muốn tiếp tục xem từ vị trí đã lưu không?\n\n(Bấm OK để xem tiếp, Cancel để xem lại từ đầu)");
                        if (wantsToResume) {
                            startSeconds = parseFloat(savedTime);
                        }
                    }
                }
            } catch(e) { console.log(e); }

            player = new window.YT.Player('youtube-player-container', {
                videoId: videoId,
                playerVars: {
                    rel: 0
                },
                events: {
                    onReady: (event) => {
                        youtubePlayerRef.current = event.target;
                        // Nhảy đến đúng số giây đang xem dở một cách chính xác
                        if (startSeconds > 0) {
                            event.target.seekTo(startSeconds, true);
                        }
                    },
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.PLAYING) {
                            progressInterval = setInterval(() => {
                                if (player && player.getCurrentTime) {
                                    const currentTime = player.getCurrentTime();
                                    checkQuiz(currentTime, () => player.pauseVideo());
                                }
                            }, 1000);
                        } else {
                            if (progressInterval) clearInterval(progressInterval);
                        }
                    }
                }
            });
        };

        if (!window.YT) {
            const script = document.createElement('script');
            script.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(script);
            window.onYouTubeIframeAPIReady = initYouTubePlayer;
        } else if (window.YT && window.YT.Player) {
            timeoutId = setTimeout(initYouTubePlayer, 100); 
        }

        return () => {
            isCancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
            if (progressInterval) clearInterval(progressInterval);
            if (player && player.destroy) player.destroy();
        };
    }, [currentLesson]);

    const handleTimeUpdate = () => {
        // Hàm này chỉ chạy cho video thường (MP4) để popup quiz
        if (videoRef.current && currentLesson && !isYouTube(currentLesson.videoUrl)) {
            const currentTime = videoRef.current.currentTime;
            checkQuiz(currentTime, () => videoRef.current.pause());
        }
    };

    // Hàm nhận diện YouTube
    const isYouTube = (url) => url && typeof url === "string" && (url.includes("youtube.com") || url.includes("youtu.be"));
    const getYouTubeEmbedUrl = (url) => {
        if (!url || typeof url !== "string") return "";
        let videoId = "";
        if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1]?.split("?")[0];
        } else if (url.includes("watch?v=")) {
            videoId = url.split("watch?v=")[1]?.split("&")[0];
        } else if (url.includes("embed/")) {
            videoId = url.split("embed/")[1]?.split("?")[0];
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : url;
    };

    const handleDownload = async (material) => {
        const pathUrl = material.fileUrl || material.file_url || material.url || material.link || material.path;
        if (!pathUrl) {
            alert("Rất tiếc, không tìm thấy đường dẫn tải file của tài liệu này!");
            return;
        }

        try {
            // Tải file về dạng Blob
            const response = await fetch(pathUrl);
            if (!response.ok) throw new Error("Lỗi mạng khi tải file");

            const contentType = response.headers.get("content-type");
            let extension = "";

            if (contentType) {
                if (contentType.includes("application/pdf")) extension = ".pdf";
                else if (contentType.includes("wordprocessingml.document")) extension = ".docx";
                else if (contentType.includes("msword")) extension = ".doc";
                else if (contentType.includes("spreadsheetml.sheet")) extension = ".xlsx";
                else if (contentType.includes("ms-excel")) extension = ".xls";
                else if (contentType.includes("presentationml.presentation")) extension = ".pptx";
                else if (contentType.includes("ms-powerpoint")) extension = ".ppt";
                else if (contentType.includes("text/plain")) extension = ".txt";
                else if (contentType.includes("image/jpeg")) extension = ".jpg";
                else if (contentType.includes("image/png")) extension = ".png";
                else if (contentType.includes("application/zip")) extension = ".zip";
                else if (contentType.includes("application/x-rar")) extension = ".rar";
            }

            const blob = await response.blob();
            
            // 1. Thử trích xuất từ URL (chính xác nhất cho các file mới tải lên)
            if (!extension) {
                const urlWithoutQuery = pathUrl.split('?')[0];
                const lastPart = urlWithoutQuery.split('/').pop();
                if (lastPart && lastPart.includes('.')) {
                    extension = lastPart.substring(lastPart.lastIndexOf('.'));
                }
            }

            // 2. Thử xem tên tài liệu (title) do giáo viên đặt có chứa đuôi file không (vd: baitap.xlsx)
            if (!extension && material.title && material.title.includes('.')) {
                 const possibleExt = material.title.substring(material.title.lastIndexOf('.'));
                 if (possibleExt.length >= 2 && possibleExt.length <= 6 && /^\.[a-zA-Z0-9]+$/.test(possibleExt)) {
                     extension = possibleExt;
                 }
            }
            
            // 3. Nếu Content-Type là octet-stream, URL không có đuôi, Tên cũng không có đuôi
            // Dùng "Magic Bytes" để đoán định dạng (Fallback cuối cùng)
            if (!extension) {
                try {
                    const arr = (new Uint8Array(await blob.slice(0, 4).arrayBuffer())).reduce((a, b) => a + b.toString(16).padStart(2, '0'), '');
                    if (arr === '25504446') {
                        extension = ".pdf";
                    } else if (arr === '504b0304') { 
                        // ZIP archive - Thường là DOCX, XLSX, PPTX
                        extension = ".docx"; // Mặc định DOCX cho file học liệu
                    } else if (arr === 'd0cf11e0') { 
                        // OLE file - DOC, XLS, PPT cũ
                        extension = ".doc";
                    }
                } catch (e) {
                    console.error("Lỗi khi đọc magic bytes:", e);
                }
            }

            // Cuối cùng nếu vẫn không có, gán mặc định là .pdf cho an toàn (vì tài liệu học liệu 90% là PDF)
            if (!extension) {
                extension = ".pdf";
            }

            // Tạo tên file
            let downloadName = material.title || "TaiLieu";
            // Bỏ ký tự đặc biệt có thể gây lỗi hệ điều hành
            downloadName = downloadName.replace(/[\\/:*?"<>|]/g, ''); 
            
            if (extension && !downloadName.toLowerCase().endsWith(extension.toLowerCase())) {
                downloadName += extension;
            }

            // Chuyển Data thành URL và tải xuống
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = blobUrl;
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            
            // Dọn dẹp memory
            setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
                a.remove();
            }, 100);

        } catch (error) {
            console.error("Lỗi khi tải trực tiếp qua blob, dùng cách dự phòng mở tab mới:", error);
            
            // Cách dự phòng nếu fetch bị chặn CORS
            let finalUrl = pathUrl;
            if (pathUrl.includes("res.cloudinary.com") && pathUrl.includes("/upload/")) {
                let safeTitle = material.title ? material.title.replace(/[^a-zA-Z0-9.\-_]/g, '_') : "TaiLieu";
                finalUrl = pathUrl.replace("/upload/", `/upload/fl_attachment:${safeTitle}.pdf/`);
            }
            window.open(finalUrl, "_blank");
        }
    };

    const handlePostQuestion = async () => {
        if (!newQuestionContent.trim()) {
            alert("Vui lòng nhập nội dung câu hỏi thảo luận!");
            return;
        }
        try {
            const payload = {
                content: newQuestionContent,
                lessonId: currentLesson.id
            };
            if (qnaTimestamp !== null) {
                payload.timestampSeconds = qnaTimestamp;
            }
            const response = await axiosClient.post("/questions", payload);
            // Bổ sung mảng answers rỗng cho câu hỏi mới
            setQuestions([{ ...response.data, answers: [] }, ...questions]);
            setNewQuestionContent("");
            setQnaTimestamp(null);
        } catch (error) {
            console.error("Lỗi khi đăng câu hỏi:", error);
        }
    };

    const handlePostNote = async () => {
        if (!newNoteContent.trim()) {
            alert("Vui lòng nhập nội dung ghi chú!");
            return;
        }
        try {
            const time = getCurrentVideoTime();
            const response = await axiosClient.post(`/notes/lessons/${currentLesson.id}`, {
                content: newNoteContent,
                timestampSeconds: time
            });
            setNotes([...notes, response.data].sort((a, b) => a.timestampSeconds - b.timestampSeconds));
            setNewNoteContent("");
        } catch (error) {
            console.error("Lỗi khi thêm ghi chú:", error);
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm("Bạn có chắc muốn xóa ghi chú này không?")) return;
        try {
            await axiosClient.delete(`/notes/${noteId}`);
            setNotes(notes.filter(n => n.id !== noteId));
        } catch (error) {
            console.error("Lỗi khi xóa ghi chú:", error);
        }
    };

    const handlePostAnswer = async (questionId) => {
        if (!replyContent.trim()) {
            alert("Vui lòng nhập nội dung trả lời!");
            return;
        }
        try {
            const response = await axiosClient.post(`/questions/${questionId}/answers`, {
                content: replyContent
            });
            
            // Cập nhật lại danh sách questions
            setQuestions(questions.map(q => {
                if (q.id === questionId) {
                    return {
                        ...q,
                        answers: [...(q.answers || []), response.data]
                    };
                }
                return q;
            }));
            
            setReplyingTo(null);
            setReplyContent("");
        } catch (error) {
            console.error("Lỗi khi đăng câu trả lời:", error);
        }
    };

    const totalLessons = course?.chapters?.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0) || 0;
    const progress = totalLessons > 0 ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0;

    if (!course || !currentLesson) {
        return <div className="loading-spinner" style={{ textAlign: "center", paddingTop: "100px", fontSize: "18px" }}>⏳ Đang tải bài giảng...</div>;
    }

    return (
        <div className="learning-page">
            <header className="learning-topbar">
                <div className="topbar-left" onClick={() => navigate(`/course/${courseId || 1}`)} style={{ cursor: 'pointer' }}>
                    <span className="back-arrow">←</span>
                    <h2 className="course-nav-title">{course.title || course.course_title}</h2>
                </div>
                <div className="topbar-right">
                    <div className="progress-box">
                        <span>Tiến độ: <strong>{progress}%</strong></span>
                        <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="learning-workspace">
                <div className="learning-main">
    {/* KHỐI VIDEO CONTAINER ĐÃ ĐƯỢC LÀM SẠCH CÚ PHÁP */}
    <div className="video-container" style={{ position: "relative", width: "100%", aspectRatio: "16/9", backgroundColor: "#000", borderRadius: "8px", overflow: "hidden" }}>
        <div key={currentLesson.id} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
            {!isEnrolled && !currentLesson.isPreview && !currentLesson.is_preview ? (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backgroundColor: "#fef3c7", color: "#b45309", padding: "20px", textAlign: "center", zIndex: 10 }}>
                    <span style={{ fontSize: "48px", marginBottom: "15px" }}>🔒</span>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "22px", fontWeight: "700" }}>Video này đã bị khóa</h3>
                    <p style={{ margin: 0, fontSize: "16px", maxWidth: "450px", lineHeight: "1.5" }}>Bạn cần <strong>Mua khóa học</strong> để xem được video bài giảng này. Hãy đăng ký ngay để mở khóa toàn bộ lộ trình học tập nhé!</p>
                </div>
            ) : currentLesson.videoUrl ? (
                <>
                    {resumePrompt && (
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.7)", zIndex: 50 }}>
                            <div style={{ backgroundColor: "#1e293b", padding: "24px", borderRadius: "12px", textAlign: "center", maxWidth: "400px", color: "#f8fafc", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
                                <div style={{ fontSize: "36px", marginBottom: "12px" }}>⏱️</div>
                                <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "600" }}>Tiếp tục bài học?</h3>
                                <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#cbd5e1", lineHeight: "1.5" }}>
                                    Hệ thống ghi nhận bạn đang xem dở bài học này. Bạn có muốn tiếp tục xem từ vị trí đã lưu không?
                                </p>
                                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                                    <button 
                                        onClick={() => {
                                            if (videoRef.current) {
                                                videoRef.current.currentTime = resumePrompt.savedTime;
                                                videoRef.current.play().catch(e => console.log("Auto-play blocked:", e));
                                            }
                                            setResumePrompt(null);
                                        }}
                                        style={{ padding: "8px 20px", borderRadius: "6px", border: "none", backgroundColor: "#3b82f6", color: "white", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
                                    >
                                        Xem tiếp
                                    </button>
                                    <button 
                                        onClick={() => setResumePrompt(null)}
                                        style={{ padding: "8px 20px", borderRadius: "6px", border: "1px solid #475569", backgroundColor: "transparent", color: "#cbd5e1", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
                                    >
                                        Từ đầu
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {isYouTube(currentLesson.videoUrl) ? (
                    // Phải dùng thẻ div rỗng để YouTube API tự động nhúng iframe vào đây một cách chính xác
                    <div id="youtube-player-container" style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}></div>
                ) : (
                    <video
                        ref={videoRef}
                        src={currentLesson.videoUrl.startsWith("http") ? currentLesson.videoUrl : `http://localhost:8080${currentLesson.videoUrl}`}
                        controls
                        onTimeUpdate={handleTimeUpdate}
                        style={{ width: "100%", height: "100%", display: "block", position: "absolute", top: 0, left: 0 }}
                    />
                )}
                </>
            ) : (
                <div className="video-placeholder" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                    <div className="play-button-large" style={{ fontSize: "40px", marginBottom: "10px" }}>▶</div>
                    <p style={{ margin: 0, color: "#fff" }}>Chưa có video: {currentLesson.title}</p>
                </div>
            )}
        </div>

        {/* POP-UP QUIZ OVERLAY */}
        {currentQuiz && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50, fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
                <div style={{ background: "#fff", padding: "30px", borderRadius: "12px", width: "80%", maxWidth: "550px", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "2px solid #fde68a", paddingBottom: "10px", marginBottom: "20px" }}>
                        <span style={{ fontSize: "24px" }}>🧠</span>
                        <h3 style={{ margin: 0, color: "#b45309", fontSize: "18px", fontWeight: "700" }}>Câu hỏi tương tác</h3>
                    </div>
                    <p style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px", color: "#1e293b", lineHeight: "1.5" }}>{currentQuiz.questionText}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {['A', 'B', 'C', 'D'].map(opt => (
                            <button 
                                key={opt}
                                onClick={() => setQuizSelectedOption(opt)}
                                style={{ 
                                    padding: "12px 15px", 
                                    textAlign: "left", 
                                    background: quizSelectedOption === opt ? "#eff6ff" : "#f8fafc", 
                                    border: `2px solid ${quizSelectedOption === opt ? "#3b82f6" : "#e2e8f0"}`, 
                                    borderRadius: "8px", 
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: quizSelectedOption === opt ? "600" : "500",
                                    color: quizSelectedOption === opt ? "#1d4ed8" : "#334155",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                <strong style={{ display: "inline-block", width: "25px", color: quizSelectedOption === opt ? "#2563eb" : "#64748b" }}>{opt}.</strong> {currentQuiz[`option${opt}`]}
                            </button>
                        ))}
                    </div>
                    <div style={{ marginTop: "25px", display: "flex", justifyContent: "flex-end" }}>
                        <button 
                            onClick={() => {
                                if (!quizSelectedOption) return alert("Vui lòng chọn 1 đáp án!");
                                if (quizSelectedOption === currentQuiz.correctOption) {
                                    alert("Chính xác! Mời bạn tiếp tục xem bài giảng.");
                                    
                                    setAnsweredQuizzes(prev => {
                                        const newSet = new Set(prev);
                                        newSet.add(currentQuiz.id);
                                        return newSet;
                                    });
                                    
                                    setCurrentQuiz(null);
                                    
                                    if (isYouTube(currentLesson.videoUrl)) {
                                        const iframe = document.getElementById('youtube-player-container');
                                        if (iframe && iframe.contentWindow) {
                                            iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                                        }
                                    } else {
                                        if (videoRef.current) videoRef.current.play();
                                    }
                                } else {
                                    alert("Sai rồi! Hãy suy nghĩ lại và chọn đáp án chính xác để được học tiếp nhé.");
                                }
                            }}
                            style={{ padding: "12px 25px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "15px", boxShadow: "0 4px 6px rgba(245, 158, 11, 0.2)" }}
                        >
                            Trả lời & Xem tiếp
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>

                    <div className="learning-content">
                        <h1 className="current-lesson-title">{currentLesson.title}</h1>

                        <div className="tabs">
                            <button className={activeTab === "overview" ? "tab active" : "tab"} onClick={() => setActiveTab("overview")}>Tổng quan</button>
                            <button className={activeTab === "materials" ? "tab active" : "tab"} onClick={() => setActiveTab("materials")}>Tài liệu ({currentLesson.materials ? currentLesson.materials.length : 0})</button>
                            <button className={activeTab === "qna" ? "tab active" : "tab"} onClick={() => setActiveTab("qna")}>Hỏi đáp ({questions.length})</button>
                            <button className={activeTab === "notes" ? "tab active" : "tab"} onClick={() => setActiveTab("notes")}>Ghi chú</button>
                        </div>

                        <div className="tab-content">
                            {activeTab === "overview" && (
                                <div className="overview-tab">
                                    <div className="overview-content">
                                        <p>{currentLesson.description || "Bài học này chưa có mô tả chi tiết từ giảng viên."}</p>
                                        <p><strong>Nhiệm vụ:</strong> Xem hết video để mở khóa bài tiếp theo.</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === "materials" && (
                                <div className="materials-tab">
                                    {isEnrolled ? (
                                        currentLesson.materials && currentLesson.materials.length > 0 ? (
                                            currentLesson.materials.map((material) => (
                                                <div className="material-file" key={material.id}>
                                                    📄 <span>{material.title}</span>
                                                    {/* 🔥 CHUẨN XÁC: Truyền trọn vẹn object material vào hàm xử lý mới */}
                                                    <button
                                                        onClick={() => handleDownload(material)}
                                                        className="download-btn"
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        Tải xuống
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{ padding: "10px", color: "#666" }}>Bài học này chưa có tài liệu đính kèm.</p>
                                        )
                                    ) : (
                                        <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#fef3c7", color: "#b45309", borderRadius: "8px", border: "1px solid #fde68a" }}>
                                            <span style={{ fontSize: "24px", display: "block", marginBottom: "10px" }}>🔒</span>
                                            Bạn cần <strong>Mua khóa học</strong> để xem và tải các tài liệu đính kèm.
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "qna" && (
                                <div className="qna-tab" style={{ padding: "15px 0" }}>
                                    <div className="qna-input-box" style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <input
                                                type="text"
                                                placeholder="Đặt câu hỏi thảo luận về bài học này..."
                                                className="qna-input"
                                                value={newQuestionContent}
                                                onChange={(e) => setNewQuestionContent(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handlePostQuestion();
                                                    }
                                                }}
                                                style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                                            />
                                            <button className="ask-btn" onClick={handlePostQuestion} style={{ padding: "10px 20px", borderRadius: "6px", backgroundColor: "#007bff", color: "#fff", border: "none", cursor: "pointer" }}>Gửi câu hỏi</button>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", alignSelf: "flex-start", marginTop: "-5px", marginLeft: "5px" }}>
                                            <input 
                                                type="checkbox" 
                                                id="qna-timestamp-checkbox" 
                                                checked={qnaTimestamp !== null}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setQnaTimestamp(getCurrentVideoTime());
                                                    } else {
                                                        setQnaTimestamp(null);
                                                    }
                                                }}
                                                style={{ cursor: "pointer", width: "16px", height: "16px", margin: 0 }}
                                            />
                                            <label htmlFor="qna-timestamp-checkbox" style={{ fontSize: "14px", color: "#555", cursor: "pointer", userSelect: "none" }}>
                                                Đính kèm thời gian hiện tại {qnaTimestamp !== null ? `[${formatTime(qnaTimestamp)}]` : ""}
                                            </label>
                                        </div>
                                    </div>

                                    <div className="questions-list" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                        {questions.length > 0 ? (
                                            questions.map((q) => (
                                                <div key={q.id} className="question-thread" style={{ marginBottom: "15px" }}>
                                                    <div className="question-item" style={{ display: "flex", gap: "12px", padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                                                        <img
                                                            src={
                                                                q.userAvatarUrl && q.userAvatarUrl !== "null" && q.userAvatarUrl.trim() !== ""
                                                                    ? (q.userAvatarUrl.startsWith("http") ? q.userAvatarUrl : `http://localhost:8080${q.userAvatarUrl}`)
                                                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(q.userFullName || "User")}&background=64748b&color=fff`
                                                            }
                                                            onError={(e) => {
                                                                e.target.onerror = null; 
                                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(q.userFullName || "User")}&background=64748b&color=fff`;
                                                            }}
                                                            alt="Avatar"
                                                            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                                                        />
                                                        <div className="question-body" style={{ flex: 1 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                                                                <h5 style={{ margin: 0, fontSize: "14px", color: "#333", display: "flex", alignItems: "center", gap: "6px" }}>
                                                                    {q.userFullName}
                                                                    {q.userRoleId === 2 && <span style={{ backgroundColor: "#28a745", color: "#fff", fontSize: "10px", padding: "2px 6px", borderRadius: "4px" }}>Giáo viên</span>}
                                                                    {q.userRoleId === 3 && <span style={{ backgroundColor: "#6c757d", color: "#fff", fontSize: "10px", padding: "2px 6px", borderRadius: "4px" }}>Học sinh</span>}
                                                                </h5>
                                                                {q.timestampSeconds != null && (
                                                                    <button 
                                                                        onClick={() => seekToTime(q.timestampSeconds)}
                                                                        className="timestamp-badge"
                                                                        style={{ margin: 0 }}
                                                                    >
                                                                        {formatTime(q.timestampSeconds)}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p style={{ margin: "0 0 5px 0", fontSize: "15px", color: "#444" }}>{q.content}</p>
                                                            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                                                                <span style={{ fontSize: "12px", color: "#888" }}>{new Date(q.createdAt).toLocaleString("vi-VN")}</span>
                                                                <button 
                                                                    onClick={() => {
                                                                        if (replyingTo === q.id) {
                                                                            setReplyingTo(null);
                                                                        } else {
                                                                            setReplyingTo(q.id);
                                                                            setReplyContent(`@${q.userFullName}: `);
                                                                        }
                                                                    }} 
                                                                    style={{ fontSize: "12px", color: "#007bff", background: "none", border: "none", cursor: "pointer", fontWeight: "600", padding: 0 }}
                                                                >
                                                                    Trả lời
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {q.answers && q.answers.length > 0 && (
                                                        <div className="answers-list" style={{ marginLeft: "52px", marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                                            {q.answers.map(ans => (
                                                                <div key={ans.id} className="answer-item" style={{ display: "flex", gap: "12px", padding: "10px", backgroundColor: "#f1f3f5", borderRadius: "8px", borderLeft: "3px solid #dee2e6" }}>
                                                                    <img
                                                                        src={
                                                                            ans.userAvatarUrl && ans.userAvatarUrl !== "null" && ans.userAvatarUrl.trim() !== ""
                                                                                ? (ans.userAvatarUrl.startsWith("http") ? ans.userAvatarUrl : `http://localhost:8080${ans.userAvatarUrl}`)
                                                                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(ans.userFullName || "User")}&background=64748b&color=fff`
                                                                        }
                                                                        onError={(e) => {
                                                                            e.target.onerror = null; 
                                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ans.userFullName || "User")}&background=64748b&color=fff`;
                                                                        }}
                                                                        alt="Avatar"
                                                                        style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                                                                    />
                                                                    <div className="answer-body" style={{ flex: 1 }}>
                                                                        <h5 style={{ margin: "0 0 5px 0", fontSize: "13px", color: "#333", display: "flex", alignItems: "center", gap: "6px" }}>
                                                                            {ans.userFullName}
                                                                            {ans.userRoleId === 2 && <span style={{ backgroundColor: "#28a745", color: "#fff", fontSize: "10px", padding: "2px 6px", borderRadius: "4px" }}>Giáo viên</span>}
                                                                            {ans.userRoleId === 3 && <span style={{ backgroundColor: "#6c757d", color: "#fff", fontSize: "10px", padding: "2px 6px", borderRadius: "4px" }}>Học sinh</span>}
                                                                        </h5>
                                                                        <p style={{ margin: "0 0 5px 0", fontSize: "14px", color: "#444" }}>{ans.content}</p>
                                                                        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                                                                            <span style={{ fontSize: "12px", color: "#888" }}>{new Date(ans.createdAt).toLocaleString("vi-VN")}</span>
                                                                            <button 
                                                                                onClick={() => {
                                                                                    setReplyingTo(q.id);
                                                                                    setReplyContent(`@${ans.userFullName}: `);
                                                                                }} 
                                                                                style={{ fontSize: "12px", color: "#007bff", background: "none", border: "none", cursor: "pointer", fontWeight: "600", padding: 0 }}
                                                                            >
                                                                                Trả lời
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {replyingTo === q.id && (
                                                        <div className="reply-form" style={{ marginLeft: "52px", marginTop: "10px", display: "flex", gap: "8px" }}>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Nhập câu trả lời của bạn..." 
                                                                value={replyContent}
                                                                onChange={(e) => setReplyContent(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        handlePostAnswer(q.id);
                                                                    }
                                                                }}
                                                                style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" }}
                                                            />
                                                            <button 
                                                                onClick={() => handlePostAnswer(q.id)}
                                                                style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: "#28a745", color: "#fff", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}
                                                            >
                                                                Gửi
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{ color: "#888", textAlign: "center", padding: "20px" }}>Chưa có câu hỏi nào. Hãy là người đầu tiên thảo luận!</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === "notes" && (
                                <div className="notes-tab" style={{ padding: "15px 0" }}>
                                    <div className="notes-input-box" style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                                        <input
                                            type="text"
                                            placeholder="Thêm ghi chú tại thời điểm này..."
                                            className="notes-input"
                                            value={newNoteContent}
                                            onChange={(e) => setNewNoteContent(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handlePostNote();
                                                }
                                            }}
                                            style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                                        />
                                        <button className="add-note-btn" onClick={handlePostNote} style={{ padding: "10px 20px", borderRadius: "6px", backgroundColor: "#ffc107", color: "#000", border: "none", cursor: "pointer", fontWeight: "bold" }}>Lưu Ghi chú</button>
                                    </div>

                                    <div className="notes-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {notes.length > 0 ? (
                                            notes.map((n) => (
                                                <div key={n.id} className="note-item" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", backgroundColor: "#fff", border: "1px solid #e9ecef", borderRadius: "8px" }}>
                                                    <button 
                                                        onClick={() => seekToTime(n.timestampSeconds)}
                                                        className="timestamp-badge note-timestamp"
                                                    >
                                                        {formatTime(n.timestampSeconds)}
                                                    </button>
                                                    <p style={{ margin: 0, flex: 1, fontSize: "15px", color: "#333" }}>{n.content}</p>
                                                    <button 
                                                        onClick={() => handleDeleteNote(n.id)}
                                                        style={{ background: "none", border: "none", color: "#dc3545", cursor: "pointer", fontSize: "18px", padding: "0 5px" }}
                                                        title="Xóa ghi chú"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{ color: "#888", textAlign: "center", padding: "20px" }}>Bạn chưa có ghi chú nào cho bài học này.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="learning-sidebar">
                    <div className="sidebar-header">
                        <h3>Nội dung bài học</h3>
                    </div>
                    <div className="playlist">
                        {course.chapters && course.chapters.map((chapter, index) => (
                            <div className="chapter-group" key={chapter.id || index}>
                                <div
                                    className="chapter-title-box"
                                    onClick={() => setExpandedChapter(expandedChapter === index ? null : index)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <h4>{chapter.title}</h4>
                                    <span>{expandedChapter === index ? '▲' : '▼'}</span>
                                </div>

                                {expandedChapter === index && (
                                    <div className="chapter-lessons">
                                        {chapter.lessons && chapter.lessons.map(lesson => (
                                            <div
                                                className={`playlist-item ${currentLesson.id === lesson.id ? 'current' : ''}`}
                                                key={lesson.id}
                                                onClick={() => setCurrentLesson(lesson)}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <div className="checkbox-wrapper" onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkAsComplete(lesson.id);
                                                }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={completedLessonIds.includes(lesson.id)} 
                                                        onChange={() => {}} // Ngăn chặn React warning
                                                        style={{ cursor: "pointer" }} 
                                                    />
                                                </div>
                                                <div className="lesson-details">
                                                    <span className="title">{lesson.title}</span>
                                                    {lesson.videoUrl && lesson.videoUrl.trim() !== "" && (
                                                        <span className="duration">▶ {lesson.duration}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
import { useState } from 'react';

import AuthPage from './pages/jsx/AuthPage';
import HomePage from './pages/jsx/HomePage';
import ProfilePage from './pages/jsx/ProfilePage';

import ForgotPasswordPage from './pages/jsx/ForgotPasswordPage';
import ChangePasswordPage from './pages/jsx/ChangePasswordPage';
import ResetPasswordPage from './pages/jsx/ResetPasswordPage';

import CourseDetailPage from './pages/jsx/CourseDetailPage';
import LearningPage from './pages/jsx/LearningPage';
import AdaptivePathPage from './pages/jsx/AdaptivePathPage';
import StudyCalendarPage from './pages/jsx/StudyCalendarPage';
import InstructorProfilePage from './pages/jsx/InstructorProfilePage';
import AIChapterSummaryPage from './pages/jsx/AIChapterSummaryPage';

import AdminDashboardPage from './pages/jsx/AdminDashboardPage';
import AdminUIConfigPage from './pages/jsx/AdminUIConfigPage';

import NotificationsPage from './pages/jsx/NotificationsPage';
import CoursePreviewPage from './pages/jsx/CoursePreviewPage';
import CoursesPage from './pages/jsx/CoursesPage';
import AdminUsersPage from './pages/jsx/AdminUsersPage';
import AdminCoursesPage from './pages/jsx/AdminCoursesPage';
import AdminSePayGuide from './pages/jsx/AdminSePayGuide';
import AdminQuestionBankPage from './pages/jsx/AdminQuestionBankPage';
import TeacherDashboard from "./pages/jsx/TeacherDashboard";
import CourseEditPage from "./pages/jsx/CourseEditPage";
import ReportViolationPage from "./pages/jsx/ReportViolationPage";
import AdminViolationsPage from './pages/jsx/AdminViolationsPage';
import RequestTeacherPage from "./pages/jsx/RequestTeacherPage";
import AdminCategoriesPage from "./pages/jsx/AdminCategoriesPage";
//Thi Thu
import TestListPage from './pages/jsx/TestListPage';
import TestDoingPage from './pages/jsx/TestDoingPage';
import TestResult from './pages/jsx/TestResult';
import TestPage from './pages/jsx/TestPage';

// Nguyễn Văn Hải - Entry Test / Payment / AI Interface
import EntryTestPage from './pages/jsx/EntryTestPage';
import EntryTestResultPage from './pages/jsx/EntryTestResultPage';
import CheckoutPage from './pages/jsx/CheckoutPage';
import PaymentReturnPage from './pages/jsx/PaymentReturnPage';
import BankTransferPage from './pages/jsx/BankTransferPage';
import AiChatbotPage from './pages/jsx/AiChatbotPage';
import GapDiagnosisPage from './pages/jsx/GapDiagnosisPage';
import ScoreForecastPage from './pages/jsx/ScoreForecastPage';
import UniversityAdvisingPage from './pages/jsx/UniversityAdvisingPage';
import PracticeResultPage from './pages/jsx/PracticeResultPage';
import BankPaymentPage from './pages/jsx/BankPaymentPage';
import GlobalChatbotWidget from './components/GlobalChatbotWidget';

import { Routes, Route } from "react-router-dom";
import AdminRoute from './routes/adminRoute';
import TeacherGrading from "./pages/jsx/TeacherGrading";

function App() {
    const [count, setCount] = useState(0)

    return (
        <>
        <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/auth' element={<AuthPage />} />
            <Route path='/profile' element={<ProfilePage />} />

            {/* Login - Register */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />

            {/* Main Pages */}
            <Route path='/home' element={<HomePage />} />
            <Route path="/course/:id" element={<CourseDetailPage />} />
            <Route path="/learn/:courseId" element={<LearningPage />} />
            <Route path="/adaptive-path" element={<AdaptivePathPage />} />
            <Route path="/calendar" element={<StudyCalendarPage />} />
            <Route path="/instructor/:id" element={<InstructorProfilePage />} />
            <Route
                path="/chapter-summary/:chapterId"
                element={<AIChapterSummaryPage />}
            />

            {/* Thi - Thi Thử */}
            <Route path='/tests' element={<TestListPage />} />
            <Route path='/tests/:sessionsId' element={<TestPage />} />
            <Route path='/tests/doing/:sessionsId' element={<TestDoingPage />} />
            <Route path='/tests/result/:sessionsId' element={<TestResult />} />
            <Route path='/practice/result/:attemptId' element={<PracticeResultPage />} />

            {/* #13 Kiểm tra đầu vào */}
            <Route path='/entry-test' element={<EntryTestPage />} />
            <Route path='/entry-test/result/:sessionsId' element={<EntryTestResultPage />} />

            {/* #14 Thanh toán / Mua khóa học */}
            <Route path='/checkout/:courseId' element={<CheckoutPage />} />
            <Route path='/payment/bank/:courseId' element={<BankTransferPage />} />
            <Route path='/payment/return' element={<PaymentReturnPage />} />

            {/* #26/28/29/30 AI Interface */}
            <Route path='/ai/chat' element={<AiChatbotPage />} />
            <Route path='/ai/gap-diagnosis' element={<GapDiagnosisPage />} />
            <Route path='/ai/score-forecast' element={<ScoreForecastPage />} />
            <Route path='/ai/university-advising' element={<UniversityAdvisingPage />} />

            <Route path="/report-violation" element={<ReportViolationPage />} />

            {/* ========================================================= */}
            {/* 🔒 CỤM PROTECTED ROUTES DÀNH CHO QUẢN TRỊ VIÊN (ADMIN)   */}
            {/* ========================================================= */}

            <Route
                path="/admin"
                element={
                    <AdminRoute>
                        <AdminDashboardPage />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/users"
                element={
                    <AdminRoute>
                        <AdminUsersPage />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/courses"
                element={
                    <AdminRoute>
                        <AdminCoursesPage />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/ui-config"
                element={
                    <AdminRoute>
                        <AdminUIConfigPage />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/violations"
                element={
                    <AdminRoute>
                        <AdminViolationsPage />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/preview/:id"
                element={
                    <AdminRoute>
                        <CoursePreviewPage />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/question-bank"
                element={
                    <AdminRoute>
                        <AdminQuestionBankPage />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/sepay-guide"
                element={
                    <AdminRoute>
                        <AdminSePayGuide />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/categories"
                element={
                    <AdminRoute>
                        <AdminCategoriesPage />
                    </AdminRoute>
                }
            />


            {/* ========================================================= */}
            {/* 🔒 TUYẾN ĐƯỜNG DÀNH CHO GIẢNG VIÊN / CHUNG                 */}
            {/* ========================================================= */}
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/teacher/preview/:id" element={<CoursePreviewPage />} />
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/course/:id/edit" element={<CourseEditPage />} />
            <Route path="/teacher/grading" element={<TeacherGrading />} />

            {/* ========================================================= */}
            {/* 👨‍🏫 TRANG ĐĂNG KÝ GIÁO VIÊN                                */}
            {/* ========================================================= */}
            <Route path="/request-teacher" element={<RequestTeacherPage />} />

            {/* Fallback: route lạ -> về trang chủ */}
            <Route path="*" element={<HomePage />} />
        </Routes>
        <GlobalChatbotWidget />
        </>
    );
}

export default App;
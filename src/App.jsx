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

// 🔥 Đã tích hợp trang xử lý vi phạm của Admin
import AdminViolationsPage from './pages/jsx/AdminViolationsPage';

//Thi Thu
import TestListPage from './pages/jsx/TestListPage';
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
import BankPaymentPage from './pages/jsx/BankPaymentPage';

import { Routes, Route } from "react-router-dom";
import AdminRoute from './routes/adminRoute';
import TeacherGrading from "./pages/jsx/TeacherGrading";

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
      <Route path='/' element={<HomePage />} />
      <Route path='/auth' element={<AuthPage />}/>
      <Route path='/profile' element={<ProfilePage />}/>

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

      {/* Thi - Thi Thử */}
      <Route path='/tests' element={<TestListPage />} />
      <Route path='/tests/:sessionsId' element={<TestPage />} />
      <Route path='/tests/result/:sessionsId' element={<TestResult />} />

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

      {/* ========================================================= */}
      // 🔒 CỤM PROTECTED ROUTES DÀNH CHO QUẢN TRỊ VIÊN (ADMIN)
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

      {/* 🛠️ ĐÃ TÍCH HỢP: Tuyến đường xử lý báo cáo vi phạm được bảo vệ nghiêm ngặt */}
      <Route
          path="/admin/violations"
          element={
              <AdminRoute>
                  <AdminViolationsPage />
              </AdminRoute>
          }
      />

      {/* General Admin & Teacher Routes */}
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/teacher/preview/:id" element={<CoursePreviewPage />} />
      <Route path="/admin/preview/:id" element={<CoursePreviewPage />} />

      <Route path="/admin/question-bank" element={<AdminQuestionBankPage />} />
      <Route path="/admin/sepay-guide" element={<AdminSePayGuide />} />
      <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
      <Route path="/teacher/course/:id/edit" element={<CourseEditPage />} />
      <Route path="/teacher/grading" element={<TeacherGrading />} />

      {/* Fallback: route lạ -> về trang chủ (tránh trang trắng) */}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

export default App;
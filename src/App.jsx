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
import TeacherDashboard from "./pages/jsx/TeacherDashboard";
import CourseEditPage from "./pages/jsx/CourseEditPage";

//Thi Thu
import TestListPage from './pages/jsx/TestListPage';
import TestResult from './pages/jsx/TestResult';
import TestPage from './pages/jsx/TestPage';

import AdminRoute from './routes/adminRoute';

import {Routes, Route, BrowserRouter} from "react-router-dom";
import './App.css';


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

          {/* Login - Register */}
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

          {/* Admin - Teacher */}
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

          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/teacher/preview/:id" element={<CoursePreviewPage />} />
          <Route path="/admin/preview/:id" element={<CoursePreviewPage />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/course/:id/edit" element={<CourseEditPage />} />
        </Routes>    
  );
}

export default App

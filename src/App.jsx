import { useState } from 'react';

import AuthPage from './pages/jsx/AuthPage';
import HomePage from './pages/jsx/HomePage';
import ProfilePage from './pages/jsx/ProfilePage';

import ForgotPasswordPage from './pages/jsx/ForgotPasswordPage';
import ChangePasswordPage from './pages/jsx/ChangePasswordPage';
import ResetPasswordPage from './pages/jsx/ResetPasswordPage';

import {Routes, Route, BrowserRouter} from "react-router-dom";
import './App.css';


function App() {
  const [count, setCount] = useState(0)

  return (
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/auth' element={<AuthPage />}/>
          <Route path='/profile' element={<ProfilePage />}/>

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
        </Routes>
  )
}

export default App

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import MentorList from './pages/MentorList';
import MentorProfile from './pages/MentorProfile';
import Session from './pages/Session';
import Chat from './pages/Chat';
import Communities from './pages/Communities';
import MentorOnboarding from './pages/MentorOnboarding';

/**
 * Main application routing — public auth routes + protected app layout.
 */
export default function App() {
  return (
    <Routes>
      {/* Public Auth Views */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Application Views */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <Navbar />
              <main className="main-content" style={{ flex: 1, padding: '2rem 24px', overflowY: 'auto' }}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/mentors" element={<MentorList />} />
                  <Route path="/mentors/:id" element={<MentorProfile />} />
                  <Route path="/sessions" element={<Session />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/community" element={<Communities />} />
                  <Route path="/onboarding" element={<MentorOnboarding />} />
                  <Route path="/profile" element={<MentorOnboarding />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

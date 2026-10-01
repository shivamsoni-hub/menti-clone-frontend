import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PresenterDashboard from './pages/PresenterDashboard';
import PresenterScreen from './pages/PresenterScreen';
import AudienceVote from './pages/AudienceVote';
import Login from './pages/Login';
import Register from './pages/Register';
import SessionEditor from './pages/SessionEditor';
import SessionStats from './pages/SessionStats';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
        <Routes>
          {/* Audience join landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Presenter creates sessions and questions */}
          <Route path="/presenter/dashboard" element={<PresenterDashboard />} />

          {/* Large Screen Presentation View with QR Code and Live Results */}
          <Route path="/presenter/session/:passcode" element={<PresenterScreen />} />

          {/* Mobile-friendly audience voting page */}
          <Route path="/vote/:passcode" element={<AudienceVote />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/session/edit/:sessionId" element={<SessionEditor />} />
          <Route path="/session/stats/:sessionId" element={<SessionStats />} />
        </Routes>




        {/* <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PresenterDashboard />} />
          <Route path="/session/edit/:sessionId" element={<SessionEditor />} />
          <Route path="/presenter/:passcode" element={<PresenterScreen />} />
          <Route path="/session/stats/:sessionId" element={<SessionStats />} />
          <Route path="/vote/:passcode" element={<AudienceVote />} /> */}
      </div>
    </Router>
  );
}

export default App;
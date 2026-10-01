import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Presentation } from 'lucide-react';
import API from '../utils/api';

export default function LandingPage() {
  const [passcode, setPasscode] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (passcode.trim().length === 6) {
      navigate(`/vote/${passcode.trim()}`);
    } else {
      alert('Please enter a valid 6-digit session code.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white">
      <div className="absolute top-6 right-6">
        {/* ✅ Changed route from /presenter/dashboard to /login */}
        <Link 
          to="/login" 
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 transition rounded-full text-sm font-medium backdrop-blur-md border border-white/10"
        >
          <Presentation size={16} /> Presenter Login / Dashboard
        </Link>
      </div>

      <div className="max-w-md w-full text-center space-y-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-500 shadow-xl shadow-indigo-500/30">
          <Sparkles size={32} className="text-white" />
        </div>
        
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">MentiClone</h1>
          <p className="mt-2 text-slate-300">Engage your audience with live interactive polls and questions in real time.</p>
        </div>

        <form onSubmit={handleJoin} className="bg-white/10 p-6 rounded-3xl backdrop-blur-xl border border-white/15 shadow-2xl space-y-4">
          <div className="space-y-2 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Enter Voting Code</label>
            <input 
              type="text" 
              maxLength="6"
              placeholder="e.g. 482910"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-4 py-3.5 bg-black/30 border border-white/20 rounded-xl text-center text-2xl font-mono tracking-widest placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
            />
          </div>
          <button 
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition font-semibold rounded-xl shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2"
          >
            Join Session <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
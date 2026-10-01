import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';
import API from '../utils/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      await axios.post('http://localhost:5000/api/auth/register', { name, email, password });
      navigate('/login');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Registration failed. Email might already be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="bg-slate-800/60 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl backdrop-blur-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-pink-600/20 text-pink-400 rounded-2xl mb-2">
            <UserPlus size={28} />
          </div>
          <h1 className="text-2xl font-black">Create Account</h1>
          <p className="text-sm text-slate-400">Start creating interactive presentations today</p>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl flex items-center gap-2 text-xs">
            <AlertCircle size={16} /> <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
              <input 
                type="text" 
                required
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
              <input 
                type="email" 
                required
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
              <input 
                type="password" 
                required
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-pink-600 hover:opacity-90 text-white font-semibold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already have an account? <Link to="/login" className="text-indigo-400 font-semibold hover:underline">Log in</Link>
        </p>

      </div>
    </div>
  );
}
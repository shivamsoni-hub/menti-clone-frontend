import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart3, ArrowLeft, Users, Award } from 'lucide-react';
import API from '../utils/api';

export default function SessionStats() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/sessions/${sessionId}/stats`, { withCredentials: true })
      .then(res => {
        setStats(res.data.stats);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [sessionId]);

  const totalParticipation = stats.reduce((acc, curr) => acc + curr.totalVotes, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 max-w-4xl mx-auto space-y-8">
      
      {/* Top Navigation */}
      <div className="flex justify-between items-center border-b border-white/10 pb-6">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm font-medium"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
          Session Analytics
        </span>
        <h1 className="text-3xl font-black">Presentation Statistics</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-white/10 p-6 rounded-3xl flex items-center gap-4">
          <div className="p-4 bg-indigo-600/20 text-indigo-400 rounded-2xl">
            <Users size={28} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Responses Recorded</p>
            <h3 className="text-3xl font-black">{totalParticipation}</h3>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-white/10 p-6 rounded-3xl flex items-center gap-4">
          <div className="p-4 bg-pink-600/20 text-pink-400 rounded-2xl">
            <Award size={28} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Questions Answered</p>
            <h3 className="text-3xl font-black">{stats.length}</h3>
          </div>
        </div>
      </div>

      {/* Question Breakdown */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 size={20} className="text-indigo-400" /> Question Breakdown
        </h2>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading statistics...</div>
        ) : stats.length === 0 ? (
          <div className="bg-slate-800/40 border border-white/10 p-8 rounded-2xl text-center text-slate-400 text-sm">
            No response statistics found for this session.
          </div>
        ) : (
          stats.map((item, index) => (
            <div key={item.questionId} className="bg-slate-800/60 border border-white/10 p-6 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">{index + 1}. {item.questionText}</h3>
                <span className="font-mono text-indigo-400 text-sm bg-indigo-500/10 px-3 py-1 rounded-full">
                  {item.totalVotes} Votes
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { socket } from '../services/socket';
import { QrCode, Users, Copy, Check, X, Share2, ArrowRight } from 'lucide-react';
import API from '../utils/api';

export default function PresenterScreen() {
  const { passcode } = useParams();
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [liveResults, setLiveResults] = useState({});
  const [showQrModal, setShowQrModal] = useState(false); // Controls Mentimeter style QR popup
  const [copied, setCopied] = useState(false);

  // Dynamic voting URL for mobile devices
  const joinUrl = `${window.location.protocol}//${window.location.hostname}:3000/vote/${passcode}`;

  useEffect(() => {
    // Fetch session and questions from MySQL
    axios.get(`http://localhost:5000/api/sessions/${passcode}`)
      .then(res => {
        setSession(res.data.session);
        setQuestions(res.data.questions);
      })
      .catch(err => console.error("Error loading session:", err));

    socket.emit('join_session', passcode);

    socket.on('live_results_updated', ({ questionId, results }) => {
      const resultMap = {};
      results.forEach(r => {
        resultMap[r.option_id] = r.count;
      });
      setLiveResults(prev => ({ ...prev, [questionId]: resultMap }));
    });

    return () => {
      socket.off('live_results_updated');
    };
  }, [passcode]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!session || questions.length === 0) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading presentation session...</div>;
  }

  const activeQuestion = questions[activeQuestionIndex];
  const currentResults = liveResults[activeQuestion.id] || {};
  const totalVotes = Object.values(currentResults).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-8 relative">
      
      {/* Mentimeter-Style Top Bar */}
      <div className="flex justify-between items-center bg-white/5 border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 px-4 py-2 rounded-xl font-mono font-bold tracking-wider text-sm shadow-md">
            Vote code: {passcode}
          </div>
          <span className="text-slate-300 text-sm hidden md:inline font-medium">
            Go to <strong className="text-white underline">localhost:3000</strong> & use code
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-300 text-sm bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
            <Users size={16} className="text-indigo-400" /> <span>{totalVotes} Votes</span>
          </div>

          {/* Share / QR Code Toggle Button (menti.com style) */}
          <button 
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 transition rounded-xl text-sm font-semibold border border-white/10 shadow-lg"
          >
            <Share2 size={16} /> Share QR Code
          </button>
        </div>
      </div>

      {/* Main Slide Content: Question & Live Bars */}
      <div className="max-w-4xl mx-auto w-full my-auto py-12 space-y-8">
        <h2 className="text-3xl lg:text-5xl font-extrabold leading-tight text-center tracking-tight">
          {activeQuestion.question_text}
        </h2>

        <div className="space-y-4 pt-4">
          {activeQuestion.options.map((opt, idx) => {
            const count = currentResults[opt.id] || 0;
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

            return (
              <div key={opt.id} className="relative bg-white/5 border border-white/10 rounded-2xl p-5 overflow-hidden shadow-sm">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-pink-500 opacity-25 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative flex justify-between items-center font-semibold text-lg md:text-xl">
                  <span>{idx + 1}. {opt.option_text}</span>
                  <span className="font-mono text-indigo-300">{count} ({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mentimeter-Style QR Code Popup Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative text-center space-y-6 border border-slate-100">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                Interactive Session
              </span>
              <h3 className="text-2xl font-black pt-2">Scan to vote</h3>
              <p className="text-sm text-slate-500">Point your smartphone camera at the code below</p>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl inline-block shadow-inner">
              <QRCodeSVG value={joinUrl} size={200} />
            </div>

            {/* Alternative Code Display */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
              <p className="text-xs text-slate-500 font-medium">Or go to your browser and enter code:</p>
              <p className="text-3xl font-mono font-black text-indigo-600 tracking-wider">{passcode}</p>
            </div>

            {/* Copy Share Link Button */}
            <button
              onClick={handleCopyLink}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-md"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copied ? 'Link Copied to Clipboard!' : 'Copy Voting Link'}
            </button>

          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-500">
        MentiClone Live Presentation • Real-time synchronization active.
      </div>

    </div>
  );
}
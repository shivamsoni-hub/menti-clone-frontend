import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { socket } from '../services/socket';
import { CheckCircle2, Send, AlertCircle, QrCode, X, Copy, Check } from 'lucide-react';
import API from '../utils/api';

export default function AudienceVote() {
  const { passcode } = useParams();
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showQrModal, setShowQrModal] = useState(false); // Controls the QR code popup modal
  const [copied, setCopied] = useState(false);

  var [activeQuestion, setActiveQuestion] = useState(null);

  // Dynamic voting URL for mobile sharing
  const joinUrl = `https://menti-clone-frontend-2.onrender.com/vote/${passcode}`;

  useEffect(() => {
    axios.get(`https://menti-clone-backend-2.onrender.com/api/sessions/${passcode}`, { withCredentials: true })
      .then(res => {
        setSession(res.data.session);

        const sortedQuestions = [...res.data.questions].sort(
          (a, b) => a.question_order - b.question_order
        );

        setQuestions(sortedQuestions);

        // Start with the first question
        if (sortedQuestions.length > 0) {
          setActiveQuestion(sortedQuestions[0]);
        }
      })
      .catch(err => {
        console.error(err);
        setErrorMsg('Invalid session code or session has ended.');
      });

    socket.emit('join_session', passcode);
  }, [passcode]);

const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <div className="inline-flex p-3 bg-rose-100 text-rose-600 rounded-full"><AlertCircle size={32} /></div>
          <h1 className="text-xl font-bold text-slate-800">Session Not Found</h1>
          <p className="text-xs text-slate-500">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!session || questions.length === 0) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">Connecting to session...</div>;
  }


  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedOption || !activeQuestion) return;

    let voterId = sessionStorage.getItem(`voter_${passcode}`);

    if (!voterId) {
      voterId = 'voter_' + Math.random().toString(36).substring(2);
      sessionStorage.setItem(`voter_${passcode}`, voterId);
    }

    socket.emit('submit_answer', {
      questionId: activeQuestion.id,
      optionId: selectedOption,
      passcode,
      userIdentifier: voterId
    });

    // Find the current question
    const currentIndex = questions.findIndex(
      (question) => question.id === activeQuestion.id
    );

    // If there is another question, move to it
    if (currentIndex < questions.length - 1) {
      const nextQuestion = questions[currentIndex + 1];

      setActiveQuestion(nextQuestion);
      setSelectedOption(null);
    } else {
      // Only show submitted screen after the LAST question
      setSubmitted(true);
    }
  };








  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6 max-w-md mx-auto relative">
      <div className="space-y-6">

        {/* Top Header with Mentimeter-Style Share QR Button */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
          <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full truncate max-w-[180px]">
            {session.title}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Code: {passcode}</span>
            <button
              onClick={() => setShowQrModal(true)}
              className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 transition"
              title="Show QR Code to share"
            >
              <QrCode size={16} />
            </button>
          </div>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">{activeQuestion.question_text}</h1>
              <p className="text-xs text-slate-500">Select one option below and submit your vote.</p>
            </div>

            <div className="space-y-3">
              {activeQuestion.options.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full p-4 rounded-2xl text-left font-medium transition border flex items-center justify-between ${selectedOption === opt.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                    }`}
                >
                  <span>{opt.option_text}</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedOption === opt.id ? 'border-white bg-white/20' : 'border-slate-300'}`}>
                    {selectedOption === opt.id && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!selectedOption}
              className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition ${selectedOption
                ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
              Submit Vote <Send size={16} />
            </button>
          </form>
        ) : (
          <div className="text-center py-16 space-y-4">
            <div className="inline-flex p-4 bg-emerald-100 text-emerald-600 rounded-full">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Vote Submitted!</h2>
            <p className="text-sm text-slate-500">Thank you. Watch the presenter's big screen to see live results update instantly.</p>
          </div>
        )}
      </div>

      {/* Share QR Code Modal Popup */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center space-y-5 border border-slate-100">

            {/* Close Button */}
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                Session QR Code
              </span>
              <h3 className="text-xl font-black pt-1">Invite others</h3>
              <p className="text-xs text-slate-500">Scan this code to join session {passcode}</p>
            </div>

            {/* QR Code */}
            <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl inline-block shadow-inner">
              <QRCodeSVG value={joinUrl} size={160} />
            </div>

            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-md"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copied ? 'Link Copied!' : 'Copy Voting Link'}
            </button>

          </div>
        </div>
      )}

      <div className="text-center text-xs text-slate-400 pt-6">
        MentiClone Real-Time Platform
      </div>
    </div>
  );
}
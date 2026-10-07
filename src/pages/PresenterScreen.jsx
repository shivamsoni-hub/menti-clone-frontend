import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { socket } from '../services/socket';
import {
  Users, Copy, Check, X, Share2, Plus, Edit3, Trash2,
  ArrowUp, ArrowDown, EyeOff, Eye, ChevronLeft, ChevronRight, Save
} from 'lucide-react';

export default function PresenterScreen() {
  const { passcode } = useParams();
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [liveResults, setLiveResults] = useState({});
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Management UI States
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null); // null means adding new, else editing
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('multiple_choice');
  const [optionsText, setOptionsText] = useState(['', '']);

  // Dynamic voting URL for mobile devices
  const joinUrl = `https://menti-clone-frontend-2.onrender.com/vote/${passcode}`;

  const fetchSession = async () => {
    try {
      const res = await axios.get(`https://menti-clone-backend-2.onrender.com/api/sessions/${passcode}`);
      setSession(res.data.session);
      setQuestions(res.data.questions || []);
      if (res.data.initialResults) {
        setLiveResults(res.data.initialResults);
      }
    } catch (err) {
      console.error("Error loading session:", err);
    }
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 3000);
    socket.emit('join_session', passcode);

    socket.on('live_results_updated', ({ questionId, results }) => {
      const resultMap = {};
      results.forEach(r => {
        resultMap[r.option_id] = r.count;
      });
      setLiveResults(prev => ({
        ...prev,
        [questionId]: resultMap
      }));
    });

    return () => {
      clearInterval(interval);
      socket.off('live_results_updated');
    };
  }, [passcode]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- QUESTION MANAGEMENT ACTIONS ---

  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setQuestionText('');
    setQuestionType('multiple_choice');
    setOptionsText(['', '']);
    setShowQuestionModal(true);
  };

  const handleOpenEditModal = (q) => {
    setEditingQuestion(q);
    setQuestionText(q.question_text);
    setQuestionType(q.question_type || 'multiple_choice');
    setOptionsText(q.options?.map(o => o.option_text) || ['', '']);
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        session_id: session.id,
        question_text: questionText,
        question_type: questionType,
        question_order: editingQuestion
          ? editingQuestion.question_order
          : questions.length + 1,
        options: optionsText.filter(opt => opt.trim() !== '')
      };

      if (editingQuestion) {
        await axios.put(`https://menti-clone-backend-2.onrender.com/api/questions/${editingQuestion.id}`, payload, { withCredentials: true } );
      } else {
        await axios.post(`https://menti-clone-backend-2.onrender.com/api/questions`, payload, { withCredentials: true });
      }
      setShowQuestionModal(false);
      fetchSession();

    } catch (err) {
      console.error("Error saving question:", err);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await axios.delete(`https://menti-clone-backend-2.onrender.com/api/questions/${questionId}`, { withCredentials: true });
      if (activeQuestionIndex >= questions.length - 1 && activeQuestionIndex > 0) {
        setActiveQuestionIndex(activeQuestionIndex - 1);
      }
      fetchSession();
    } catch (err) {
      console.error("Error deleting question:", err);
    }
  };

  const handleToggleActiveState = async (q) => {
    try {
      const nextState = q.current_state === 'active' ? 'inactive' : 'active';
      await axios.patch(`https://menti-clone-backend-2.onrender.com/api/questions/${q.id}/state`, { current_state: nextState }, { withCredentials: true });
      fetchSession();
    } catch (err) {
      console.error("Error updating question state:", err);
    }
  };

  const handleMoveSequence = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const updatedQuestions = [...questions];
    const temp = updatedQuestions[index];
    updatedQuestions[index] = updatedQuestions[newIndex]; // Fixed typo here
    updatedQuestions[newIndex] = temp;

    // Reassign question_order sequentially
    const reorderedPayload = updatedQuestions.map((q, idx) => ({
      id: q.id,
      question_order: idx + 1
    }));

    try {
      await axios.patch(`https://menti-clone-backend-2.onrender.com/api/sessions/${session.id}/reorder`, { questions: reorderedPayload }, {withCredentials: true});
      setQuestions(updatedQuestions);
      setActiveQuestionIndex(newIndex);
    } catch (err) {
      console.error("Error reordering questions:", err);
    }
  };

  if (!session || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center space-y-4">
        <p>Loading presentation session or no questions found...</p>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold flex items-center gap-2"
        >
          <Plus size={18} /> Add First Question
        </button>
      </div>
    );
  }

  const activeQuestion = questions[activeQuestionIndex] || questions[0];
  const currentResults = liveResults[activeQuestion?.id] || {};
  const totalVotes = Object.values(currentResults).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6 relative">

      {/* Mentimeter-Style Top Bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white/5 border border-white/10 px-4 sm:px-6 py-4 rounded-2xl backdrop-blur-md">

        {/* LEFT — Vote Code */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="bg-indigo-600 px-4 py-2.5 rounded-xl font-mono font-bold tracking-wider text-sm shadow-md text-center">
            Vote code: {passcode}
          </div>

          <span className="text-slate-300 text-sm hidden md:inline font-medium">
            Go to{" "}
            <strong className="text-white underline">
              https://menti-clone-frontend-2.onrender.com
            </strong>{" "}
            & use code
          </span>
        </div>

        {/* RIGHT — Votes + QR */}
        <div className="flex items-center justify-between sm:justify-end gap-3">

          {/* Vote Count */}
          <div className="flex items-center gap-2 text-slate-300 text-sm bg-black/20 px-3 py-2 rounded-xl border border-white/5">
            <Users size={16} className="text-indigo-400" />
            <span>
              {totalVotes} <span className="hidden xs:inline">Votes</span>
            </span>
          </div>

          {/* QR Button */}
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-white/10 hover:bg-white/20 transition rounded-xl text-sm font-semibold border border-white/10 shadow-lg"
          >
            <Share2 size={16} />

            <span className="hidden sm:inline">
              Share QR Code
            </span>

            <span className="sm:hidden">
              Share QR Code
            </span>
          </button>

        </div>
      </div>


      {/* Presenter Question Control Bar (Add, Edit, Reorder, State Toggle) */}
      {/* <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-4 bg-slate-800/60 border border-white/10 px-5 py-3 rounded-2xl mt-4">
        <div className="flex items-center gap-2">
          <button
            disabled={activeQuestionIndex === 0}
            onClick={() => setActiveQuestionIndex(prev => prev - 1)}
            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl transition"
            title="Previous Slide"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-bold text-slate-300">
            Slide {activeQuestionIndex + 1} of {questions.length}
          </span>
          <button
            disabled={activeQuestionIndex === questions.length - 1}
            onClick={() => setActiveQuestionIndex(prev => prev + 1)}
            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl transition"
            title="Next Slide"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-xl transition"
          >
            <Plus size={14} /> Add Question
          </button>
          <button
            onClick={() => handleOpenEditModal(activeQuestion)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-xl transition"
          >
            <Edit3 size={14} /> Edit
          </button>
          <button
            onClick={() => handleToggleActiveState(activeQuestion)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition ${activeQuestion.current_state === 'active' ? 'bg-amber-600/30 text-amber-300' : 'bg-emerald-600/30 text-emerald-300'
              }`}
            title="Toggle Active/Inactive state for voting"
          >
            {activeQuestion.current_state === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
            {activeQuestion.current_state === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => handleMoveSequence(activeQuestionIndex, 'up')}
            disabled={activeQuestionIndex === 0}
            className="p-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-xl transition"
            title="Move Up in sequence"
          >
            <ArrowUp size={14} />
          </button>
          <button
            onClick={() => handleMoveSequence(activeQuestionIndex, 'down')}
            disabled={activeQuestionIndex === questions.length - 1}
            className="p-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-xl transition"
            title="Move Down in sequence"
          >
            <ArrowDown size={14} />
          </button>
          <button
            onClick={() => handleDeleteQuestion(activeQuestion.id)}
            className="p-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-xl transition"
            title="Delete Question"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div> */}

      {/* Main Slide Content: Question & Live Bars */}
      {/* <div className="max-w-4xl mx-auto w-full my-auto py-8 space-y-8">
        <h2 className="text-3xl lg:text-5xl font-extrabold leading-tight text-center tracking-tight">
          {activeQuestion.question_text}
        </h2>

        <div className="space-y-4 pt-4">
          {activeQuestion.options?.map((opt, idx) => {
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
      </div> */}

      <div className="max-w-7xl mx-auto w-full my-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

          {/* LEFT GRID — QR CODE / JOIN INFO */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md flex flex-col items-center justify-center text-center shadow-xl">

            <div className="space-y-2 mb-6">
              {/* <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                Interactive Session
              </span> */}

              <h3 className="text-2xl lg:text-3xl font-black text-white">
                Scan to vote
              </h3>

              {/* <p className="text-slate-400 text-sm">
                Scan the QR code with your phone to join
              </p> */}
            </div>

            {/* QR CODE */}
            <div className="p-3 sm:p-4 bg-white border-2 border-white/10 rounded-3xl inline-block shadow-2xl">
              <QRCodeSVG
                value={joinUrl}
                size={180}
                className="w-[150px] h-[150px] sm:w-[180px] sm:h-[180px] lg:w-[240px] lg:h-[240px]"
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="H"
              />
            </div>

            {/* VOTE CODE */}
            {/* <div className="mt-6 w-full max-w-sm bg-black/20 p-5 rounded-2xl border border-white/10">
              <p className="text-xs text-slate-400 font-medium mb-2">
                Or enter this code at
              </p>

              <p className="text-sm text-slate-300 mb-3">
                <span className="text-white font-semibold">
                  localhost:3000
                </span>
              </p>

              <div className="bg-indigo-600 px-5 py-3 rounded-xl font-mono font-black text-2xl tracking-widest text-white shadow-lg">
                {passcode}
              </div>
            </div> */}

            {/* LIVE VOTE COUNT */}
            <div className="mt-5 flex items-center gap-2 text-slate-300 text-sm bg-black/20 px-4 py-2 rounded-xl border border-white/5">
              <Users size={16} className="text-indigo-400" />
              <span>
                {totalVotes} {totalVotes === 1 ? "Vote" : "Votes"}
              </span>
            </div>

          </div>


          {/* RIGHT GRID — QUESTION + VERTICAL BARS */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-xl flex flex-col">

            {/* QUESTION */}
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">
                Question
              </p>

              <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-white">
                {activeQuestion.question_text}
              </h2>

              {/* OPTIONS */}
              <div className="mt-6 grid grid-cols-1 gap-3">
                {activeQuestion.options?.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2"
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>

                    <span className="text-sm md:text-base font-semibold text-white">
                      {opt.option_text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-xl flex flex-col">

            {/* QUESTION */}
            <div className="mb-2">
              <p className="text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-white uppercase text-indigo-400 mb-3 text-center">
                Live Polling Results
              </p>
            </div>


            {/* VERTICAL BAR CHART */}
            <div className="flex-1 flex items-end justify-center gap-4 md:gap-8 min-h-[350px] pt-4">

              {activeQuestion.options?.map((opt, idx) => {
                const count = currentResults[opt.id] || 0;

                const percentage =
                  totalVotes > 0
                    ? Math.round((count / totalVotes) * 100)
                    : 0;

                return (
                  <div
                    key={opt.id}
                    className="flex-1 max-w-[130px] h-full flex flex-col items-center justify-end"
                  >

                    {/* VALUE */}
                    <div className="mb-3 text-center">
                      <div className="font-mono text-indigo-300 font-bold text-lg">
                        {percentage}%
                      </div>

                      <div className="text-xs text-slate-400">
                        {count} votes
                      </div>
                    </div>


                    {/* BAR CONTAINER */}
                    <div className="relative w-full h-[260px] bg-white/5 rounded-t-2xl border border-white/10 overflow-hidden flex items-end">

                      {/* BAR */}
                      <div
                        className="w-full bg-gradient-to-t from-indigo-600 via-purple-500 to-pink-500 transition-all duration-700 ease-out rounded-t-xl"
                        style={{
                          height: `${percentage}%`,
                        }}
                      />

                    </div>


                    {/* OPTION LABEL */}
                    <div className="mt-4 text-center">
                      <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </div>

                      <span className="text-sm md:text-base font-semibold text-white leading-tight">
                        {opt.option_text}
                      </span>
                    </div>

                  </div>
                );
              })}

            </div>

          </div>

        </div>
      </div>


      {/* Add / Edit Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveQuestion} className="bg-slate-800 border border-white/10 text-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative space-y-6">
            <button
              type="button"
              onClick={() => setShowQuestionModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-black">{editingQuestion ? 'Edit Question' : 'Add New Question'}</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Question Text</label>
              <input
                type="text"
                required
                value={questionText}
                onChange={e => setQuestionText(e.target.value)}
                placeholder="e.g. What is your favorite framework?"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300">Options</label>
              {optionsText.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={e => {
                      const newOpts = [...optionsText];
                      newOpts[idx] = e.target.value;
                      setOptionsText(newOpts);
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                  />
                  {optionsText.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setOptionsText(optionsText.filter((_, i) => i !== idx))}
                      className="px-3 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-xl text-xs"
                    >
                      X
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setOptionsText([...optionsText, ''])}
                className="text-xs text-indigo-400 hover:underline font-semibold mt-1"
              >
                + Add Option
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-md"
            >
              <Save size={16} /> Save Question
            </button>
          </form>
        </div>
      )}

      {/* QR Code Popup Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative text-center space-y-6">
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
            </div>
            <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl inline-block shadow-inner">
              <QRCodeSVG value={joinUrl} size={200} />
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
              <p className="text-xs text-slate-500 font-medium">Or go to your browser and enter code:</p>
              <p className="text-3xl font-mono font-black text-indigo-600 tracking-wider">{passcode}</p>
            </div>
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
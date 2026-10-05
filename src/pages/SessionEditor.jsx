import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, ArrowLeft, Play, HelpCircle } from 'lucide-react';
import API from '../utils/api';

export default function SessionEditor() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  // New Question Form State
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '']);

  const fetchSessionData = async () => {
    try {
      const res = await axios.get(`https://menti-clone-backend-2.onrender.com/api/sessions/code_lookup_or_id`, { /* placeholder or fetch via passcode */ });
    } catch (err) {
      // Fetch session by ID or fallback
    }
  };

  useEffect(() => {
    // Fetch session details and existing questions
    axios.get(`https://menti-clone-backend-2.onrender.com/api/sessions`, { withCredentials: true })
      .then(res => {
        const found = res.data.find(s => s.id.toString() === sessionId);
        setSession(found);
      })
      .catch(err => console.error(err));

    loadQuestions();
  }, [sessionId]);

  const loadQuestions = () => {
    axios.get(`https://menti-clone-backend-2.onrender.com/api/sessions/passcode_helper`, { withCredentials: true }).catch(() => {
      // Alternatively direct query helper
    });
    // For direct fetching using session details
    axios.get(`https://menti-clone-backend-2.onrender.com/api/sessions`, { withCredentials: true }).then(res => {
      const s = res.data.find(item => item.id.toString() === sessionId);
      if (s) {
        axios.get(`https://menti-clone-backend-2.onrender.com/api/sessions/${s.passcode}`).then(qRes => {
          setQuestions(qRes.data.questions);
        });
      }
    });
  };

  const handleAddOptionField = () => {
    setOptions([...options, '']);
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleRemoveOptionField = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    try {
      await axios.post(`https://menti-clone-backend-2.onrender.com/api/sessions/${sessionId}/questions`, {
        question_text: questionText,
        question_type: 'multiple_choice',
        options
      }, { withCredentials: true });

      setQuestionText('');
      setOptions(['', '']);
      loadQuestions();
    } catch (err) {
      console.error(err);
      alert('Failed to add question');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    try {
      await axios.delete(`https://menti-clone-backend-2.onrender.com/api/questions/${qId}`, { withCredentials: true });
      loadQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 max-w-4xl mx-auto space-y-8">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center border-b border-white/10 pb-6">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm font-medium"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        {session && (
          <button 
            onClick={() => navigate(`/presenter/${session.passcode}`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold text-sm transition shadow-lg shadow-emerald-600/20"
          >
            <Play size={16} /> Start Live Presentation
          </button>
        )}
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
          Presentation Editor
        </span>
        <h1 className="text-3xl font-black">{session ? session.title : 'Loading Session...'}</h1>
      </div>

      {/* Existing Questions List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Questions ({questions.length})</h2>
        {questions.length === 0 ? (
          <div className="p-8 bg-slate-800/40 border border-white/10 rounded-2xl text-center text-slate-400 text-sm">
            No questions added yet. Use the form below to add your first question!
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="bg-slate-800/60 border border-white/10 p-6 rounded-2xl space-y-3 relative">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">{idx + 1}. {q.question_text}</h3>
                <button 
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="text-slate-400 hover:text-rose-400 p-2 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                {q.options.map((opt, oIdx) => (
                  <div key={opt.id} className="bg-slate-900/60 px-3 py-2 rounded-xl text-xs text-slate-300 border border-white/5">
                    {oIdx + 1}. {opt.option_text}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Question Form */}
      <form onSubmit={handleCreateQuestion} className="bg-slate-800/80 border border-white/10 p-6 rounded-3xl space-y-6 shadow-xl">
        <div className="space-y-2">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <HelpCircle size={20} className="text-indigo-400" /> Add New Multiple Choice Question
          </h3>
          <input 
            type="text" 
            required
            value={questionText} 
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type your question here..."
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300">Answer Options</label>
          {options.map((opt, index) => (
            <div key={index} className="flex items-center gap-2">
              <input 
                type="text" 
                required
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              {options.length > 2 && (
                <button 
                  type="button" 
                  onClick={() => handleRemoveOptionField(index)}
                  className="p-2.5 text-slate-400 hover:text-rose-400 transition"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          <button 
            type="button"
            onClick={handleAddOptionField}
            className="text-xs text-indigo-400 font-semibold hover:underline flex items-center gap-1 pt-1"
          >
            <Plus size={14} /> Add another option
          </button>
        </div>

        <button 
          type="submit"
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-md"
        >
          Save & Add Question
        </button>
      </form>

    </div>
  );
}
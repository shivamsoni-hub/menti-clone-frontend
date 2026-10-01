import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PlusCircle, Layers, ArrowRight, Trash2 } from 'lucide-react';
import API from '../utils/api';

export default function PresenterDashboard() {
  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddOptionField = () => {
    setOptions([...options, '']);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const createSessionWithQuestion = async (e) => {
    e.preventDefault();
    if (!title.trim() || !questionText.trim()) {
      alert('Please provide a session title and question text.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create Session (Added withCredentials: true)
      const sessionRes = await axios.post('http://localhost:5000/api/sessions', { title }, { withCredentials: true });
      const { sessionId, passcode } = sessionRes.data;

      // 2. Create Initial Question & Options for this Session (Added withCredentials: true)
      await axios.post(`http://localhost:5000/api/sessions/${sessionId}/questions`, {
        question_text: questionText,
        question_type: 'multiple_choice',
        options: options.filter(opt => opt.trim() !== '')
      }, { withCredentials: true });

      // 3. Redirect to Presenter Big Screen View
      navigate(`/presenter/session/${passcode}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create session or question. Ensure backend is running and you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md">
          <Layers size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Interactive Session</h1>
          <p className="text-sm text-slate-500">Set up your presentation title and first poll question</p>
        </div>
      </div>

      <form onSubmit={createSessionWithQuestion} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Presentation Title</label>
          <input 
            type="text" 
            placeholder="e.g. Q3 All-Hands Meeting"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <hr className="border-slate-100" />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">First Poll Question</label>
          <input 
            type="text" 
            placeholder="e.g. What is your primary focus this quarter?"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Answer Options</label>
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input 
                type="text"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              {options.length > 2 && (
                <button type="button" onClick={() => handleRemoveOption(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddOptionField} className="text-xs font-semibold text-indigo-600 hover:underline pt-1">
            + Add another option
          </button>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 transition font-semibold text-white rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
        >
          <PlusCircle size={18} /> {loading ? 'Setting up...' : 'Launch Presentation Session'} <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
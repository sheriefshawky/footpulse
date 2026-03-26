import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Plus, 
  Users, 
  ChevronRight, 
  Star, 
  MessageSquare, 
  Save, 
  X, 
  Edit2, 
  Trash2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole, TrainingSession, TrainingEvaluation, Language } from '../types';
import { api } from '../api';
import { translations } from '../translations';

interface TrainingSessionsProps {
  currentUser: User;
  lang: Language;
}

const TrainingSessions: React.FC<TrainingSessionsProps> = ({ currentUser, lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  
  // Form states
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  
  // Evaluation states
  const [activePlayer, setActivePlayer] = useState<User | null>(null);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsData, usersData] = await Promise.all([
        api.get('/training-sessions'),
        api.get('/users')
      ]);
      setSessions(sessionsData);
      setPlayers(usersData.filter((u: User) => u.role === UserRole.PLAYER));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (selectedPlayerIds.size === 0) return;
    try {
      setSubmitting(true);
      await api.post('/training-sessions', {
        date: sessionDate,
        player_ids: Array.from(selectedPlayerIds)
      });
      setIsAddModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSession = async () => {
    if (!selectedSession || selectedPlayerIds.size === 0) return;
    try {
      setSubmitting(true);
      await api.patch(`/training-sessions/${selectedSession.id}`, {
        date: sessionDate,
        player_ids: Array.from(selectedPlayerIds)
      });
      setIsEditModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      await api.delete(`/training-sessions/${id}`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOpenEvaluation = async (session: TrainingSession) => {
    try {
      const fullSession = await api.get(`/training-sessions/${session.id}`);
      setSelectedSession(fullSession);
      setIsEvaluationModalOpen(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedSession || !activePlayer) return;
    try {
      setSubmitting(true);
      await api.post(`/training-sessions/${selectedSession.id}/evaluations`, {
        player_id: activePlayer.id,
        rating,
        comments
      });
      // Refresh session data to show updated evaluation
      const updatedSession = await api.get(`/training-sessions/${selectedSession.id}`);
      setSelectedSession(updatedSession);
      setActivePlayer(null);
      setRating(5);
      setComments('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSession(null);
    setSessionDate(new Date().toISOString().split('T')[0]);
    setSelectedPlayerIds(new Set());
    setActivePlayer(null);
    setRating(5);
    setComments('');
  };

  const togglePlayerSelection = (id: string) => {
    const next = new Set(selectedPlayerIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPlayerIds(next);
  };

  const getEvaluationForPlayer = (playerId: string) => {
    return selectedSession?.evaluations?.find(e => e.playerId === playerId);
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 animate-in fade-in duration-500 pb-20 ${isRtl ? 'text-right' : ''}`}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{(t as any).trainingSessions}</h2>
          <p className="text-slate-500 font-medium">{isRtl ? 'تتبع وتقييم حصص التدريب اليومية.' : 'Track and evaluate daily training sessions.'}</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>{(t as any).addTraining}</span>
        </button>
      </header>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 text-sm font-bold">
          {error}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-bold">{(t as any).noTrainingSessions}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <motion.div
              layout
              key={session.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{(t as any).trainingDate}</p>
                    <p className="text-lg font-black text-slate-900">{new Date(session.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex -space-x-2">
                  {session.playerIds.slice(0, 5).map((pid, i) => {
                    const p = players.find(player => player.id === pid);
                    return (
                      <img 
                        key={pid} 
                        src={p?.avatar || `https://picsum.photos/seed/${pid}/100/100`} 
                        className="w-8 h-8 rounded-full border-2 border-white object-cover" 
                        alt="" 
                      />
                    );
                  })}
                  {session.playerIds.length > 5 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                      +{session.playerIds.length - 5}
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-400">{session.playerIds.length} {(t as any).players}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEvaluation(session)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
                >
                  <Star className="w-4 h-4" />
                  <span>{(t as any).evaluation}</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedSession(session);
                    setSessionDate(session.date.split('T')[0]);
                    setSelectedPlayerIds(new Set(session.playerIds));
                    setIsEditModalOpen(true);
                  }}
                  className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSession(session.id)}
                  className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900">
                  {isAddModalOpen ? (t as any).addTraining : (t as any).editTraining}
                </h3>
                <button 
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{(t as any).trainingDate}</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{(t as any).selectPlayers}</label>
                    <span className="text-xs font-bold text-emerald-600">{selectedPlayerIds.size} selected</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {players.map(player => (
                      <button
                        key={player.id}
                        onClick={() => togglePlayerSelection(player.id)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                          selectedPlayerIds.has(player.id)
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-100 hover:border-emerald-200'
                        }`}
                      >
                        <img src={player.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-900">{player.name}</p>
                          <p className="text-[10px] font-medium text-slate-400">{player.position}</p>
                        </div>
                        {selectedPlayerIds.has(player.id) && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 flex items-center gap-4">
                <button
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                  className="flex-1 px-8 py-4 bg-white text-slate-600 rounded-2xl font-bold border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  {(t as any).cancel}
                </button>
                <button
                  disabled={submitting || selectedPlayerIds.size === 0}
                  onClick={isAddModalOpen ? handleCreateSession : handleUpdateSession}
                  className="flex-1 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all"
                >
                  {submitting ? '...' : (t as any).saveChanges}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Evaluation Modal */}
      <AnimatePresence>
        {isEvaluationModalOpen && selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEvaluationModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh]"
            >
              {/* Sidebar: Player List */}
              <div className="w-full md:w-80 border-r border-slate-100 flex flex-col">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-xl font-black text-slate-900">{(t as any).players}</h3>
                  <p className="text-xs font-bold text-slate-400">{selectedSession.playerIds.length} in session</p>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
                  {selectedSession.playerIds.map(pid => {
                    const player = players.find(p => p.id === pid);
                    const evaluation = getEvaluationForPlayer(pid);
                    return (
                      <button
                        key={pid}
                        onClick={() => {
                          setActivePlayer(player || null);
                          setRating(evaluation?.rating || 5);
                          setComments(evaluation?.comments || '');
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                          activePlayer?.id === pid
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <img src={player?.avatar} className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="" />
                        <div className="text-left flex-1">
                          <p className="text-sm font-bold truncate">{player?.name}</p>
                          <div className="flex items-center gap-1">
                            {evaluation ? (
                              <div className="flex items-center gap-1">
                                <Star className={`w-3 h-3 ${activePlayer?.id === pid ? 'text-emerald-200' : 'text-amber-400'} fill-current`} />
                                <span className="text-[10px] font-black">{evaluation.rating}/10</span>
                              </div>
                            ) : (
                              <span className={`text-[10px] font-bold ${activePlayer?.id === pid ? 'text-emerald-200' : 'text-slate-400'}`}>Pending</span>
                            )}
                          </div>
                        </div>
                        {evaluation && <CheckCircle2 className={`w-4 h-4 ${activePlayer?.id === pid ? 'text-white' : 'text-emerald-500'}`} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main: Evaluation Form */}
              <div className="flex-1 flex flex-col bg-slate-50/50">
                <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {activePlayer && (
                      <>
                        <img src={activePlayer.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                        <div>
                          <h4 className="text-lg font-black text-slate-900">{activePlayer.name}</h4>
                          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">{activePlayer.position}</p>
                        </div>
                      </>
                    )}
                  </div>
                  <button 
                    onClick={() => setIsEvaluationModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-all"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                  {activePlayer ? (
                    <div className="max-w-xl mx-auto space-y-10">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{(t as any).overallEvaluation}</label>
                          <span className="text-4xl font-black text-emerald-600">{rating}<span className="text-lg text-slate-300">/10</span></span>
                        </div>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <button
                              key={num}
                              onClick={() => setRating(num)}
                              className={`flex-1 aspect-square rounded-xl font-black transition-all ${
                                rating === num
                                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 scale-110'
                                  : 'bg-white text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">
                          <span>{(t as any).needsImprovement}</span>
                          <span>{(t as any).eliteLevel}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{(t as any).comments}</label>
                        <textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Add specific feedback for this session..."
                          className="w-full h-40 px-6 py-4 bg-white border-2 border-slate-100 rounded-3xl font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                        />
                      </div>

                      <button
                        disabled={submitting}
                        onClick={handleSubmitEvaluation}
                        className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                      >
                        <Save className="w-6 h-6" />
                        <span>{submitting ? '...' : (t as any).saveEvaluation}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                      <Users className="w-16 h-16 text-slate-300" />
                      <p className="text-xl font-black text-slate-400">Select a player to start evaluation</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrainingSessions;

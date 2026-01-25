
import React, { useMemo } from 'react';
import { 
  User, 
  UserRole, 
  SurveyResponse, 
  SurveyTemplate,
  SurveyAssignment,
  Language
} from '../types';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart,
  Line
} from 'recharts';
import { Activity, Users, ClipboardCheck, Calendar, Trophy, CheckCircle2, Circle, User as UserIcon, ArrowRight, Lock } from 'lucide-react';
import { translations } from '../translations';

interface Props {
  user: User;
  responses: SurveyResponse[];
  users: User[];
  templates: SurveyTemplate[];
  assignments: SurveyAssignment[];
  onStartSurvey: (t: SurveyTemplate, targetId: string) => void;
  lang: Language;
}

const Dashboard: React.FC<Props> = ({ user, responses, users, templates, assignments, onStartSurvey, lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const currentMonth = new Date().toISOString().slice(0, 7);
  const isTrainer = user.role === UserRole.TRAINER;
  const targetId = user.role === UserRole.PLAYER ? user.id : (user.role === UserRole.GUARDIAN ? user.playerId : '');

  const stats = useMemo(() => {
    if (user.role === UserRole.ADMIN) {
      return [
        { label: t.player + 's', value: users.filter(u => u.role === UserRole.PLAYER).length, icon: <Users className="w-5 h-5" />, color: 'blue' },
        { label: t.coach + 'es', value: users.filter(u => u.role === UserRole.TRAINER).length, icon: <Activity className="w-5 h-5" />, color: 'emerald' },
        { label: t.surveys, value: responses.length, icon: <ClipboardCheck className="w-5 h-5" />, color: 'purple' },
        { label: lang === 'en' ? 'Pending' : 'معلق', value: assignments.filter(a => a.status === 'PENDING').length, icon: <Calendar className="w-5 h-5" />, color: 'amber' },
      ];
    }
    
    const playerResponses = responses.filter(r => r.targetPlayerId === targetId);
    const avgScore = playerResponses.length > 0 
      ? Math.round(playerResponses.reduce((acc, r) => acc + r.weightedScore, 0) / playerResponses.length) 
      : 0;

    return [
      { label: t.completed, value: playerResponses.length, icon: <ClipboardCheck className="w-5 h-5" />, color: 'emerald' },
      { label: t.avgPerformance, value: `${avgScore}%`, icon: <Trophy className="w-5 h-5" />, color: 'amber' },
      { label: t.teamRank, value: isRtl ? 'الرابع' : '4th', icon: <Activity className="w-5 h-5" />, color: 'blue' },
      { label: t.nextSession, value: isRtl ? 'اليوم' : 'Today', icon: <Calendar className="w-5 h-5" />, color: 'purple' },
    ];
  }, [user, users, responses, assignments, targetId, t, lang, isRtl]);

  const chartData = useMemo(() => {
    if (user.role === UserRole.ADMIN || isTrainer || responses.length === 0) {
      return [
        { month: isRtl ? 'يناير' : 'Jan', score: 65 },
        { month: isRtl ? 'فبراير' : 'Feb', score: 72 },
        { month: isRtl ? 'مارس' : 'Mar', score: 78 },
        { month: isRtl ? 'أبريل' : 'Apr', score: 85 },
      ];
    }
    const playerResponses = responses.filter(r => r.targetPlayerId === targetId).slice(-5);
    return playerResponses.map(r => ({
      month: r.month,
      score: r.weightedScore
    }));
  }, [user, responses, targetId, isTrainer, isRtl]);

  const pendingAssignments = assignments.filter(a => a.respondentId === user.id && a.status === 'PENDING');

  return (
    <div className={`space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 ${isRtl ? 'text-right' : ''}`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{t.performanceOverview}</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {t.hello}, {user.name}. {t.trackGrowth}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 md:px-4 md:py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-xs md:text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>{new Date().toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className={`flex items-center justify-between mb-2 md:mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`p-2 md:p-3 rounded-lg md:rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-slate-500 text-[10px] md:text-xs font-bold mb-0.5 md:mb-1 uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
            <div className={`flex items-center justify-between mb-6 md:mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <h3 className="text-lg md:text-xl font-bold text-slate-900">
                {t.trainingProgress}
              </h3>
            </div>
            <div className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 600, fontSize: 10}} dy={10} reversed={isRtl} />
                  <YAxis orientation={isRtl ? 'right' : 'left'} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 600, fontSize: 10}} dx={isRtl ? 5 : -5} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
          <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-6">{t.actionItems}</h3>
          <div className="space-y-4">
            {pendingAssignments.length > 0 ? (
               pendingAssignments.map(a => {
                  const template = templates.find(t => t.id === a.templateId);
                  const targetUser = users.find(u => u.id === a.targetId);
                  const isCurrentMonth = a.month === currentMonth;
                  
                  if (!template) return null;
                  return (
                    <div key={a.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
                      {/* Prominent Target Header */}
                      <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <img 
                           src={targetUser?.avatar || `https://ui-avatars.com/api/?name=${targetUser?.name || 'User'}`} 
                           className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-200" 
                           alt=""
                        />
                        <div className={isRtl ? 'text-right' : 'text-left'}>
                           <p className="text-[8px] font-black uppercase text-emerald-500 tracking-[0.1em]">{t.assessmentAbout}</p>
                           <p className="text-sm font-black text-slate-900">{targetUser?.name || 'Unknown User'}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                           <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
                           <h4 className="text-[11px] font-bold text-slate-700 truncate">{isRtl ? template.arName : template.name}</h4>
                        </div>
                        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                           <Calendar className="w-3.5 h-3.5 text-slate-400" />
                           <p className={`text-[10px] font-medium ${isCurrentMonth ? 'text-slate-500' : 'text-rose-500'}`}>
                             {isRtl ? `مستحق لـ: ${a.month}` : `Due for: ${a.month}`}
                             {!isCurrentMonth && ` (${isRtl ? 'ليس الشهر الحالي' : 'Not current month'})`}
                           </p>
                        </div>
                      </div>

                      <button 
                        disabled={!isCurrentMonth}
                        onClick={() => onStartSurvey(template, a.targetId)}
                        className={`w-full py-3 ${isCurrentMonth ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] ${isRtl ? 'flex-row-reverse' : ''}`}
                      >
                        {!isCurrentMonth && <Lock className="w-3.5 h-3.5" />}
                        {t.startAssessment}
                        {isCurrentMonth && <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />}
                      </button>
                    </div>
                  );
               })
            ) : (
              <div className="text-center py-10 md:py-12">
                <p className="text-[10px] md:text-xs text-slate-400 font-bold italic">{isRtl ? "لا توجد مهام معلقة." : "No pending tasks found."}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


import React, { useMemo } from 'react';
import { 
  User, 
  UserRole, 
  SurveyResponse, 
  SurveyTemplate,
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
import { Activity, Users, ClipboardCheck, Calendar, Trophy, CheckCircle2, Circle } from 'lucide-react';
import { translations } from '../translations';

interface Props {
  user: User;
  responses: SurveyResponse[];
  users: User[];
  templates: SurveyTemplate[];
  onStartSurvey: (t: SurveyTemplate, targetId: string) => void;
  lang: Language;
}

const Dashboard: React.FC<Props> = ({ user, responses, users, templates, onStartSurvey, lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const currentMonth = new Date().toISOString().slice(0, 7);
  const isTrainer = user.role === UserRole.TRAINER;
  const isPlayerRelated = user.role === UserRole.PLAYER || user.role === UserRole.GUARDIAN;
  const targetId = user.role === UserRole.PLAYER ? user.id : (user.role === UserRole.GUARDIAN ? user.playerId : '');

  const squad = useMemo(() => {
    return users.filter(u => u.trainerId === user.id);
  }, [users, user.id]);

  const stats = useMemo(() => {
    if (user.role === UserRole.ADMIN) {
      return [
        { label: t.player + 's', value: users.filter(u => u.role === UserRole.PLAYER).length, icon: <Users className="w-5 h-5" />, color: 'blue' },
        { label: t.coach + 'es', value: users.filter(u => u.role === UserRole.TRAINER).length, icon: <Activity className="w-5 h-5" />, color: 'emerald' },
        { label: t.surveys, value: responses.length, icon: <ClipboardCheck className="w-5 h-5" />, color: 'purple' },
        { label: lang === 'en' ? 'Pending' : 'معلق', value: 12, icon: <Calendar className="w-5 h-5" />, color: 'amber' },
      ];
    }

    if (isTrainer) {
      const completedThisMonth = responses.filter(r => 
        r.userId === user.id && r.month === currentMonth
      ).length;
      const totalRequired = squad.length * templates.filter(temp => temp.id === 't-trainer-eval').length;
      const completionRate = totalRequired > 0 ? Math.round((completedThisMonth / totalRequired) * 100) : 0;

      return [
        { label: lang === 'en' ? 'Squad Size' : 'حجم الفريق', value: squad.length, icon: <Users className="w-5 h-5" />, color: 'blue' },
        { label: lang === 'en' ? 'Reviews Done' : 'مراجعات مكتملة', value: completedThisMonth, icon: <ClipboardCheck className="w-5 h-5" />, color: 'emerald' },
        { label: lang === 'en' ? 'Completion' : 'نسبة الإنجاز', value: `${completionRate}%`, icon: <Activity className="w-5 h-5" />, color: 'purple' },
        { label: lang === 'en' ? 'Top Performers' : 'الأفضل أداءً', value: 3, icon: <Trophy className="w-5 h-5" />, color: 'amber' },
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
  }, [user, users, responses, targetId, isTrainer, squad, templates, currentMonth, t, lang, isRtl]);

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

  return (
    <div className={`space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 ${isRtl ? 'text-right' : ''}`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{t.performanceOverview}</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {isTrainer ? (isRtl ? `فريق التدريب: ${squad.length} لاعبين` : `Coaching Squad: ${squad.length} Players`) : `${t.hello}, ${user.name}. ${t.trackGrowth}`}
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
                {React.cloneElement(stat.icon as React.ReactElement<{ className?: string }>, { className: 'w-4 h-4 md:w-5 md:h-5' })}
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
                {isTrainer ? (isRtl ? "اتجاه أداء الفريق" : "Squad Performance Trend") : t.trainingProgress}
              </h3>
              <select className="bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-600 focus:ring-0 outline-none">
                <option>{isRtl ? "آخر 6 أشهر" : "Last 6 Months"}</option>
                <option>{isRtl ? "آخر سنة" : "Last Year"}</option>
              </select>
            </div>
            <div className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 600, fontSize: 10}} dy={10} reversed={isRtl} />
                  <YAxis orientation={isRtl ? 'right' : 'left'} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 600, fontSize: 10}} dx={isRtl ? 5 : -5} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px', textAlign: isRtl ? 'right' : 'left'}}
                    itemStyle={{fontWeight: 700}}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {isTrainer && (
            <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-6">{t.squadEvaluationTracker}</h3>
               <div className="overflow-x-auto no-scrollbar">
                 <table className={`w-full ${isRtl ? 'text-right' : 'text-left'}`}>
                   <thead>
                     <tr className="border-b border-slate-100">
                       <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.player}</th>
                       {templates.filter(temp => temp.id === 't-trainer-eval').map(t => (
                         <th key={t.id} className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">{isRtl ? t.arName : t.name.split(' ')[0]}</th>
                       ))}
                       <th className={`pb-4 ${isRtl ? 'text-left' : 'text-right'} text-[10px] font-black text-slate-400 uppercase tracking-widest`}>{isRtl ? "الإجراء" : "Action"}</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {squad.map(p => (
                       <tr key={p.id} className="group">
                         <td className={`py-4 flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                           <img src={p.avatar} className="w-8 h-8 rounded-full border border-slate-100 object-cover" alt="" />
                           <span className="text-xs font-bold text-slate-800">{p.name}</span>
                         </td>
                         {templates.filter(temp => temp.id === 't-trainer-eval').map(temp => {
                           const done = responses.some(r => r.targetPlayerId === p.id && r.templateId === temp.id && r.month === currentMonth && r.userId === user.id);
                           return (
                             <td key={temp.id} className="py-4 px-4 text-center">
                               {done ? (
                                 <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                               ) : (
                                 <Circle className="w-4 h-4 text-slate-200 mx-auto" />
                               )}
                             </td>
                           );
                         })}
                         <td className={`py-4 ${isRtl ? 'text-left' : 'text-right'}`}>
                            <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">{isRtl ? "مراجعة" : "Review"}</button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
          <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-6">{t.actionItems}</h3>
          <div className="space-y-4">
            {isPlayerRelated ? (
              <>
                <div className={`p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3 md:gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="bg-emerald-500 p-2 rounded-lg text-white flex-shrink-0">
                    <ClipboardCheck className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs md:text-sm font-bold text-slate-900 truncate">{isRtl ? "تقييم ذاتي" : "Self-Assessment"}</h4>
                    <p className={`text-[10px] md:text-xs font-medium text-emerald-700 mt-0.5 ${isRtl ? 'text-right' : ''}`}>
                      {isRtl ? "مستحق خلال 48 ساعة" : "Due in 48 hours"}
                    </p>
                    <button 
                      onClick={() => onStartSurvey(templates.find(temp => temp.id === 't-player-self')!, targetId)}
                      className="mt-3 px-3 py-1.5 md:px-4 md:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] md:text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                    >
                      {t.startAssessment}
                    </button>
                  </div>
                </div>
              </>
            ) : isTrainer ? (
              <div className="space-y-4">
                <p className="text-xs font-medium text-slate-500 mb-2">{isRtl ? "تقييمات اللاعبين المعلقة" : "Pending Player Evaluations"}</p>
                {squad.map(p => {
                  const pendingTemplates = templates.filter(temp => temp.id === 't-trainer-eval' && !responses.some(r => r.targetPlayerId === p.id && r.templateId === temp.id && r.month === currentMonth && r.userId === user.id));
                  if (pendingTemplates.length === 0) return null;
                  return (
                    <div key={p.id} className={`p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                       <div className={`flex items-center gap-2 overflow-hidden ${isRtl ? 'flex-row-reverse' : ''}`}>
                         <img src={p.avatar} className="w-6 h-6 rounded-full flex-shrink-0 object-cover" alt="" />
                         <span className="text-xs font-bold text-slate-700 truncate">{p.name}</span>
                       </div>
                       <span className="text-[10px] font-black text-amber-600 whitespace-nowrap">{pendingTemplates.length} {isRtl ? "معلق" : "Pending"}</span>
                    </div>
                  );
                })}
              </div>
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

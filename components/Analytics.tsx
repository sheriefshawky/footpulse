
import React, { useMemo, useState } from 'react';
import { User, UserRole, SurveyResponse, SurveyTemplate, Language } from '../types';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Filter, TrendingUp, Target, Zap, Shield, ChevronDown, Layout, Users, Check, Calendar, Activity, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { translations } from '../translations';

interface Props {
  user: User;
  users: User[];
  responses: SurveyResponse[];
  templates: SurveyTemplate[];
  lang: Language;
}

const LINE_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

const MultiSelect: React.FC<{
  label: string;
  options: { id: string; name: string }[];
  selected: Set<string>;
  toggle: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  icon: React.ReactNode;
  isRtl: boolean;
}> = ({ label, options, selected, toggle, selectAll, deselectAll, icon, isRtl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isAllSelected = options.length > 0 && selected.size === options.length;

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm text-sm font-bold text-slate-700 hover:border-emerald-300 transition-all ${isRtl ? 'flex-row-reverse' : ''}`}
      >
        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
           {icon}
           <span className="truncate max-w-[120px]">
             {selected.size === 0 ? `No ${label}` : selected.size === options.length ? `All ${label}` : `${selected.size} ${label}`}
           </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={`absolute z-50 mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 animate-in zoom-in-95 duration-200 ${isRtl ? 'right-0' : 'left-0'}`}>
            <div className={`flex items-center justify-between p-2 mb-2 border-b border-slate-50 ${isRtl ? 'flex-row-reverse' : ''}`}>
               <button type="button" onClick={isAllSelected ? deselectAll : selectAll} className="text-[10px] font-black text-emerald-600 uppercase hover:underline">
                 {isAllSelected ? 'Deselect All' : 'Select All'}
               </button>
               <span className="text-[10px] font-black text-slate-400 uppercase">{options.length} {label}</span>
            </div>
            <div className="max-h-60 overflow-y-auto no-scrollbar space-y-0.5">
               {options.map(opt => (
                 <button key={opt.id} type="button" onClick={() => toggle(opt.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${selected.has(opt.id) ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'} ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                   <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selected.has(opt.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>
                     {selected.has(opt.id) && <Check className="w-3 h-3 stroke-[4]" />}
                   </div>
                   <span className="text-xs font-bold truncate">{opt.name}</span>
                 </button>
               ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Analytics: React.FC<Props> = ({ user, users, responses, templates, lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  
  const isAdmin = user.role === UserRole.ADMIN;

  const availableTrainers = useMemo(() => users.filter(u => u.role === UserRole.TRAINER), [users]);
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(responses.map(r => r.month))).sort();
    return months.map(m => ({ id: m, name: m }));
  }, [responses]);

  const [selectedTrainerIds, setSelectedTrainerIds] = useState<Set<string>>(new Set());
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set(availableMonths.map(m => m.id)));

  const availablePlayers = useMemo(() => {
    let players = users.filter(u => u.role === UserRole.PLAYER);
    if (user.role === UserRole.ADMIN && selectedTrainerIds.size > 0) {
        players = players.filter(p => p.trainerId && selectedTrainerIds.has(p.trainerId));
    } else if (user.role === UserRole.TRAINER) {
      players = players.filter(p => p.trainerId === user.id);
    } else if (user.role === UserRole.GUARDIAN) {
      players = players.filter(p => p.id === user.playerId);
    } else if (user.role === UserRole.PLAYER) {
      players = players.filter(p => p.id === user.id);
    }
    return players;
  }, [user, users, selectedTrainerIds]);

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set(
    availablePlayers.length > 0 ? [availablePlayers[0].id] : []
  ));

  const toggleTrainer = (id: string) => {
    const next = new Set(selectedTrainerIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedTrainerIds(next);
  };

  const togglePlayer = (id: string) => {
    const next = new Set(selectedPlayerIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedPlayerIds(next);
  };

  const toggleMonth = (id: string) => {
    const next = new Set(selectedMonths);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedMonths(next);
  };

  const playerResponses = useMemo(() => 
    responses.filter(r => {
      const targetPlayer = users.find(u => u.id === r.targetPlayerId);
      if (!targetPlayer) return false;
      const trainerMatch = selectedTrainerIds.size === 0 || (targetPlayer.trainerId && selectedTrainerIds.has(targetPlayer.trainerId));
      const playerMatch = selectedPlayerIds.size === 0 || selectedPlayerIds.has(r.targetPlayerId);
      const monthMatch = selectedMonths.size === 0 || selectedMonths.has(r.month);
      
      let roleMatch = false;
      if (user.role === UserRole.ADMIN) roleMatch = true;
      else if (user.role === UserRole.TRAINER) roleMatch = targetPlayer.trainerId === user.id;
      else if (user.role === UserRole.GUARDIAN) roleMatch = targetPlayer.id === user.playerId;
      else if (user.role === UserRole.PLAYER) roleMatch = targetPlayer.id === user.id;

      return trainerMatch && playerMatch && monthMatch && roleMatch;
    }),
    [responses, selectedPlayerIds, selectedMonths, selectedTrainerIds, user, users]
  );

  // Multi-Player Trend Data Logic
  const multiTrendData = useMemo(() => {
    const months = Array.from(selectedMonths).sort();
    const playersInView = Array.from(selectedPlayerIds);
    
    return months.map(month => {
      const row: any = { month };
      playersInView.forEach(pId => {
        const player = users.find(u => u.id === pId);
        if (!player) return;
        
        const monthEvals = playerResponses.filter(r => r.targetPlayerId === pId && r.month === month);
        if (monthEvals.length > 0) {
          row[player.name] = Math.round(monthEvals.reduce((acc, r) => acc + r.weightedScore, 0) / monthEvals.length);
        }
      });
      return row;
    }).filter(row => Object.keys(row).length > 1); // Only show months with at least one player score
  }, [playerResponses, selectedPlayerIds, selectedMonths, users]);

  const categoryTrendDelta = useMemo(() => {
    const categories: Record<string, { current: number, previous: number, arName: string, countC: number, countP: number }> = {};
    const months = Array.from(selectedMonths).sort();
    if (months.length < 2) return [];

    const currentMonth = months[months.length - 1];
    const prevMonth = months[months.length - 2];

    playerResponses.forEach(res => {
      const template = templates.find(t => t.id === res.templateId);
      if (!template) return;

      template.categories.forEach(cat => {
        const catKey = cat.name;
        if (!categories[catKey]) categories[catKey] = { current: 0, previous: 0, arName: cat.arName, countC: 0, countP: 0 };

        let score = 0; let count = 0;
        cat.questions.forEach(q => {
          if (res.answers[q.id] !== undefined) {
             score += (res.answers[q.id] / (res.answers[q.id] > 5 ? 10 : 5)) * 100;
             count++;
          }
        });

        if (count > 0) {
          const avg = score / count;
          if (res.month === currentMonth) {
            categories[catKey].current += avg;
            categories[catKey].countC++;
          } else if (res.month === prevMonth) {
            categories[catKey].previous += avg;
            categories[catKey].countP++;
          }
        }
      });
    });

    return Object.entries(categories).map(([name, data]) => {
      const curAvg = data.countC > 0 ? data.current / data.countC : 0;
      const prevAvg = data.countP > 0 ? data.previous / data.countP : 0;
      return {
        name: isRtl ? data.arName : name,
        delta: Math.round(curAvg - prevAvg),
        current: Math.round(curAvg)
      };
    }).filter(d => d.current > 0);
  }, [playerResponses, selectedMonths, templates, isRtl]);

  const radarData = useMemo(() => {
    const individualCategories: Record<string, { sum: number, count: number, arName: string }> = {};
    const squadCategories: Record<string, { sum: number, count: number }> = {};
    const allUniqueCats = new Set<string>();

    responses.forEach(res => {
      if (selectedMonths.size > 0 && !selectedMonths.has(res.month)) return;
      const template = templates.find(tpl => tpl.id === res.templateId);
      if (!template) return;

      template.categories.forEach(cat => {
        const catKey = cat.name; allUniqueCats.add(catKey);
        let catScoreSum = 0; let qCount = 0;
        cat.questions.forEach(q => {
          if (res.answers[q.id] !== undefined) {
            catScoreSum += (res.answers[q.id] / (res.answers[q.id] > 5 ? 10 : 5)) * 100;
            qCount++;
          }
        });

        if (qCount > 0) {
          const avg = catScoreSum / qCount;
          const targetPlayer = users.find(u => u.id === res.targetPlayerId);
          if (!targetPlayer) return;

          if (selectedPlayerIds.has(res.targetPlayerId)) {
            if (!individualCategories[catKey]) individualCategories[catKey] = { sum: 0, count: 0, arName: cat.arName };
            individualCategories[catKey].sum += avg; individualCategories[catKey].count += 1;
          }

          if (!squadCategories[catKey]) squadCategories[catKey] = { sum: 0, count: 0 };
          squadCategories[catKey].sum += avg; squadCategories[catKey].count += 1;
        }
      });
    });

    return Array.from(allUniqueCats).map(catName => ({
      subject: isRtl ? (individualCategories[catName]?.arName || catName) : catName,
      A: individualCategories[catName] ? Math.round(individualCategories[catName].sum / individualCategories[catName].count) : 0,
      B: squadCategories[catName] ? Math.round(squadCategories[catName].sum / squadCategories[catName].count) : 0,
    })).filter(d => d.A > 0 || d.B > 0);
  }, [responses, templates, selectedPlayerIds, selectedMonths, isRtl, users]);

  return (
    <div className={`animate-in fade-in duration-500 space-y-8 ${isRtl ? 'text-right font-arabic' : ''}`}>
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t.dataInsights}</h2>
          <p className="text-slate-500 font-medium">{isRtl ? 'تحليل مسارات الأداء والنمو والمقارنة بين اللاعبين.' : 'Performance trajectories, growth analysis, and player comparison.'}</p>
        </div>
        <div className={`flex flex-wrap items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          {isAdmin && (
            <MultiSelect label={isRtl ? 'المدربين' : 'Coaches'} icon={<Activity className="w-4 h-4 text-blue-500" />} options={availableTrainers.map(u => ({ id: u.id, name: u.name }))} selected={selectedTrainerIds} toggle={toggleTrainer} selectAll={() => setSelectedTrainerIds(new Set(availableTrainers.map(u => u.id)))} deselectAll={() => setSelectedTrainerIds(new Set())} isRtl={isRtl} />
          )}
          <MultiSelect label={isRtl ? 'اللاعبين' : 'Players'} icon={<Users className="w-4 h-4 text-slate-400" />} options={availablePlayers.map(p => ({ id: p.id, name: p.name }))} selected={selectedPlayerIds} toggle={togglePlayer} selectAll={() => setSelectedPlayerIds(new Set(availablePlayers.map(p => p.id)))} deselectAll={() => setSelectedPlayerIds(new Set())} isRtl={isRtl} />
          <MultiSelect label={isRtl ? 'الشهور' : 'Months'} icon={<Calendar className="w-4 h-4 text-slate-400" />} options={availableMonths} selected={selectedMonths} toggle={toggleMonth} selectAll={() => setSelectedMonths(new Set(availableMonths.map(m => m.id)))} deselectAll={() => setSelectedMonths(new Set())} isRtl={isRtl} />
        </div>
      </div>

      {playerResponses.length === 0 ? (
        <div className="bg-white p-20 rounded-[40px] border border-slate-200 shadow-sm text-center">
           <TrendingUp className="w-12 h-12 text-slate-200 mx-auto mb-4" />
           <h3 className="text-xl font-bold text-slate-900 mb-2">{isRtl ? 'لا توجد بيانات لهذه الاختيارات' : 'No Data for Selection'}</h3>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
             <div className="xl:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{isRtl ? 'تطور الفئات' : 'Category Growth'}</h4>
                   <div className="space-y-4">
                      {categoryTrendDelta.map((item, idx) => (
                         <div key={idx} className={`flex items-center justify-between p-3 bg-slate-50 rounded-2xl ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <span className="text-xs font-bold text-slate-700 truncate max-w-[100px]">{item.name}</span>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black ${item.delta > 0 ? 'text-emerald-600 bg-emerald-50' : item.delta < 0 ? 'text-rose-600 bg-rose-50' : 'text-slate-400 bg-slate-100'}`}>
                               {item.delta > 0 ? <ArrowUpRight className="w-3 h-3" /> : item.delta < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                               {Math.abs(item.delta)}%
                            </div>
                         </div>
                      ))}
                      {categoryTrendDelta.length === 0 && <p className="text-[10px] text-slate-400 italic text-center">Need 2+ months for trends</p>}
                   </div>
                </div>

                <div className={`bg-slate-900 p-8 rounded-[32px] text-white overflow-hidden relative ${isRtl ? 'text-right' : ''}`}>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{isRtl ? 'متوسط الاختيار' : 'Selection Avg'}</p>
                    <h3 className="text-4xl font-black">{Math.round(playerResponses.reduce((a,b)=>a+b.weightedScore,0)/playerResponses.length)}%</h3>
                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                       <span>{playerResponses.length} {isRtl ? 'استجابة' : 'Reports'}</span>
                       <Activity className="w-4 h-4 text-emerald-500" />
                    </div>
                </div>
             </div>

             <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col h-[450px]">
                   <h3 className="text-lg font-bold text-slate-900 mb-6">{t.competencyProfile}</h3>
                   <div className="flex-1">
                     <ResponsiveContainer width="100%" height="100%">
                       <RadarChart data={radarData}>
                         <PolarGrid stroke="#e2e8f0" />
                         <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                         <PolarRadiusAxis domain={[0, 100]} axisLine={false} tick={false} />
                         <Radar name={isRtl ? "المختار" : "Selected"} dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                         <Radar name={isRtl ? "الأكاديمية" : "Academy"} dataKey="B" stroke="#64748b" fill="#94a3b8" fillOpacity={0.1} />
                         <Tooltip />
                         <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                       </RadarChart>
                     </ResponsiveContainer>
                   </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col h-[450px]">
                   <div className={`flex items-center justify-between mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <h3 className="text-lg font-bold text-slate-900">{t.growthPath}</h3>
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">Comparison Mode</div>
                   </div>
                   <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={multiTrendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} dy={10} reversed={isRtl} />
                            <YAxis orientation={isRtl ? 'right' : 'left'} domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} dx={isRtl ? 5 : -5} />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Legend wrapperStyle={{ paddingTop: 20 }} />
                            {selectedPlayerIds.size > 0 && Array.from(selectedPlayerIds).map((pId, idx) => {
                               const player = users.find(u => u.id === pId);
                               if (!player) return null;
                               return (
                                 <Line 
                                   key={pId}
                                   type="monotone" 
                                   dataKey={player.name} 
                                   stroke={LINE_COLORS[idx % LINE_COLORS.length]} 
                                   strokeWidth={idx === 0 ? 4 : 2} 
                                   dot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} 
                                   activeDot={{ r: 6 }}
                                 />
                               );
                            })}
                         </LineChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

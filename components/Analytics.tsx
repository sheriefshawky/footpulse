
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
  Area
} from 'recharts';
import { Filter, TrendingUp, Target, Zap, Shield, ChevronUp, ChevronDown, Layout, Users, Check, X } from 'lucide-react';
import { translations } from '../translations';

interface Props {
  user: User;
  users: User[];
  responses: SurveyResponse[];
  templates: SurveyTemplate[];
  lang: Language;
}

// Reuseable Multi-Select Dropdown for Analytics
const PlayerMultiSelect: React.FC<{
  label: string;
  options: User[];
  selected: Set<string>;
  toggle: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  isRtl: boolean;
}> = ({ label, options, selected, toggle, selectAll, deselectAll, isRtl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isAllSelected = options.length > 0 && selected.size === options.length;

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm text-sm font-bold text-slate-700 hover:border-emerald-300 transition-all ${isRtl ? 'flex-row-reverse' : ''}`}
      >
        <Users className="w-4 h-4 text-slate-400" />
        <span className="truncate max-w-[150px]">
          {selected.size === 0 ? 'No Players' : selected.size === options.length ? 'All Players' : `${selected.size} Players`}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={`absolute z-50 mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 animate-in zoom-in-95 duration-200 ${isRtl ? 'right-0' : 'left-0'}`}>
            <div className={`flex items-center justify-between p-2 mb-2 border-b border-slate-50 ${isRtl ? 'flex-row-reverse' : ''}`}>
               <button 
                 type="button"
                 onClick={isAllSelected ? deselectAll : selectAll}
                 className="text-[10px] font-black text-emerald-600 uppercase hover:underline"
               >
                 {isAllSelected ? 'Deselect All' : 'Select All'}
               </button>
               <span className="text-[10px] font-black text-slate-400 uppercase">{options.length} {label}</span>
            </div>
            <div className="max-h-60 overflow-y-auto no-scrollbar space-y-0.5">
               {options.map(opt => (
                 <button
                   key={opt.id}
                   type="button"
                   onClick={() => toggle(opt.id)}
                   className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${selected.has(opt.id) ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'} ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                 >
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
  
  const availablePlayers = useMemo(() => {
    if (user.role === UserRole.ADMIN) return users.filter(u => u.role === UserRole.PLAYER);
    if (user.role === UserRole.TRAINER) return users.filter(u => u.role === UserRole.PLAYER && u.trainerId === user.id);
    if (user.role === UserRole.GUARDIAN) return users.filter(u => u.id === user.playerId);
    if (user.role === UserRole.PLAYER) return users.filter(u => u.id === user.id);
    return [];
  }, [user, users]);

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set(
    availablePlayers.length > 0 ? [availablePlayers[0].id] : []
  ));

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('ALL');

  const togglePlayer = (id: string) => {
    const next = new Set(selectedPlayerIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPlayerIds(next);
  };

  // Filtered Data for selected player(s)
  const playerResponses = useMemo(() => 
    responses.filter(r => selectedPlayerIds.has(r.targetPlayerId)),
    [responses, selectedPlayerIds]
  );

  // Trend Data: Average Weighted Score per Month across ALL selected players
  const trendData = useMemo(() => {
    const monthlyData: Record<string, { sum: number, count: number }> = {};
    playerResponses.forEach(r => {
      if (!monthlyData[r.month]) monthlyData[r.month] = { sum: 0, count: 0 };
      monthlyData[r.month].sum += r.weightedScore;
      monthlyData[r.month].count += 1;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        name: month,
        score: Math.round(data.sum / data.count)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [playerResponses]);

  // Radar Data: Competency Profile (Selection Averages vs Squad Averages)
  const radarData = useMemo(() => {
    const individualCategories: Record<string, { sum: number, count: number, arName: string }> = {};
    const squadCategories: Record<string, { sum: number, count: number }> = {};
    const allUniqueCats = new Set<string>();

    responses.forEach(res => {
      // If template filter is active, skip responses from other templates
      if (selectedTemplateId !== 'ALL' && res.templateId !== selectedTemplateId) return;

      const template = templates.find(tpl => tpl.id === res.templateId);
      if (!template) return;

      template.categories.forEach(cat => {
        const catKey = cat.name;
        allUniqueCats.add(catKey);

        // Logic for Category Score Calculation
        let catScoreSum = 0;
        let qAnswerCount = 0;
        cat.questions.forEach(q => {
          const answer = res.answers[q.id];
          if (answer !== undefined) {
            const denominator = answer > 5 ? 10 : 5;
            catScoreSum += (answer / denominator) * 100;
            qAnswerCount++;
          }
        });

        if (qAnswerCount > 0) {
          const finalScore = (catScoreSum / qAnswerCount);
          
          // 1. Group/Individual aggregation (The selected filter)
          if (selectedPlayerIds.has(res.targetPlayerId)) {
            if (!individualCategories[catKey]) {
              individualCategories[catKey] = { sum: 0, count: 0, arName: cat.arName };
            }
            individualCategories[catKey].sum += finalScore;
            individualCategories[catKey].count += 1;
          }

          // 2. Squad aggregation (benchmark context)
          let isSquadMember = false;
          if (user.role === UserRole.ADMIN) isSquadMember = true;
          else if (user.role === UserRole.TRAINER) {
              const target = users.find(u => u.id === res.targetPlayerId);
              isSquadMember = target?.trainerId === user.id;
          } else {
              isSquadMember = true; 
          }

          if (isSquadMember) {
              if (!squadCategories[catKey]) squadCategories[catKey] = { sum: 0, count: 0 };
              squadCategories[catKey].sum += finalScore;
              squadCategories[catKey].count += 1;
          }
        }
      });
    });

    return Array.from(allUniqueCats).map(catName => {
      const ind = individualCategories[catName];
      const sqd = squadCategories[catName];
      return {
        subject: isRtl ? (ind?.arName || catName) : catName,
        A: ind ? Math.round(ind.sum / ind.count) : 0,
        B: sqd ? Math.round(sqd.sum / sqd.count) : 0,
        fullMark: 100
      };
    }).filter(d => d.A > 0 || d.B > 0);
  }, [responses, templates, selectedPlayerIds, isRtl, user, users, selectedTemplateId]);

  const focusAreas = useMemo(() => {
    return [...radarData]
      .sort((a, b) => a.A - b.A)
      .slice(0, 3)
      .map((d, i) => ({
        label: d.subject,
        score: d.A,
        icon: i === 0 ? <Zap className="w-4 h-4 text-amber-400" /> : 
              i === 1 ? <Target className="w-4 h-4 text-rose-400" /> : 
              <Shield className="w-4 h-4 text-emerald-400" />
      }));
  }, [radarData]);

  const trendComparison = useMemo(() => {
    if (trendData.length < 2) return null;
    const current = trendData[trendData.length - 1].score;
    const last = trendData[trendData.length - 2].score;
    const diff = current - last;
    return {
      val: Math.abs(diff).toFixed(1),
      isUp: diff >= 0
    };
  }, [trendData]);

  return (
    <div className={`animate-in fade-in duration-500 space-y-8 ${isRtl ? 'text-right font-arabic' : ''}`}>
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t.dataInsights}</h2>
          <p className="text-slate-500 font-medium">{isRtl ? 'تحليل الأداء الفردي والجماعي بناءً على القوالب المختارة.' : 'Analyze individual and group performance based on selected templates.'}</p>
        </div>
        
        <div className={`flex flex-wrap items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          {availablePlayers.length > 1 && (
            <PlayerMultiSelect 
              label={isRtl ? 'اللاعبين' : 'Players'}
              options={availablePlayers}
              selected={selectedPlayerIds}
              toggle={togglePlayer}
              selectAll={() => setSelectedPlayerIds(new Set(availablePlayers.map(p => p.id)))}
              deselectAll={() => setSelectedPlayerIds(new Set())}
              isRtl={isRtl}
            />
          )}

          <div className={`flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Layout className={`w-4 h-4 text-slate-400 ${isRtl ? 'mr-2' : 'ml-2'}`} />
            <select 
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className={`bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 outline-none p-0 ${isRtl ? 'pl-8 pr-2' : 'pr-8 pl-2'}`}
            >
              <option value="ALL">{isRtl ? 'جميع القوالب' : 'All Templates'}</option>
              {templates.map(tpl => (
                <option key={tpl.id} value={tpl.id}>{isRtl ? tpl.arName : tpl.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {playerResponses.length === 0 ? (
        <div className="bg-white p-20 rounded-[40px] border border-slate-200 shadow-sm text-center">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-slate-300" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">{isRtl ? 'لا توجد بيانات لهذه الاختيارات' : 'No Data for Selection'}</h3>
           <p className="text-slate-500 max-w-md mx-auto">{isRtl ? 'يرجى تغيير عوامل التصفية أو اختيار لاعبين آخرين.' : 'Try adjusting your filters or selecting different players.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1 space-y-6">
            <div className={`bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex items-center justify-between overflow-hidden relative ${isRtl ? 'flex-row-reverse' : ''}`}>
               <div className="absolute right-0 bottom-0 opacity-5 scale-150 rotate-12">
                 <TrendingUp className="w-32 h-32" />
               </div>
               <div className={isRtl ? 'text-right' : ''}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isRtl ? 'متوسط أداء المجموعة' : 'Selection Performance'}</p>
                  <h3 className="text-4xl font-black text-slate-900">{Math.round(playerResponses.reduce((a,b)=>a+b.weightedScore,0)/playerResponses.length)}%</h3>
                  {trendComparison && (
                    <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${trendComparison.isUp ? 'text-emerald-500' : 'text-rose-500'} ${isRtl ? 'flex-row-reverse' : ''}`}>
                      {trendComparison.isUp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {trendComparison.val}% vs last month
                    </p>
                  )}
               </div>
               <div className="h-16 w-1 rounded-full bg-emerald-500"></div>
            </div>
            
            <div className={`bg-slate-900 p-8 rounded-[32px] shadow-xl shadow-slate-200 flex flex-col justify-between h-72 text-white overflow-hidden relative ${isRtl ? 'text-right' : ''}`}>
               <div className="z-10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">{isRtl ? 'مجالات التركيز للمجموعة' : 'Focus areas (Selection)'}</p>
                  <div className="space-y-5">
                    {focusAreas.length > 0 ? focusAreas.map((area, i) => (
                       <div key={i} className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className="p-2 bg-slate-800 rounded-lg">
                               {area.icon}
                            </div>
                            <span className="text-sm font-bold text-slate-200">{area.label}</span>
                          </div>
                          <div className="flex flex-col items-end">
                             <span className="text-xs font-black text-slate-400 uppercase">{area.score}%</span>
                             <div className="w-16 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${area.score}%` }}></div>
                             </div>
                          </div>
                       </div>
                    )) : <p className="text-xs text-slate-500 italic">No category data available</p>}
                  </div>
               </div>
               <div className={`mt-4 pt-4 border-t border-slate-800 text-slate-500 text-[10px] font-black italic ${isRtl ? 'text-right' : ''}`}>
                 {isRtl ? '*مستمد من أحدث تقييمات الأداء للمجموعة المختارة' : '*Derived from latest performance assessments of selection'}
               </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col">
             <h3 className="text-lg font-bold text-slate-900 mb-6">{t.competencyProfile}</h3>
             <div className="flex-1 min-h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                   <PolarGrid stroke="#e2e8f0" />
                   <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                   <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                   <Radar name={isRtl ? 'المجموعة المختارة' : 'Selection Avg'} dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                   <Radar name={isRtl ? 'متوسط الفريق' : 'Team Avg'} dataKey="B" stroke="#64748b" fill="#94a3b8" fillOpacity={0.1} />
                   <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                 </RadarChart>
               </ResponsiveContainer>
             </div>
             <div className={`flex justify-center gap-6 mt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                   <div className="w-3 h-3 rounded bg-emerald-500"></div>
                   <span className="text-[10px] font-black uppercase text-slate-500">{isRtl ? 'المختارة' : 'Selection'}</span>
                </div>
                <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                   <div className="w-3 h-3 rounded bg-slate-300"></div>
                   <span className="text-[10px] font-black uppercase text-slate-500">{isRtl ? 'متوسط الفريق' : 'Squad Avg'}</span>
                </div>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
             <h3 className="text-lg font-bold text-slate-900 mb-6">{t.growthPath}</h3>
             <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} dy={10} reversed={isRtl} />
                      <YAxis orientation={isRtl ? 'right' : 'left'} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} dx={isRtl ? 10 : -10} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textAlign: isRtl ? 'right' : 'left' }} />
                      <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

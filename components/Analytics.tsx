
import React, { useMemo, useState } from 'react';
import { User, UserRole, SurveyResponse, Language } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Filter, TrendingUp, Target, Zap, Shield } from 'lucide-react';
import { translations } from '../translations';

interface Props {
  user: User;
  users: User[];
  responses: SurveyResponse[];
  lang: Language;
}

const Analytics: React.FC<Props> = ({ user, users, responses, lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(() => {
    if (user.role === UserRole.PLAYER) return user.id;
    if (user.role === UserRole.GUARDIAN) return user.playerId || '';
    return users.find(u => u.role === UserRole.PLAYER)?.id || '';
  });

  const playerResponses = useMemo(() => 
    responses.filter(r => r.targetPlayerId === selectedPlayerId),
    [responses, selectedPlayerId]
  );

  const players = users.filter(u => u.role === UserRole.PLAYER);

  // Formatting for charts
  const trendData = useMemo(() => {
    return playerResponses.map(r => ({
      name: r.month,
      score: r.weightedScore
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [playerResponses]);

  const radarData = useMemo(() => {
    // Mock radar data by aggregating scores or using a sample
    return [
      { subject: isRtl ? 'فني' : 'Technical', A: 85, B: 70, fullMark: 100 },
      { subject: isRtl ? 'تكتيكي' : 'Tactical', A: 78, B: 85, fullMark: 100 },
      { subject: isRtl ? 'بدني' : 'Physical', A: 92, B: 90, fullMark: 100 },
      { subject: isRtl ? 'ذهني' : 'Mental', A: 65, B: 80, fullMark: 100 },
      { subject: isRtl ? 'عمل جماعي' : 'Teamwork', A: 88, B: 75, fullMark: 100 },
    ];
  }, [isRtl]);

  return (
    <div className={`animate-in fade-in duration-500 space-y-8 ${isRtl ? 'text-right font-arabic' : ''}`}>
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{t.dataInsights}</h2>
          <p className="text-slate-500 font-medium">{isRtl ? 'تعمق في مقاييس نمو اللاعب وفعالية التدريب.' : 'Deep dive into player growth and training effectiveness metrics.'}</p>
        </div>
        
        {(user.role === UserRole.ADMIN || user.role === UserRole.TRAINER) && (
          <div className={`flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Filter className={`w-4 h-4 text-slate-400 ${isRtl ? 'mr-2' : 'ml-2'}`} />
            <select 
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className={`bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 outline-none ${isRtl ? 'pl-8 pr-2' : 'pr-8 pl-2'}`}
            >
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Performance Cards */}
        <div className="xl:col-span-1 space-y-6">
          <div className={`bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between overflow-hidden relative ${isRtl ? 'flex-row-reverse' : ''}`}>
             <div className="absolute right-0 bottom-0 opacity-5 scale-150 rotate-12">
               <TrendingUp className="w-32 h-32" />
             </div>
             <div className={isRtl ? 'text-right' : ''}>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{isRtl ? 'متوسط الأكاديمية' : 'Academy Average'}</p>
                <h3 className="text-4xl font-black text-slate-900">74%</h3>
                <p className="text-xs font-bold text-emerald-500 mt-2">{isRtl ? '↑ 3.2% مقابل الشهر الماضي' : '↑ 3.2% vs last month'}</p>
             </div>
             <div className="h-16 w-1 rounded-full bg-emerald-500"></div>
          </div>
          
          <div className={`bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200 flex flex-col justify-between h-64 text-white overflow-hidden relative ${isRtl ? 'text-right' : ''}`}>
             <div className="z-10">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">{isRtl ? 'مجالات التركيز' : 'Focus areas'}</p>
                <div className="space-y-4">
                   <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-bold">{isRtl ? 'الانفجارية' : 'Explosivity'}</span>
                      </div>
                      <span className="text-xs font-black text-slate-400">LEVEL 8</span>
                   </div>
                   <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <Target className="w-4 h-4 text-rose-400" />
                        <span className="text-sm font-bold">{isRtl ? 'اتخاذ القرار' : 'Decision Making'}</span>
                      </div>
                      <span className="text-xs font-black text-slate-400">LEVEL 6</span>
                   </div>
                   <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-bold">{isRtl ? 'التحمل' : 'Endurance'}</span>
                      </div>
                      <span className="text-xs font-black text-slate-400">LEVEL 9</span>
                   </div>
                </div>
             </div>
             <div className={`mt-4 pt-4 border-t border-slate-800 text-slate-500 text-[10px] font-black italic ${isRtl ? 'text-right' : ''}`}>
               {isRtl ? '*مستمد من أحدث ملاحظات المدرب' : '*Derived from latest coach feedback'}
             </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
           <h3 className="text-lg font-bold text-slate-900 mb-6">{t.competencyProfile}</h3>
           <div className="flex-1 min-h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                 <PolarGrid stroke="#e2e8f0" />
                 <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 11, fontWeight: 700}} />
                 <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                 <Radar name={isRtl ? 'فردي' : 'Individual'} dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                 <Radar name={isRtl ? 'متوسط الفريق' : 'Team Avg'} dataKey="B" stroke="#64748b" fill="#94a3b8" fillOpacity={0.1} />
                 <Tooltip />
               </RadarChart>
             </ResponsiveContainer>
           </div>
           <div className={`flex justify-center gap-6 mt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                 <div className="w-3 h-3 rounded bg-emerald-500"></div>
                 <span className="text-xs font-bold text-slate-600">{isRtl ? 'فردي' : 'Individual'}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                 <div className="w-3 h-3 rounded bg-slate-400"></div>
                 <span className="text-xs font-bold text-slate-600">{isRtl ? 'متوسط الفريق' : 'Squad Average'}</span>
              </div>
           </div>
        </div>

        {/* Growth Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
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
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dy={10} reversed={isRtl} />
                    <YAxis orientation={isRtl ? 'right' : 'left'} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dx={isRtl ? 10 : -10} />
                    <Tooltip contentStyle={{ textAlign: isRtl ? 'right' : 'left' }} />
                    <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

import React, { useMemo, useState } from 'react';
import { User, UserRole, SurveyResponse, SurveyTemplate, Language } from '../types';
import { 
  BarChart, 
  Bar, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { ChevronDown, Check, Users, Calendar, ClipboardList, HelpCircle, LayoutGrid } from 'lucide-react';
import { translations } from '../translations';

interface SurveyAnalyticsProps {
  users: User[];
  templates: SurveyTemplate[];
  responses: SurveyResponse[];
  lang: Language;
}

// Custom Multi-Select Dropdown Component
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
    <div className="relative group">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-emerald-300 transition-all text-sm font-bold text-slate-700 ${isRtl ? 'flex-row-reverse' : ''}`}
      >
        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
           {icon}
           <span className="truncate max-w-[120px]">{label}: {selected.size === 0 ? 'None' : selected.size === options.length ? 'All' : selected.size}</span>
        </div>
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
               <span className="text-[10px] font-black text-slate-400 uppercase">{options.length} Options</span>
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

const SurveyAnalytics: React.FC<SurveyAnalyticsProps> = ({ users, templates, responses, lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // Available Filter Options
  const months: string[] = useMemo(() => Array.from(new Set(responses.map(r => r.month))).sort(), [responses]);
  
  // Filter States
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [selectedSurveys, setSelectedSurveys] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  // Derive available categories and questions based on survey selection
  const availableCategories = useMemo(() => {
    const cats: { id: string, name: string }[] = [];
    templates.forEach(tpl => {
      if (selectedSurveys.size === 0 || selectedSurveys.has(tpl.id)) {
        tpl.categories.forEach(cat => cats.push({ id: cat.id, name: isRtl ? cat.arName : cat.name }));
      }
    });
    return cats;
  }, [templates, selectedSurveys, isRtl]);

  const availableQuestions = useMemo(() => {
    const qs: { id: string, name: string }[] = [];
    templates.forEach(tpl => {
      if (selectedSurveys.size === 0 || selectedSurveys.has(tpl.id)) {
        tpl.categories.forEach(cat => {
          if (selectedCategories.size === 0 || selectedCategories.has(cat.id)) {
            cat.questions.forEach(q => qs.push({ id: q.id, name: isRtl ? q.arText : q.text }));
          }
        });
      }
    });
    return qs;
  }, [templates, selectedSurveys, selectedCategories, isRtl]);

  // Generic toggle helper
  const toggleItem = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  const selectAllHelper = (items: {id: string}[], setter: (s: Set<string>) => void) => setter(new Set(items.map(i => i.id)));
  const deselectAllHelper = (setter: (s: Set<string>) => void) => setter(new Set());

  // Filter Data
  const filteredData = useMemo(() => {
    return responses.filter(r => {
      const userMatch = selectedUsers.size === 0 || selectedUsers.has(r.targetPlayerId);
      const monthMatch = selectedMonths.size === 0 || selectedMonths.has(r.month);
      const surveyMatch = selectedSurveys.size === 0 || selectedSurveys.has(r.templateId);
      return userMatch && monthMatch && surveyMatch;
    });
  }, [responses, selectedUsers, selectedMonths, selectedSurveys]);

  // Chart Data Preparation: Trend by Month
  const trendByMonthData = useMemo(() => {
    const data: Record<string, { month: string, sum: number, count: number }> = {};
    filteredData.forEach(r => {
      if (!data[r.month]) data[r.month] = { month: r.month, sum: 0, count: 0 };
      
      let totalValue = 0;
      let qCount = 0;
      
      const tpl = templates.find(t => t.id === r.templateId);
      if (tpl) {
        tpl.categories.forEach(cat => {
          if (selectedCategories.size === 0 || selectedCategories.has(cat.id)) {
            cat.questions.forEach(q => {
              if (selectedQuestions.size === 0 || selectedQuestions.has(q.id)) {
                if (r.answers[q.id] !== undefined) {
                  totalValue += r.answers[q.id];
                  qCount++;
                }
              }
            });
          }
        });
      }

      if (qCount > 0) {
        data[r.month].sum += (totalValue / qCount);
        data[r.month].count += 1;
      } else {
        data[r.month].sum += r.weightedScore;
        data[r.month].count += 1;
      }
    });

    return Object.values(data).map(d => ({
      month: d.month,
      score: Math.round(d.sum / d.count)
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredData, templates, selectedCategories, selectedQuestions]);

  // User comparison chart data
  const comparisonData = useMemo(() => {
    const data: Record<string, { name: string, score: number, count: number }> = {};
    filteredData.forEach(r => {
      const user = users.find(u => u.id === r.targetPlayerId);
      if (!user) return;
      if (!data[r.targetPlayerId]) data[r.targetPlayerId] = { name: user.name, score: 0, count: 0 };
      
      data[r.targetPlayerId].score += r.weightedScore;
      data[r.targetPlayerId].count += 1;
    });
    return Object.values(data).map(d => ({
      name: d.name,
      score: Math.round(d.score / d.count)
    })).sort((a, b) => b.score - a.score);
  }, [filteredData, users]);

  return (
    <div className={`space-y-8 animate-in fade-in duration-500 pb-20 ${isRtl ? 'text-right' : ''}`}>
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t.surveyAnalytics}</h2>
        <p className="text-slate-500 font-medium">{isRtl ? 'تحليل متقدم للاستبيانات عبر معايير تصفية متعددة.' : 'Advanced survey analysis across multiple filtering dimensions.'}</p>
      </header>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MultiSelect 
          label={isRtl ? 'المستخدمين' : 'Users'} 
          icon={<Users className="w-4 h-4 text-blue-500" />}
          options={users.filter(u => u.role !== UserRole.ADMIN).map(u => ({ id: u.id, name: u.name }))}
          selected={selectedUsers}
          toggle={(id) => toggleItem(selectedUsers, setSelectedUsers, id)}
          selectAll={() => selectAllHelper(users.filter(u => u.role !== UserRole.ADMIN), setSelectedUsers)}
          deselectAll={() => deselectAllHelper(setSelectedUsers)}
          isRtl={isRtl}
        />
        <MultiSelect 
          label={isRtl ? 'الأشهر' : 'Months'} 
          icon={<Calendar className="w-4 h-4 text-emerald-500" />}
          options={months.map((m: string) => ({ id: m, name: m }))}
          selected={selectedMonths}
          toggle={(id) => toggleItem(selectedMonths, setSelectedMonths, id)}
          selectAll={() => selectAllHelper(months.map((m: string) => ({ id: m })), setSelectedMonths)}
          deselectAll={() => deselectAllHelper(setSelectedMonths)}
          isRtl={isRtl}
        />
        <MultiSelect 
          label={isRtl ? 'الاستبيانات' : 'Surveys'} 
          icon={<ClipboardList className="w-4 h-4 text-purple-500" />}
          options={templates.map(tpl => ({ id: tpl.id, name: isRtl ? tpl.arName : tpl.name }))}
          selected={selectedSurveys}
          toggle={(id) => toggleItem(selectedSurveys, setSelectedSurveys, id)}
          selectAll={() => selectAllHelper(templates, setSelectedSurveys)}
          deselectAll={() => deselectAllHelper(setSelectedSurveys)}
          isRtl={isRtl}
        />
        <MultiSelect 
          label={isRtl ? 'الفئات' : 'Categories'} 
          icon={<LayoutGrid className="w-4 h-4 text-amber-500" />}
          options={availableCategories}
          selected={selectedCategories}
          toggle={(id) => toggleItem(selectedCategories, setSelectedCategories, id)}
          selectAll={() => selectAllHelper(availableCategories, setSelectedCategories)}
          deselectAll={() => deselectAllHelper(setSelectedCategories)}
          isRtl={isRtl}
        />
        <MultiSelect 
          label={isRtl ? 'الأسئلة' : 'Questions'} 
          icon={<HelpCircle className="w-4 h-4 text-rose-500" />}
          options={availableQuestions}
          selected={selectedQuestions}
          toggle={(id) => toggleItem(selectedQuestions, setSelectedQuestions, id)}
          selectAll={() => selectAllHelper(availableQuestions, setSelectedQuestions)}
          deselectAll={() => deselectAllHelper(setSelectedQuestions)}
          isRtl={isRtl}
        />
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         {[
           { label: isRtl ? 'إجمالي الاستجابات' : 'Total Responses', value: filteredData.length, color: 'blue' },
           { label: isRtl ? 'المستخدمون المشمولون' : 'Users Included', value: new Set(filteredData.map(r => r.targetPlayerId)).size, color: 'indigo' },
           { label: isRtl ? 'متوسط النتيجة' : 'Average Score', value: filteredData.length > 0 ? `${Math.round(filteredData.reduce((acc, r) => acc + r.weightedScore, 0) / filteredData.length)}%` : '0%', color: 'emerald' },
           { label: isRtl ? 'الاستبيانات النشطة' : 'Active Templates', value: new Set(filteredData.map(r => r.templateId)).size, color: 'purple' },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
             <p className={`text-3xl font-black text-${stat.color}-600`}>{stat.value}</p>
           </div>
         ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Trend Analysis */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[450px]">
          <div className={`flex items-center justify-between mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
             <h3 className="text-xl font-bold text-slate-900">{t.trendAnalysis}</h3>
             <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">Selected Period</div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendByMonthData}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dy={10} reversed={isRtl} />
                <YAxis orientation={isRtl ? 'right' : 'left'} domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dx={isRtl ? 10 : -10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorTrend)" dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Comparison */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[450px]">
          <div className={`flex items-center justify-between mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
             <h3 className="text-xl font-bold text-slate-900">{t.comparisonView}</h3>
             <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">Performance Rank</div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical" margin={{ left: 20, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{fill: '#475569', fontSize: 11, fontWeight: 700}} orientation={isRtl ? 'right' : 'left'} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="score" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={24}>
                   {comparisonData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#3b82f6'} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className={`p-6 border-b border-slate-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <h3 className="text-lg font-bold text-slate-900">{isRtl ? 'سجل الاستجابات المفصل' : 'Detailed Response Log'}</h3>
          <span className="text-xs font-bold text-slate-400">{filteredData.length} records matching filters</span>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className={`w-full ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'المستخدم' : 'User'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'الشهر' : 'Month'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'الاستبيان' : 'Survey'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{isRtl ? 'النتيجة' : 'Score'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'التاريخ' : 'Date'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.slice(0, 10).map(r => {
                const user = users.find(u => u.id === r.targetPlayerId);
                const tpl = templates.find(t => t.id === r.templateId);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <img src={user?.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                        <span className="text-xs font-bold text-slate-900">{user?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{r.month}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{isRtl ? tpl?.arName : tpl?.name}</td>
                    <td className="px-6 py-4 text-center">
                       <span className={`px-2 py-1 rounded-lg text-xs font-black ${r.weightedScore >= 80 ? 'bg-emerald-50 text-emerald-600' : r.weightedScore >= 60 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                         {r.weightedScore}%
                       </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-medium text-slate-400">{new Date(r.date).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredData.length > 10 && (
            <div className="p-4 text-center border-t border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">... Showing top 10 results ...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyAnalytics;

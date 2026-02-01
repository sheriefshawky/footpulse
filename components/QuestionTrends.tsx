
import React, { useMemo, useState } from 'react';
import { User, UserRole, SurveyResponse, SurveyTemplate, Language, Question, Category } from '../types';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { User as UserIcon, FileText, Target, Activity, Star, LayoutList, AlertCircle, Layers } from 'lucide-react';
import { translations } from '../translations';

interface QuestionTrendsProps {
  users: User[];
  templates: SurveyTemplate[];
  responses: SurveyResponse[];
  lang: Language;
}

const QuestionTrends: React.FC<QuestionTrendsProps> = ({ users, templates, responses, lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const targetUsers = useMemo(() => 
    users.filter(u => u.role !== UserRole.ADMIN).sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );

  const selectedTemplate = useMemo(() => 
    templates.find(tpl => tpl.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  const filteredResponses = useMemo(() => {
    if (!selectedUserId || !selectedTemplateId) return [];
    return responses
      .filter(r => r.targetPlayerId === selectedUserId && r.templateId === selectedTemplateId)
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [responses, selectedUserId, selectedTemplateId]);

  // Helper to generate chart data for a specific question
  const getQuestionChartData = (qId: string) => {
    return filteredResponses.map(res => ({
      month: res.month,
      score: res.answers[qId] || 0
    }));
  };

  // Helper to calculate question average
  const getQuestionAvg = (qId: string) => {
    if (filteredResponses.length === 0) return 0;
    const sum = filteredResponses.reduce((acc, r) => acc + (r.answers[qId] || 0), 0);
    return (sum / filteredResponses.length).toFixed(1);
  };

  return (
    <div className={`space-y-8 animate-in fade-in duration-500 pb-20 ${isRtl ? 'text-right font-arabic' : ''}`}>
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{isRtl ? 'نبض الأسئلة الفردية' : 'Individual Question Pulse'}</h2>
        <p className="text-slate-500 font-medium">
          {isRtl ? 'تحليل تفصيلي لكل مقياس مصنف حسب فئات التقييم.' : 'Detailed trend analysis for every specific metric categorized by evaluation domains.'}
        </p>
      </header>

      {/* Selection Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
            <UserIcon className="w-3 h-3 text-emerald-500" /> {t.selectUser}
          </label>
          <select 
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700 transition-all"
          >
            <option value="">{isRtl ? 'اختر مستخدماً...' : 'Choose a user...'}</option>
            {targetUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
            <FileText className="w-3 h-3 text-blue-500" /> {t.selectTemplate}
          </label>
          <select 
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700 transition-all"
          >
            <option value="">{isRtl ? 'اختر قالباً...' : 'Choose a template...'}</option>
            {templates.map(tpl => (
              <option key={tpl.id} value={tpl.id}>{isRtl ? tpl.arName : tpl.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedUserId || !selectedTemplateId ? (
        <div className="bg-white p-20 rounded-[48px] border border-slate-200 shadow-sm text-center">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <LayoutList className="w-10 h-10" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">{isRtl ? 'رؤية النبض الفردي' : 'Metric Pulse View'}</h3>
           <p className="text-slate-500">{isRtl ? 'اختر مستخدماً وقالباً لمشاهدة تحليل مفصل لكل سؤال.' : 'Select a user and template to generate individual trend charts for every question.'}</p>
        </div>
      ) : filteredResponses.length === 0 ? (
        <div className="bg-white p-20 rounded-[48px] border border-slate-200 shadow-sm text-center">
           <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-300">
              <AlertCircle className="w-10 h-10" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">{isRtl ? 'لا توجد بيانات' : 'No Data Available'}</h3>
           <p className="text-slate-500">{isRtl ? 'لم يتم العثور على استجابات لهذا الاختيار.' : 'No performance data found for the selected user and survey.'}</p>
        </div>
      ) : (
        <div className="space-y-16">
          {selectedTemplate.categories.map((cat, catIdx) => (
            <section key={cat.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${catIdx * 100}ms` }}>
              <div className={`flex items-center gap-3 border-b border-slate-200 pb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                 <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
                    <Layers className="w-5 h-5" />
                 </div>
                 <div className={isRtl ? 'text-right' : ''}>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{isRtl ? cat.arName : cat.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat.questions.length} {isRtl ? 'مقاييس' : 'Metrics'}</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {cat.questions.map((q, qIdx) => (
                  <div key={q.id} className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col h-[400px] hover:border-emerald-200 transition-colors">
                    <div className={`flex items-start justify-between mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                       <div className={`flex-1 ${isRtl ? 'text-right' : ''}`}>
                          <div className={`flex items-center gap-2 mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                             <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                                <Target className="w-4 h-4" />
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'سؤال التقييم' : 'Assessment Metric'}</span>
                          </div>
                          <h3 className="text-lg font-black text-slate-900 leading-tight">{isRtl ? q.arText : q.text}</h3>
                       </div>
                       <div className={`flex flex-col items-end gap-1 ${isRtl ? 'items-start' : 'items-end'}`}>
                          <div className="px-3 py-1 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-tighter">
                             {isRtl ? 'المتوسط: ' : 'Avg: '}{getQuestionAvg(q.id)}
                          </div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{isRtl ? 'درجة 1-5' : 'Score 1-5'}</span>
                       </div>
                    </div>

                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getQuestionChartData(q.id)}>
                          <defs>
                            <linearGradient id={`color-${q.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={catIdx % 2 === 0 ? '#10b981' : '#3b82f6'} stopOpacity={0.2}/>
                              <stop offset="95%" stopColor={catIdx % 2 === 0 ? '#10b981' : '#3b82f6'} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                            dy={10} 
                            reversed={isRtl} 
                          />
                          <YAxis 
                            domain={[0, 5]}
                            ticks={[1, 2, 3, 4, 5]}
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                            dx={isRtl ? 10 : -10} 
                            orientation={isRtl ? 'right' : 'left'}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                            labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: catIdx % 2 === 0 ? '#10b981' : '#3b82f6', marginBottom: '4px' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke={catIdx % 2 === 0 ? '#10b981' : '#3b82f6'} 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill={`url(#color-${q.id})`}
                            dot={{ r: 4, fill: catIdx % 2 === 0 ? '#10b981' : '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className={`mt-6 pt-4 border-t border-slate-50 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                       <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <Activity className="w-3 h-3 text-slate-300" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                             {isRtl ? 'الاتجاه عبر الزمن' : 'Trend Over Time'}
                          </span>
                       </div>
                       <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                             <Star 
                               key={star} 
                               className={`w-2.5 h-2.5 ${star <= Math.round(Number(getQuestionAvg(q.id))) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                             />
                          ))}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionTrends;


import React, { useMemo, useState } from 'react';
import { User, UserRole, SurveyResponse, SurveyTemplate, Language, Question } from '../types';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';
import { User as UserIcon, FileText, TrendingUp, AlertCircle, LayoutList } from 'lucide-react';
import { translations } from '../translations';

interface QuestionTrendsProps {
  users: User[];
  templates: SurveyTemplate[];
  responses: SurveyResponse[];
  lang: Language;
}

// How many units of height to give each question "track" in the stacked chart
const TRACK_HEIGHT = 15;

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

  const allQuestions = useMemo(() => {
    if (!selectedTemplate) return [];
    const qs: Question[] = [];
    selectedTemplate.categories.forEach(cat => {
      cat.questions.forEach(q => qs.push(q));
    });
    return qs;
  }, [selectedTemplate]);

  const filteredResponses = useMemo(() => {
    if (!selectedUserId || !selectedTemplateId) return [];
    return responses
      .filter(r => r.targetPlayerId === selectedUserId && r.templateId === selectedTemplateId)
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [responses, selectedUserId, selectedTemplateId]);

  /**
   * Data Transformation:
   * We create a 'stacked' representation. 
   * Question 0 (Bottom) is at Y: 0 - 10
   * Question 1 is at Y: 20 - 30
   * Question 2 is at Y: 40 - 50
   * etc.
   */
  const chartData = useMemo(() => {
    if (!selectedTemplate || filteredResponses.length === 0) return [];

    return filteredResponses.map(res => {
      const dataPoint: any = { month: res.month };
      allQuestions.forEach((q, index) => {
        const score = res.answers[q.id] || 0;
        // Normalize score to 0-10 range if it's 1-5
        const normalizedScore = score > 5 ? score : score * 2;
        // Offset by track index
        dataPoint[q.id] = (index * TRACK_HEIGHT) + normalizedScore;
        // Keep raw score for tooltip
        dataPoint[`${q.id}_raw`] = score;
      });
      return dataPoint;
    });
  }, [selectedTemplate, allQuestions, filteredResponses]);

  // Generate Y-axis ticks at the start of each question track
  const yAxisTicks = useMemo(() => {
    return allQuestions.map((_, index) => index * TRACK_HEIGHT);
  }, [allQuestions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 min-w-[200px]">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3 border-b border-slate-700 pb-2">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any) => {
              const q = allQuestions.find(item => item.id === entry.dataKey);
              const rawVal = entry.payload[`${entry.dataKey}_raw`];
              return (
                <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold truncate max-w-[140px] opacity-80">
                    {isRtl ? q?.arText : q?.text}
                  </span>
                  <span className="text-xs font-black text-emerald-400">{rawVal}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-8 animate-in fade-in duration-500 pb-20 ${isRtl ? 'text-right' : ''}`}>
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{isRtl ? 'نبض الأداء المتعدد' : 'Multi-Metric Performance Pulse'}</h2>
        <p className="text-slate-500 font-medium">
          {isRtl ? 'رؤية شاملة لجميع الأسئلة في رسم بياني واحد موحد.' : 'A high-efficiency stacked view of every survey question in one unified chart.'}
        </p>
      </header>

      {/* Selection Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
            <UserIcon className="w-3 h-3" /> {t.selectUser}
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
            <FileText className="w-3 h-3" /> {t.selectTemplate}
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
           <h3 className="text-xl font-bold text-slate-900 mb-2">{isRtl ? 'تحليل نبض الأسئلة' : 'Efficiency Pulse View'}</h3>
           <p className="text-slate-500">{isRtl ? 'اختر مستخدماً وقالباً لمشاهدة جميع اتجاهات الأسئلة المكدسة عمودياً.' : 'Select a user and template to see all question trends vertically stacked for comparison.'}</p>
        </div>
      ) : chartData.length === 0 ? (
        <div className="bg-white p-20 rounded-[48px] border border-slate-200 shadow-sm text-center">
           <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-300">
              <AlertCircle className="w-10 h-10" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">{isRtl ? 'لا توجد بيانات' : 'No Data Available'}</h3>
           <p className="text-slate-500">{isRtl ? 'لم يتم العثور على استجابات لهذا الاختيار.' : 'No performance data found for the selected user and survey.'}</p>
        </div>
      ) : (
        <div className="bg-white p-6 md:p-10 rounded-[48px] border border-slate-200 shadow-sm flex flex-col h-[800px] animate-in slide-in-from-bottom-4 duration-700">
          <div className={`flex items-center justify-between mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
             <div className={isRtl ? 'text-right' : ''}>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{isRtl ? 'مصفوفة اتجاهات الأسئلة' : 'Questions Pulse Matrix'}</h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-[0.3em]">{isRtl ? selectedTemplate.arName : selectedTemplate.name}</p>
             </div>
             <div className="p-4 bg-slate-900 text-white rounded-3xl hidden md:block">
                <TrendingUp className="w-8 h-8 text-emerald-400" />
             </div>
          </div>

          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: isRtl ? 0 : 40, right: isRtl ? 40 : 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} 
                  dy={10} 
                  reversed={isRtl} 
                />
                <YAxis 
                  ticks={yAxisTicks}
                  domain={[0, (allQuestions.length * TRACK_HEIGHT) + 5]}
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => {
                    const index = Math.round(value / TRACK_HEIGHT);
                    const q = allQuestions[index];
                    if (!q) return '';
                    const label = isRtl ? q.arText : q.text;
                    return label.length > 25 ? label.substring(0, 22) + '...' : label;
                  }}
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 800}}
                  dx={isRtl ? 10 : -10} 
                  orientation={isRtl ? 'right' : 'left'}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Reference lines for each question track baseline */}
                {allQuestions.map((q, idx) => (
                  <ReferenceLine 
                    key={`ref-${q.id}`} 
                    y={idx * TRACK_HEIGHT} 
                    stroke="#e2e8f0" 
                    strokeDasharray="2 2"
                  />
                ))}

                {allQuestions.map((q, idx) => (
                  <Line 
                    key={q.id}
                    type="monotone" 
                    dataKey={q.id} 
                    stroke={idx % 2 === 0 ? '#10b981' : '#3b82f6'} 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: idx % 2 === 0 ? '#10b981' : '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'المقاييس الفردية' : 'Metric Track A'}</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'المقاييس الزوجية' : 'Metric Track B'}</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionTrends;

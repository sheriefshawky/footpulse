
import React, { useState, useMemo } from 'react';
import { User, UserRole, SurveyTemplate, SurveyResponse, Language, SurveyAssignment } from '../types';
import { CheckCircle2, ArrowRight, Timer, ClipboardCheck, Search, Eye, Filter, X, Lock, Trash2, ListFilter } from 'lucide-react';
import { translations } from '../translations';
import { api } from '../api';

interface Props {
  user: User;
  users: User[];
  templates: SurveyTemplate[];
  responses: SurveyResponse[];
  assignments: SurveyAssignment[];
  onStartSurvey: (t: SurveyTemplate, targetId: string, month: string) => void;
  lang: Language;
}

const SurveyList: React.FC<Props> = ({ user, users, templates, responses, assignments, onStartSurvey, lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const isAdmin = user.role === UserRole.ADMIN;
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [templateFilter, setTemplateFilter] = useState<string>('ALL');
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      // 1. Visibility Rules
      if (!isAdmin) {
        const isRespondent = a.respondentId === user.id;
        const isTarget = a.targetId === user.id;
        const isChildTarget = user.role === UserRole.GUARDIAN && a.targetId === user.playerId;
        if (!isRespondent && !isTarget && !isChildTarget) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;

      // 3. Template Filter
      if (templateFilter !== 'ALL' && a.templateId !== templateFilter) return false;

      // 4. Search Filter
      const respondent = users.find(u => u.id === a.respondentId);
      const target = users.find(u => u.id === a.targetId);
      const template = templates.find(temp => temp.id === a.templateId);
      
      const matchesSearch = 
        (respondent?.name || '').toLowerCase().includes(search.toLowerCase()) || 
        (target?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (template?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (template?.arName || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.month || '').includes(search);
        
      return matchesSearch;
    });
  }, [assignments, search, statusFilter, templateFilter, isAdmin, user, users, templates]);

  const handleDeleteAssignment = async (assignment: SurveyAssignment) => {
    const confirmMsg = assignment.status === 'COMPLETED' 
      ? (isRtl ? "هل أنت متأكد من حذف هذا الاستبيان؟ سيتم حذف الإجابات أيضاً." : "Are you sure you want to delete this assessment? The response data will also be deleted.")
      : (isRtl ? "هل أنت متأكد من حذف هذا التقييم المعلق؟" : "Are you sure you want to delete this pending assessment?");
    
    if (confirm(confirmMsg)) {
      try {
        await api.delete(`/assignments/${assignment.id}`);
        window.location.reload(); 
      } catch (err: any) {
        alert(err.message || "Failed to delete assessment");
      }
    }
  };

  const handleViewResponse = (assignment: SurveyAssignment) => {
    const res = responses.find(r => 
      r.templateId === assignment.templateId && 
      r.userId === assignment.respondentId && 
      r.targetPlayerId === assignment.targetId && 
      r.month === assignment.month
    );
    if (res) {
      setSelectedResponse(res);
    } else {
      alert(isRtl ? "لم يتم العثور على بيانات الاستجابة." : "Response data not found.");
    }
  };

  return (
    <div className={`animate-in fade-in duration-500 pb-20 ${isRtl ? 'text-right font-arabic' : ''}`}>
      <div className="space-y-6 mb-8">
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {isAdmin ? (isRtl ? 'إدارة جميع الاستبيانات' : 'Manage All Surveys') : t.surveys}
            </h2>
            <p className="text-slate-500 font-medium">
              {isAdmin 
                ? (isRtl ? 'عرض ومراقبة وحذف استبيانات الأكاديمية.' : 'View and monitor academy surveys.')
                : (isRtl ? "عرض التقييمات المكتملة والمعلقة." : "View completed and pending assessments.")}
            </p>
          </div>
          
          <div className="relative max-w-sm w-full">
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <input 
              type="text" 
              placeholder={isRtl ? 'بحث باسم اللاعب أو الشهر...' : 'Search by player, month...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm`}
            />
          </div>
        </div>

        {/* Filter Row */}
        <div className={`flex flex-wrap items-center gap-4 p-2 bg-white border border-slate-100 rounded-2xl shadow-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 px-3 py-1.5 border-r border-slate-100 ${isRtl ? 'border-r-0 border-l' : ''}`}>
             <ListFilter className="w-4 h-4 text-slate-400" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'التصفية' : 'Filters'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="ALL">{isRtl ? 'كل الحالات' : 'All Status'}</option>
              <option value="PENDING">{isRtl ? 'معلق' : 'Pending'}</option>
              <option value="COMPLETED">{isRtl ? 'مكتمل' : 'Completed'}</option>
            </select>
            
            <select 
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="ALL">{isRtl ? 'كل القوالب' : 'All Templates'}</option>
              {templates.map(tpl => (
                <option key={tpl.id} value={tpl.id}>{isRtl ? tpl.arName : tpl.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => {
            const template = templates.find(temp => temp.id === assignment.templateId);
            const respondent = users.find(u => u.id === assignment.respondentId);
            const target = users.find(u => u.id === assignment.targetId);
            
            if (!template || !target || !respondent) return null;

            const isCompleted = assignment.status === 'COMPLETED';
            const isFutureMonth = assignment.month > currentMonth;
            const canStart = !isFutureMonth || isAdmin;

            return (
              <div 
                key={assignment.id}
                className={`bg-white rounded-3xl border ${isCompleted ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-200 shadow-sm'} p-6 transition-all group overflow-hidden relative ${isRtl ? 'text-right' : ''}`}
              >
                <div className={`flex items-center justify-between mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-3 rounded-2xl ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Timer className="w-5 h-5" />}
                  </div>
                  <div className={`flex gap-2 items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${!isFutureMonth ? 'bg-slate-50 text-slate-400' : 'bg-rose-50 text-rose-400'}`}>
                      {assignment.month}
                    </span>
                    {isCompleted ? (
                      <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-100 px-2.5 py-1 rounded-full">{isRtl ? 'مكتمل' : 'Completed'}</span>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest bg-amber-50 px-2.5 py-1 rounded-full">{isRtl ? 'معلق' : 'Pending'}</span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-4 leading-tight min-h-[3rem] line-clamp-2">
                  {isRtl ? template.arName : template.name}
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                     <img src={respondent.avatar || `https://ui-avatars.com/api/?name=${respondent.name}`} className="w-5 h-5 rounded-full border border-slate-100 object-cover" />
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                       {isRtl ? 'من:' : 'By:'} {respondent.name}
                     </span>
                  </div>
                  <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                     <img src={target.avatar || `https://ui-avatars.com/api/?name=${target.name}`} className="w-5 h-5 rounded-full border border-slate-100 object-cover" />
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                       {isRtl ? 'حول:' : 'About:'} {target.name}
                     </span>
                  </div>
                </div>

                <div className={`pt-4 border-t border-slate-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteAssignment(assignment)}
                        className="p-2 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors"
                        title={t.deleteSurvey}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {isCompleted ? (
                    <button
                      onClick={() => handleViewResponse(assignment)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    >
                      <Eye className="w-3 h-3" />
                      {isRtl ? 'عرض' : 'View'}
                    </button>
                  ) : (
                    (isAdmin || assignment.respondentId === user.id) && (
                      <button
                        disabled={!canStart}
                        onClick={() => onStartSurvey(template, target.id, assignment.month)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${canStart ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-300 cursor-not-allowed'} ${isRtl ? 'flex-row-reverse' : ''}`}
                      >
                        {!canStart && <Lock className="w-3 h-3" />}
                        {t.begin}
                        {canStart && <ArrowRight className={`w-3 h-3 ${isRtl ? 'rotate-180' : ''}`} />}
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-20 rounded-[40px] border border-slate-200 shadow-sm text-center">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <ClipboardCheck className="w-10 h-10" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">{isRtl ? 'لم يتم العثور على استبيانات' : 'No Surveys Found'}</h3>
           <p className="text-slate-500">{isRtl ? 'جرب ضبط عوامل التصفية أو البحث.' : 'Try adjusting your filters or search term.'}</p>
        </div>
      )}

      {selectedResponse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <header className={`p-6 border-b border-slate-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div>
                <h3 className="text-xl font-black text-slate-900">{isRtl ? 'تفاصيل الاستجابة' : 'Response Details'}</h3>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">
                  {isRtl ? 'النتيجة الموزونة:' : 'Weighted Score:'} {selectedResponse.weightedScore}%
                </p>
              </div>
              <button onClick={() => setSelectedResponse(null)} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar">
              {templates.find(t => t.id === selectedResponse.templateId)?.categories.map(cat => (
                <div key={cat.id} className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">{isRtl ? cat.arName : cat.name}</h4>
                   <div className="space-y-3">
                     {cat.questions.map(q => {
                       const score = selectedResponse.answers[q.id];
                       const selectedOption = q.options?.find(opt => opt.value === score);
                       
                       // Numeric rating display fix:
                       // Always show the denominator. Heuristically detect scale (X/5 vs X/10).
                       const denominator = score > 5 ? 10 : 5;
                       const displayText = selectedOption 
                          ? (isRtl ? selectedOption.arText : selectedOption.text)
                          : `${score}/${denominator}`;

                       return (
                         <div key={q.id} className={`flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl ${isRtl ? 'flex-row-reverse' : ''}`}>
                           <span className="text-sm font-bold text-slate-700">{isRtl ? q.arText : q.text}</span>
                           <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-emerald-600 shadow-sm whitespace-nowrap min-w-[70px] text-center">
                             {displayText}
                           </span>
                         </div>
                       );
                     })}
                   </div>
                </div>
              ))}
            </div>
            <footer className="p-6 border-t border-slate-100 bg-slate-50 flex justify-center">
              <button onClick={() => setSelectedResponse(null)} className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-100">
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyList;

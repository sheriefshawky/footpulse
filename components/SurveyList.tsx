
import React from 'react';
import { User, UserRole, SurveyTemplate, SurveyResponse, Language, SurveyAssignment } from '../types';
import { CheckCircle2, ArrowRight, Timer, ClipboardCheck } from 'lucide-react';
import { translations } from '../translations';

interface Props {
  user: User;
  users: User[];
  templates: SurveyTemplate[];
  responses: SurveyResponse[];
  assignments: SurveyAssignment[];
  onStartSurvey: (t: SurveyTemplate, targetId: string) => void;
  lang: Language;
}

const SurveyList: React.FC<Props> = ({ user, users, templates, responses, assignments, onStartSurvey, lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  
  // Get assignments specifically for this user
  const userAssignments = assignments.filter(a => a.respondentId === user.id);

  return (
    <div className={`animate-in fade-in duration-500 pb-20 ${isRtl ? 'text-right font-arabic' : ''}`}>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          {t.surveys}
        </h2>
        <p className="text-slate-500 font-medium">
          {isRtl ? "يرجى إكمال التقييمات المعينة لك لهذا الشهر." : "Please complete the assessments assigned to you for this month."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {userAssignments.map((assignment) => {
          const template = templates.find(temp => temp.id === assignment.templateId);
          const target = users.find(u => u.id === assignment.targetId);
          if (!template || !target) return null;

          const isCompleted = assignment.status === 'COMPLETED';

          return (
            <div 
              key={assignment.id}
              className={`bg-white rounded-3xl border ${isCompleted ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-200 shadow-sm'} p-6 transition-all group overflow-hidden relative ${isRtl ? 'text-right' : ''}`}
            >
              <div className={`flex items-center justify-between mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`p-3 rounded-2xl ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Timer className="w-5 h-5" />}
                </div>
                {isCompleted ? (
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-100 px-2.5 py-1 rounded-full">{isRtl ? 'مكتمل' : 'Completed'}</span>
                ) : (
                  <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest bg-amber-50 px-2.5 py-1 rounded-full">{assignment.month}</span>
                )}
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">{isRtl ? template.arName : template.name}</h3>
              <div className={`flex items-center gap-2 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <img src={target.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                <span className="text-xs font-bold text-slate-500 tracking-tight">
                  {target.id === user.id ? (isRtl ? 'تقييم ذاتي' : 'Self Review') : `${isRtl ? 'الهدف:' : 'Target:'} ${target.name}`}
                </span>
              </div>
              
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">
                {isRtl ? template.arDescription : template.description}
              </p>

              <div className={`pt-4 border-t border-slate-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex ${isRtl ? 'space-x-reverse -space-x-2' : '-space-x-2'}`}>
                  {template.categories.map((c, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-black" title={isRtl ? c.arName : c.name}>
                        {isRtl ? c.arName[0] : c.name[0]}
                    </div>
                  ))}
                </div>
                {!isCompleted && (
                  <button
                    onClick={() => onStartSurvey(template, target.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all bg-slate-900 text-white hover:bg-slate-800 ${isRtl ? 'flex-row-reverse' : ''}`}
                  >
                    {t.begin}
                    <ArrowRight className={`w-3 h-3 ${isRtl ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {userAssignments.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <ClipboardCheck className="w-16 h-16 text-slate-100 mx-auto mb-4" />
            <p className="text-slate-400 font-medium italic">{isRtl ? "لم يتم تعيين أي استبيانات نشطة لملفك الشخصي بعد." : "No active surveys assigned to your profile yet."}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyList;

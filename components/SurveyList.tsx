
import React from 'react';
import { User, UserRole, SurveyTemplate, SurveyResponse, Language } from '../types';
import { CheckCircle2, ArrowRight, Timer, Users as UsersIcon, ChevronDown, ClipboardCheck, User as UserIcon } from 'lucide-react';
import { translations } from '../translations';

interface Props {
  user: User;
  users: User[];
  templates: SurveyTemplate[];
  responses: SurveyResponse[];
  onStartSurvey: (t: SurveyTemplate, targetId: string) => void;
  lang: Language;
}

const SurveyList: React.FC<Props> = ({ user, users, templates, responses, onStartSurvey, lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const currentMonth = new Date().toISOString().slice(0, 7);
  const isTrainer = user.role === UserRole.TRAINER;
  const isPlayer = user.role === UserRole.PLAYER;

  // Filter templates based on who is logged in
  const applicableTemplates = React.useMemo(() => {
    if (user.role === UserRole.TRAINER) {
      return templates.filter(t => t.id === 't-trainer-eval');
    }
    if (user.role === UserRole.PLAYER) {
      return templates.filter(t => t.id === 't-player-self' || t.id === 't-coach-eval');
    }
    if (user.role === UserRole.GUARDIAN) {
      return templates.filter(t => t.id === 't-guardian-feedback');
    }
    return templates;
  }, [user.role, templates]);

  // For non-trainer personas, we determine surveys based on assigned targets and templates
  const surveyItems = React.useMemo(() => {
    if (isTrainer) return []; // Trainer view handled separately below

    const items: { template: SurveyTemplate, target: User }[] = [];

    if (isPlayer) {
      applicableTemplates.forEach(t => {
        if (t.id === 't-player-self') {
          items.push({ template: t, target: user });
        } else if (t.id === 't-coach-eval' && user.trainerId) {
          const trainer = users.find(u => u.id === user.trainerId);
          if (trainer) items.push({ template: t, target: trainer });
        }
      });
    } else if (user.role === UserRole.GUARDIAN && user.playerId) {
      const child = users.find(u => u.id === user.playerId);
      if (child) {
        applicableTemplates.forEach(t => {
          items.push({ template: t, target: child });
        });
      }
    }

    return items;
  }, [user, users, applicableTemplates, isPlayer, isTrainer]);

  // Determine who the trainer can survey
  const trainerTargets = React.useMemo(() => {
    if (user.role === UserRole.TRAINER) return users.filter(u => u.trainerId === user.id);
    return [];
  }, [user, users]);

  return (
    <div className={`animate-in fade-in duration-500 pb-20 ${isRtl ? 'text-right font-arabic' : ''}`}>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          {isTrainer ? t.squadEvaluationCenter : t.surveys}
        </h2>
        <p className="text-slate-500 font-medium">
          {isTrainer 
            ? (isRtl ? "قدم تقريراً شاملاً عن الأداء لكل لاعب مخصص لفريقك." : "Submit a comprehensive performance report for each player assigned to your squad.")
            : (isRtl ? "يرجى إكمال التقييم الشهري المخصص لك لتتبع التقدم." : "Please complete your assigned monthly assessment to track progress.")}
        </p>
      </div>

      {isTrainer ? (
        <div className="space-y-6">
          {trainerTargets.map(target => {
            const template = applicableTemplates[0]; // One survey per player for trainers
            if (!template) return null;

            const hasResponded = responses.some(r => 
              r.templateId === template.id && 
              r.userId === user.id && 
              r.targetPlayerId === target.id &&
              r.month === currentMonth
            );

            return (
              <div key={target.id} className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <img src={target.avatar} className="w-14 h-14 rounded-2xl border border-slate-100 shadow-sm object-cover" alt="" />
                    <div className={isRtl ? 'text-right' : ''}>
                      <h3 className="text-lg font-bold text-slate-900">{target.name}</h3>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Player ID: {target.id.split('-')[1]}</p>
                    </div>
                  </div>
                  
                  <div className={`flex flex-wrap items-center gap-3 md:gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <ClipboardCheck className={`w-4 h-4 ${hasResponded ? 'text-emerald-500' : 'text-slate-300'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${hasResponded ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {hasResponded ? t.evaluationSubmitted : t.pendingEvaluation}
                      </span>
                    </div>

                    <button
                      disabled={hasResponded}
                      onClick={() => onStartSurvey(template, target.id)}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                        hasResponded 
                        ? 'text-emerald-600 bg-emerald-50 cursor-default' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
                      }`}
                    >
                      {hasResponded ? (isRtl ? 'عرض التفاصيل' : 'View Details') : t.startReview}
                    </button>
                  </div>
                </div>

                <div className={`bg-slate-50/50 px-6 py-3 flex items-center gap-4 overflow-x-auto no-scrollbar border-t border-slate-100 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex-shrink-0">{isRtl ? 'يغطي:' : 'Covering:'}</span>
                  {template.categories.map((c, i) => (
                    <div key={i} className={`flex items-center gap-1.5 whitespace-nowrap ${isRtl ? 'flex-row-reverse' : ''}`}>
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                       <span className="text-[10px] font-bold text-slate-600">{isRtl ? c.arName : c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {surveyItems.map(({ template, target }, idx) => {
            const hasResponded = responses.some(r => 
              r.templateId === template.id && 
              r.userId === user.id && 
              r.targetPlayerId === target.id &&
              r.month === currentMonth
            );

            return (
              <div 
                key={`${target.id}-${template.id}-${idx}`}
                className={`bg-white rounded-3xl border ${hasResponded ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-200 shadow-sm'} p-6 transition-all group overflow-hidden relative ${isRtl ? 'text-right' : ''}`}
              >
                <div className={`flex items-center justify-between mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-3 rounded-2xl ${hasResponded ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {hasResponded ? <CheckCircle2 className="w-5 h-5" /> : <Timer className="w-5 h-5" />}
                  </div>
                  {hasResponded ? (
                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-100 px-2.5 py-1 rounded-full">{isRtl ? 'مكتمل' : 'Completed'}</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest bg-amber-50 px-2.5 py-1 rounded-full">{isRtl ? 'مطلوب' : 'Required'}</span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{isRtl ? template.arName : template.name}</h3>
                <div className={`flex items-center gap-2 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <img src={target.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                  <span className="text-xs font-bold text-slate-500 tracking-tight">
                    {template.id === 't-player-self' ? (isRtl ? 'تقييم ذاتي' : 'Self Review') : `${isRtl ? 'الهدف:' : 'Target:'} ${target.name}`}
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
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
                  <button
                    disabled={hasResponded}
                    onClick={() => onStartSurvey(template, target.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      hasResponded 
                      ? 'text-emerald-600 bg-transparent' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                    } ${isRtl ? 'flex-row-reverse' : ''}`}
                  >
                    {hasResponded ? (isRtl ? 'الملخص' : 'Summary') : t.begin}
                    {!hasResponded && <ArrowRight className={`w-3 h-3 ${isRtl ? 'rotate-180' : ''}`} />}
                  </button>
                </div>
              </div>
            );
          })}
          {surveyItems.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-slate-400 font-medium italic">{isRtl ? "لم يتم تعيين أي استبيانات نشطة لملفك الشخصي بعد." : "No active surveys assigned to your profile yet."}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SurveyList;

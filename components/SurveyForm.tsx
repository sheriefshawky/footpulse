
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, SurveyTemplate, SurveyResponse, Category, Language } from '../types';
import { CheckCircle, AlertCircle, ArrowLeft, Send, Check, User as UserIcon, ChevronLeft, History, Star, MessageSquare } from 'lucide-react';
import { translations } from '../translations';
import { api } from '../api';

interface Props {
  template: SurveyTemplate;
  targetId: string;
  month: string;
  year: number;
  week: number;
  currentUser: User;
  users: User[];
  responses: SurveyResponse[];
  onSubmit: (response: SurveyResponse) => void;
  onCancel: () => void;
  lang: Language;
}

const SurveyForm: React.FC<Props> = ({ template, targetId, month, year, week, currentUser, users, responses, onSubmit, onCancel, lang }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [recentEvaluations, setRecentEvaluations] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecentEvaluations = async () => {
      if (currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.ADMIN) {
        try {
          const data = await api.get(`/players/${targetId}/training-evaluations`);
          setRecentEvaluations(data);
        } catch (err) {
          console.error("Failed to fetch recent evaluations", err);
        }
      }
    };
    fetchRecentEvaluations();
  }, [targetId, currentUser.role]);

  const t = translations[lang];
  const isRtl = lang === 'ar';
  const categories = template.categories;
  const currentCategory = categories[currentCategoryIndex];

  const targetUser = useMemo(() => 
    users.find(u => u.id === targetId),
    [users, targetId]
  );

  const previousResponse = useMemo(() => {
    return responses
      .filter(r => r.templateId === template.id && r.targetPlayerId === targetId && r.userId === currentUser.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [responses, template.id, targetId, currentUser.id]);

  const handleScoreChange = (qId: string, score: number) => {
    setAnswers(prev => ({ ...prev, [qId]: score }));
  };

  const calculateWeightedScore = () => {
    let totalWeightedScore = 0;
    template.categories.forEach(category => {
      let categoryRawScore = 0;
      let totalQuestionWeights = 0;
      category.questions.forEach(q => {
        const score = answers[q.id] || 0;
        const denominator = 10;
        categoryRawScore += (score / denominator) * q.weight;
        totalQuestionWeights += q.weight;
      });
      totalWeightedScore += (categoryRawScore * category.weight) / 100;
    });
    return Math.round(totalWeightedScore);
  };

  const isCurrentCategoryComplete = currentCategory.questions.every(q => answers[q.id] !== undefined);

  const handleNext = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      const response: SurveyResponse = {
        id: `sr-${Math.random().toString(36).substr(2, 9)}`,
        templateId: template.id,
        userId: currentUser.id,
        targetPlayerId: targetId,
        month: month,
        year: year,
        week: week,
        date: new Date().toISOString(),
        answers,
        weightedScore: calculateWeightedScore()
      };
      onSubmit(response);
    }
  };

  const handleBack = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto py-4 animate-in fade-in zoom-in-95 duration-500 pb-24 ${isRtl ? 'text-right font-arabic' : ''}`}>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="relative h-2 bg-slate-100">
          <div 
            className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-0 h-full bg-emerald-500 transition-all duration-500`} 
            style={{ width: `${((currentCategoryIndex + 1) / categories.length) * 100}%` }}
          />
        </div>

        <div className="p-6 md:p-10">
          <div className={`flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
            <button onClick={onCancel} className={`flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors font-bold text-sm self-start ${isRtl ? 'flex-row-reverse' : ''}`}>
              <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              {t.exitSurvey}
            </button>
            
            {targetUser && (
              <div className={`flex items-center gap-4 bg-slate-900 px-6 py-3 rounded-2xl shadow-xl shadow-slate-950/20 border border-slate-800 transition-all ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="relative">
                   <img 
                    src={targetUser.avatar || `https://ui-avatars.com/api/?name=${targetUser.name}`} 
                    alt="" 
                    className="w-12 h-12 rounded-xl border-2 border-slate-700 shadow-sm object-cover" 
                   />
                   <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-slate-900">
                      <UserIcon className="w-3 h-3 text-white" />
                   </div>
                </div>
                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <p className="text-[9px] font-black uppercase text-emerald-400 tracking-[0.2em]">{t.assessmentAbout}</p>
                  <p className="text-lg font-black text-white leading-tight mt-0.5">{targetUser.name}</p>
                </div>
              </div>
            )}

            <div className={isRtl ? 'text-left' : 'text-right'}>
              <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">{t.step} {currentCategoryIndex + 1} {t.of} {categories.length}</p>
              <h4 className="text-xs font-bold text-slate-400">{isRtl ? template.arName : template.name}</h4>
              <p className="text-[10px] font-bold text-slate-500">{isRtl ? 'الفترة:' : 'Period:'} {year}-{month} {isRtl ? `الأسبوع ${week}` : `W${week}`}</p>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">{isRtl ? currentCategory.arName : currentCategory.name}</h2>
            <p className="text-slate-500 font-medium">
              {isRtl ? "يرجى الإجابة بدقة على جميع الأسئلة في هذا القسم." : "Please answer all questions in this section accurately."}
            </p>
          </div>

          {(currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.ADMIN) && recentEvaluations.length > 0 && (
            <div className="mb-12 bg-slate-50 rounded-3xl p-6 border border-slate-100">
              <div className={`flex items-center gap-2 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Star className="w-5 h-5 text-amber-500 fill-current" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{(t as any).recentTrainingEvaluations}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {recentEvaluations.map((evalItem) => (
                  <div key={evalItem.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        {new Date(evalItem.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-current" />
                        <span className="text-xs font-black text-slate-900">{evalItem.rating}/10</span>
                      </div>
                    </div>
                    {evalItem.comments && (
                      <div className="flex gap-1.5">
                        <MessageSquare className="w-3 h-3 text-slate-300 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-tight">{evalItem.comments}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-16">
            {currentCategory.questions.map((q) => (
              <div key={q.id} className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                  <div className={`flex items-start justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                   <h5 className="text-lg font-bold text-slate-800 leading-snug max-w-xl">{isRtl ? q.arText : q.text}</h5>
                   
                   {previousResponse?.answers[q.id] !== undefined && (
                     <div className={`flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-500 border border-slate-200/50 whitespace-nowrap ${isRtl ? 'flex-row-reverse' : ''}`}>
                       <History className="w-3 h-3 text-slate-400" />
                       <span className="uppercase tracking-wider">{t.previousValue}:</span>
                       <span className="text-emerald-600 text-xs">
                         {q.type === 'MULTIPLE_CHOICE' 
                           ? (isRtl 
                               ? q.options?.find(o => o.value === previousResponse.answers[q.id])?.arText 
                               : q.options?.find(o => o.value === previousResponse.answers[q.id])?.text)
                           : previousResponse.answers[q.id]}
                       </span>
                     </div>
                   )}
                </div>
                
                {q.type === 'RATING' ? (
                  <div className="space-y-4">
                    <div className={`flex justify-between text-[10px] font-black text-slate-400 px-1 uppercase tracking-widest ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <span>1: {isRtl ? "مبتدئ" : "Amateur"}</span>
                      <span>10: {isRtl ? "محترف" : "Pro"}</span>
                    </div>
                    <div className={`grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                        const isPrevious = previousResponse?.answers[q.id] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleScoreChange(q.id, val)}
                            className={`
                              relative h-14 md:h-16 rounded-xl border-2 flex items-center justify-center text-lg md:text-xl font-black transition-all transform active:scale-95
                              ${answers[q.id] === val
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                : isPrevious
                                  ? 'bg-slate-50 border-emerald-200 text-slate-600 hover:border-emerald-300'
                                  : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-white'
                              }
                            `}
                          >
                            {val}
                            {isPrevious && (
                              <div className="absolute -top-2 -right-2 bg-slate-800 text-white text-[8px] px-1.5 py-0.5 rounded-full border border-white shadow-sm font-black uppercase tracking-tighter">
                                {isRtl ? 'السابق' : 'Prev'}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-3`}>
                    {q.options?.map((opt) => {
                      const isPrevious = previousResponse?.answers[q.id] === opt.value;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleScoreChange(q.id, opt.value)}
                          className={`relative p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${
                            answers[q.id] === opt.value
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-lg shadow-emerald-500/5'
                            : isPrevious
                              ? 'border-emerald-200 bg-slate-50 text-slate-700 hover:border-emerald-300'
                              : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 text-slate-600 hover:bg-slate-50'
                          } ${isRtl ? 'flex-row-reverse text-right' : ''}`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{isRtl ? opt.arText : opt.text}</span>
                            {isPrevious && (
                              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">
                                {isRtl ? 'القيمة السابقة' : 'Previous Value'}
                              </span>
                            )}
                          </div>
                          {answers[q.id] === opt.value && (
                            <div className="bg-emerald-500 text-white p-1 rounded-full">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={`mt-16 pt-8 border-t border-slate-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
             <div className={`flex items-center gap-3 text-slate-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
               {isCurrentCategoryComplete ? (
                 <CheckCircle className="w-5 h-5 text-emerald-500" />
               ) : (
                 <AlertCircle className="w-5 h-5" />
               )}
               <span className="text-xs font-bold uppercase tracking-wider">
                 {isCurrentCategoryComplete ? (isRtl ? "جاهز للمتابعة" : "Section Ready") : (isRtl ? "مطلوب الإكمال" : "Completion required")}
               </span>
             </div>

             <div className="flex gap-3">
               {currentCategoryIndex > 0 && (
                 <button
                   type="button"
                   onClick={handleBack}
                   className={`flex items-center gap-3 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all transform active:scale-95 ${isRtl ? 'flex-row-reverse' : ''}`}
                 >
                   <ChevronLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                   {isRtl ? 'السابق' : 'Previous'}
                 </button>
               )}
               <button
                 type="button"
                 onClick={handleNext}
                 disabled={!isCurrentCategoryComplete}
                 className={`flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 transition-all transform active:scale-95 ${isRtl ? 'flex-row-reverse' : ''}`}
               >
                 {currentCategoryIndex === categories.length - 1 ? (
                   <>{t.submitAssessment} <Send className="w-4 h-4" /></>
                 ) : (
                   <>{t.continue} <ArrowLeft className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} /></>
                 )}
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyForm;


import React, { useState, useMemo } from 'react';
import { User, SurveyTemplate, SurveyResponse, Category, Language } from '../types';
import { CheckCircle, AlertCircle, ArrowLeft, Send, Check, User as UserIcon, ChevronLeft } from 'lucide-react';
import { translations } from '../translations';

interface Props {
  template: SurveyTemplate;
  targetId: string;
  month: string;
  currentUser: User;
  users: User[];
  onSubmit: (response: SurveyResponse) => void;
  onCancel: () => void;
  lang: Language;
}

const SurveyForm: React.FC<Props> = ({ template, targetId, month, currentUser, users, onSubmit, onCancel, lang }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);

  const t = translations[lang];
  const isRtl = lang === 'ar';
  const categories = template.categories;
  const currentCategory = categories[currentCategoryIndex];

  const targetUser = useMemo(() => 
    users.find(u => u.id === targetId),
    [users, targetId]
  );

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
        const denominator = score > 5 ? 10 : 5;
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
              <p className="text-[10px] font-bold text-slate-500">{isRtl ? 'الشهر:' : 'Month:'} {month}</p>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">{isRtl ? currentCategory.arName : currentCategory.name}</h2>
            <p className="text-slate-500 font-medium">
              {isRtl ? "يرجى الإجابة بدقة على جميع الأسئلة في هذا القسم." : "Please answer all questions in this section accurately."}
            </p>
          </div>

          <div className="space-y-16">
            {currentCategory.questions.map((q) => (
              <div key={q.id} className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className={`flex items-start justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                   <h5 className="text-lg font-bold text-slate-800 leading-snug max-w-xl">{isRtl ? q.arText : q.text}</h5>
                </div>
                
                {q.type === 'RATING' ? (
                  <div className="space-y-4">
                    <div className={`flex justify-between text-[10px] font-black text-slate-400 px-1 uppercase tracking-widest ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <span>1: {isRtl ? "مبتدئ" : "Amateur"}</span>
                      <span>5: {isRtl ? "محترف" : "Pro"}</span>
                    </div>
                    <div className={`grid grid-cols-5 gap-2 md:gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleScoreChange(q.id, val)}
                          className={`
                            h-16 md:h-20 rounded-2xl border-2 flex items-center justify-center text-xl md:text-2xl font-black transition-all transform active:scale-95
                            ${answers[q.id] === val
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                              : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-white'
                            }
                          `}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-3`}>
                    {q.options?.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleScoreChange(q.id, opt.value)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${
                          answers[q.id] === opt.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-lg shadow-emerald-500/5'
                          : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 text-slate-600 hover:bg-slate-50'
                        } ${isRtl ? 'flex-row-reverse text-right' : ''}`}
                      >
                        <span className="text-sm font-bold">{isRtl ? opt.arText : opt.text}</span>
                        {answers[q.id] === opt.value && (
                          <div className="bg-emerald-500 text-white p-1 rounded-full">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    ))}
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

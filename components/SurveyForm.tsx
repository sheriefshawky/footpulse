
import React, { useState } from 'react';
import { User, SurveyTemplate, SurveyResponse, Category, Language } from '../types';
import { CheckCircle, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { translations } from '../translations';

interface Props {
  template: SurveyTemplate;
  targetId: string;
  currentUser: User;
  onSubmit: (response: SurveyResponse) => void;
  onCancel: () => void;
  lang: Language;
}

const SurveyForm: React.FC<Props> = ({ template, targetId, currentUser, onSubmit, onCancel, lang }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);

  const t = translations[lang];
  const isRtl = lang === 'ar';
  const categories = template.categories;
  const currentCategory = categories[currentCategoryIndex];

  const handleScoreChange = (qId: string, score: number) => {
    setAnswers(prev => ({ ...prev, [qId]: score }));
  };

  const calculateWeightedScore = () => {
    let totalScore = 0;
    template.categories.forEach(category => {
      let categoryRawScore = 0;
      let totalQuestionWeights = 0;
      category.questions.forEach(q => {
        const score = answers[q.id] || 5;
        categoryRawScore += (score / 10) * q.weight;
        totalQuestionWeights += q.weight;
      });
      const categoryPercentage = (categoryRawScore / totalQuestionWeights) * 100;
      totalScore += (categoryPercentage * category.weight) / 100;
    });
    return Math.round(totalScore);
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
        month: new Date().toISOString().slice(0, 7),
        date: new Date().toISOString(),
        answers,
        weightedScore: calculateWeightedScore()
      };
      onSubmit(response);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto py-4 animate-in fade-in zoom-in-95 duration-500 ${isRtl ? 'text-right font-arabic' : ''}`}>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="relative h-2 bg-slate-100">
          <div 
            className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-0 h-full bg-emerald-500 transition-all duration-500`} 
            style={{ width: `${((currentCategoryIndex + 1) / categories.length) * 100}%` }}
          />
        </div>

        <div className="p-6 md:p-10">
          <div className={`flex items-center justify-between mb-10 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button onClick={onCancel} className={`flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors font-bold text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
              <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              {t.exitSurvey}
            </button>
            <div className={isRtl ? 'text-left' : 'text-right'}>
              <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">{t.step} {currentCategoryIndex + 1} {t.of} {categories.length}</p>
              <h4 className="text-sm font-bold text-slate-900">{isRtl ? template.arName : template.name}</h4>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">{isRtl ? currentCategory.arName : currentCategory.name}</h2>
            <p className="text-slate-500 font-medium">
              {isRtl ? "يرجى تقديم تقييم صادق من 1 (يحتاج لتحسين) إلى 10 (مستوى نخبوي)." : "Please provide an honest rating from 1 (Needs Improvement) to 10 (Elite Level)."}
            </p>
          </div>

          <div className="space-y-12">
            {currentCategory.questions.map((q) => (
              <div key={q.id} className="space-y-6">
                <div className={`flex items-start justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                   <h5 className="text-lg font-bold text-slate-800 leading-snug max-w-xl">{isRtl ? q.arText : q.text}</h5>
                   <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black whitespace-nowrap">WT: {q.weight}%</span>
                </div>
                
                <div className="space-y-4">
                  <div className={`flex justify-between text-xs font-bold text-slate-400 px-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span>1: {isRtl ? "مبتدئ" : "AMATEUR"}</span>
                    <span>10: {isRtl ? "محترف" : "PRO"}</span>
                  </div>
                  <div className={`flex items-center gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      step="1"
                      value={answers[q.id] || 5}
                      onChange={(e) => handleScoreChange(q.id, parseInt(e.target.value))}
                      className="flex-1 h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className={`w-14 h-14 flex items-center justify-center rounded-2xl text-2xl font-black border-2 transition-all ${
                      answers[q.id] 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-600' 
                      : 'bg-white border-slate-200 text-slate-300'
                    }`}>
                      {answers[q.id] || '?'}
                    </div>
                  </div>
                </div>
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
                 {isCurrentCategoryComplete ? (isRtl ? "جاهز للإرسال" : "Section Ready") : (isRtl ? "مطلوب الإكمال" : "Completion required")}
               </span>
             </div>

             <button
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
  );
};

export default SurveyForm;

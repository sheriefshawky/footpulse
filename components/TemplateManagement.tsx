import React, { useState } from 'react';
import { SurveyTemplate, Category, Question, QuestionOption, QuestionType, Language, User, UserRole } from '../types';
import { Plus, Edit3, Trash2, X, ChevronDown, ChevronUp, Save, Layout, Send, HelpCircle, Check, Search, Filter, Users, Star, Zap, Shield, UserCheck, ArrowRight, ZapOff, AlertCircle, Info } from 'lucide-react';
import { translations } from '../translations';
import { api } from '../api';

interface BulkPreview {
  respondent: User;
  target: User;
  alreadyExists: boolean;
}

interface Props {
  templates: SurveyTemplate[];
  users: User[];
  onUpdate: () => void;
  lang: Language;
}

const TemplateManagement: React.FC<Props> = ({ templates, users, onUpdate, lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [showEditor, setShowEditor] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  const [editingTemplate, setEditingTemplate] = useState<SurveyTemplate | null>(null);
  const [assigningTemplate, setAssigningTemplate] = useState<SurveyTemplate | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Assignment State
  const [assignMonth, setAssignMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedRespondents, setSelectedRespondents] = useState<Set<string>>(new Set());
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [assignmentMode, setAssignmentMode] = useState<'BULK' | 'MANUAL'>('BULK');
  const [selectedBulkType, setSelectedBulkType] = useState<string | null>(null);
  
  // Preview State
  const [previewData, setPreviewData] = useState<BulkPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewSearch, setPreviewSearch] = useState('');

  const emptyTemplate = (): SurveyTemplate => ({
    id: '',
    name: '',
    arName: '',
    description: '',
    arDescription: '',
    categories: []
  });

  const handleEdit = (template: SurveyTemplate) => {
    setEditingTemplate(JSON.parse(JSON.stringify(template)));
    setShowEditor(true);
  };

  const handleCreate = () => {
    setEditingTemplate(emptyTemplate());
    setShowEditor(true);
  };

  const handleOpenAssign = (template: SurveyTemplate) => {
    setAssigningTemplate(template);
    setSelectedRespondents(new Set());
    setSelectedTargets(new Set());
    setSelectedBulkType(null);
    setAssignmentMode('BULK');
    setShowAssignModal(true);
  };

  const fetchPreview = async () => {
    if (!assigningTemplate) return;
    if (assignmentMode === 'BULK' && !selectedBulkType) return;
    if (assignmentMode === 'MANUAL' && (selectedRespondents.size === 0 || selectedTargets.size === 0)) {
       return alert(isRtl ? "يرجى اختيار مستجيب واحد وهدف واحد على الأقل." : "Select at least one respondent and one target.");
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        template_id: assigningTemplate.id,
        month: assignMonth,
      };
      if (assignmentMode === 'BULK') {
        payload.bulk_type = selectedBulkType;
      } else {
        payload.respondent_ids = Array.from(selectedRespondents);
        payload.target_ids = Array.from(selectedTargets);
      }

      const data = await api.post('/assignments/preview', payload);
      setPreviewData(data);
      setShowPreviewModal(true);
    } catch (err: any) {
      alert(err.message || "Preview failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeBulkAssignment = async () => {
    if (!assigningTemplate) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        template_id: assigningTemplate.id,
        month: assignMonth,
      };
      if (assignmentMode === 'BULK') {
        payload.bulk_type = selectedBulkType;
      } else {
        payload.respondent_ids = Array.from(selectedRespondents);
        payload.target_ids = Array.from(selectedTargets);
      }

      const response = await api.post('/assignments', payload);
      alert(isRtl ? `تم بنجاح! تم إنشاء ${response.count} استبيان جديد.` : `Success! Created ${response.count} new assignments.`);
      setShowPreviewModal(false);
      setShowAssignModal(false);
      onUpdate();
    } catch (err: any) {
      alert(err.message || "Bulk assignment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    try {
      if (editingTemplate.id) {
        await api.put(`/templates/${editingTemplate.id}`, editingTemplate);
      } else {
        await api.post('/templates', editingTemplate);
      }
      setShowEditor(false);
      onUpdate();
    } catch (err: any) {
      alert(err.message || "Failed to save template");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(isRtl ? 'هل أنت متأكد من حذف هذا القالب؟' : 'Are you sure you want to delete this template?')) {
      try {
        await api.delete(`/templates/${id}`);
        onUpdate();
      } catch (err: any) {
        alert(err.message || "Failed to delete template");
      }
    }
  };

  // Template structure handlers (categories/questions/options)
  const addCategory = () => {
    if (!editingTemplate) return;
    const newCat: Category = {
      id: `cat-${Math.random().toString(36).substr(2, 9)}`,
      name: '', arName: '', weight: 0, questions: []
    };
    setEditingTemplate({ ...editingTemplate, categories: [...editingTemplate.categories, newCat] });
    setExpandedCategories(new Set([...expandedCategories, newCat.id]));
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      categories: editingTemplate.categories.map(c => c.id === id ? { ...c, ...updates } : c)
    });
  };

  const removeCategory = (id: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({ ...editingTemplate, categories: editingTemplate.categories.filter(c => c.id !== id) });
  };

  const toggleCategory = (id: string) => {
    const next = new Set(expandedCategories);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCategories(next);
  };

  const addQuestion = (catId: string) => {
    if (!editingTemplate) return;
    const newQ: Question = {
      id: `q-${Math.random().toString(36).substr(2, 9)}`,
      text: '', arText: '', weight: 0, type: 'RATING'
    };
    setEditingTemplate({
      ...editingTemplate,
      categories: editingTemplate.categories.map(c => c.id === catId ? { ...c, questions: [...c.questions, newQ] } : c)
    });
  };

  const updateQuestion = (catId: string, qId: string, updates: Partial<Question>) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      categories: editingTemplate.categories.map(c => 
        c.id === catId ? { ...c, questions: c.questions.map(q => q.id === qId ? { ...q, ...updates } : q) } : c
      )
    });
  };

  const removeQuestion = (catId: string, qId: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      categories: editingTemplate.categories.map(c => 
        c.id === catId ? { ...c, questions: c.questions.filter(q => q.id !== qId) } : c
      )
    });
  };

  // Add missing option handlers
  const addOption = (catId: string, qId: string) => {
    if (!editingTemplate) return;
    const newOpt: QuestionOption = {
      id: `opt-${Math.random().toString(36).substr(2, 9)}`,
      text: '', arText: '', value: 1
    };
    setEditingTemplate({
      ...editingTemplate,
      categories: editingTemplate.categories.map(c => 
        c.id === catId ? {
          ...c,
          questions: c.questions.map(q => 
            q.id === qId ? { ...q, options: [...(q.options || []), newOpt] } : q
          )
        } : c
      )
    });
  };

  const updateOption = (catId: string, qId: string, optId: string, updates: Partial<QuestionOption>) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      categories: editingTemplate.categories.map(c => 
        c.id === catId ? {
          ...c,
          questions: c.questions.map(q => 
            q.id === qId ? {
              ...q,
              options: q.options?.map(opt => opt.id === optId ? { ...opt, ...updates } : opt)
            } : q
          )
        } : c
      )
    });
  };

  const removeOption = (catId: string, qId: string, optId: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      categories: editingTemplate.categories.map(c => 
        c.id === catId ? {
          ...c,
          questions: c.questions.map(q => 
            q.id === qId ? {
              ...q,
              options: q.options?.filter(opt => opt.id !== optId)
            } : q
          )
        } : c
      )
    });
  };

  const calculateTotalCatWeight = () => editingTemplate?.categories.reduce((sum, c) => sum + (Number(c.weight) || 0), 0) || 0;
  const calculateTotalQWeight = (cat: Category) => cat.questions.reduce((sum, q) => sum + (Number(q.weight) || 0), 0) || 0;

  const filteredPreview = previewData.filter(p => 
    p.respondent.name.toLowerCase().includes(previewSearch.toLowerCase()) || 
    p.target.name.toLowerCase().includes(previewSearch.toLowerCase())
  );

  return (
    <div className={`animate-in fade-in duration-500 pb-20 ${isRtl ? 'text-right' : ''}`}>
      {isSubmitting && (
        <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-900">{isRtl ? 'جاري التحميل...' : 'Processing...'}</p>
          </div>
        </div>
      )}

      <div className={`flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{t.manageTemplates}</h2>
          <p className="text-slate-500 font-medium">{isRtl ? 'إعداد هيكل الاستبيانات وفئات التقييم والأسئلة.' : 'Setup survey structure, evaluation categories, and questions.'}</p>
        </div>
        <button onClick={handleCreate} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all text-sm">
          <Plus className="w-5 h-5" />
          {t.addTemplate}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates.map(template => (
          <div key={template.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col group hover:shadow-md transition-all">
            <div className={`flex items-start justify-between mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Layout className="w-6 h-6" />
                </div>
                <div className={isRtl ? 'text-right' : ''}>
                  <h3 className="text-lg font-bold text-slate-900">{isRtl ? template.arName : template.name}</h3>
                  <p className="text-xs font-medium text-slate-400">{template.categories.length} {t.categories}</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${isRtl ? 'flex-row-reverse' : ''}`}>
                <button onClick={() => handleOpenAssign(template)} className="p-2 hover:bg-emerald-50 rounded-xl text-emerald-600 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
                <button onClick={() => handleEdit(template)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(template.id)} className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className={`text-sm text-slate-500 line-clamp-2 mb-6 ${isRtl ? 'text-right' : ''}`}>
              {isRtl ? template.arDescription : template.description}
            </p>
            <div className={`mt-auto flex items-center justify-between border-t border-slate-100 pt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
               <button onClick={() => handleOpenAssign(template)} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline flex items-center gap-2">
                 <Zap className="w-3 h-3" /> {isRtl ? 'توليد استبيانات' : 'Generate Surveys'}
               </button>
            </div>
          </div>
        ))}
      </div>

      {showAssignModal && assigningTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
             <header className={`p-6 md:p-8 border-b border-slate-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div>
                   <h3 className="text-2xl font-black text-slate-900">{isRtl ? 'تعيين الاستبيانات' : 'Assign Surveys'}</h3>
                   <p className="text-sm font-medium text-slate-400">{isRtl ? 'قالب:' : 'Template:'} {isRtl ? assigningTemplate.arName : assigningTemplate.name}</p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors">
                   <X className="w-6 h-6 text-slate-400" />
                </button>
             </header>

             <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar space-y-8">
                <section className={`flex flex-col md:flex-row gap-6 items-start md:items-center ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                   <div className="w-full md:w-auto">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{isRtl ? 'شهر التقييم' : 'Assessment Month'}</label>
                      <input 
                         type="month" 
                         value={assignMonth} 
                         onChange={(e) => setAssignMonth(e.target.value)}
                         className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                   </div>
                   <div className="flex-1 flex gap-2 p-1 bg-slate-100 rounded-2xl w-full md:w-auto">
                      <button onClick={() => setAssignmentMode('BULK')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${assignmentMode === 'BULK' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {t.bulkActions}
                      </button>
                      <button onClick={() => setAssignmentMode('MANUAL')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${assignmentMode === 'MANUAL' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {t.manualSelection}
                      </button>
                   </div>
                </section>

                {assignmentMode === 'BULK' ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { id: 'GUARDIANS_TO_CHILDREN', label: t.assignAllGuardians, desc: 'Guardians evaluate their own children', icon: <Users className="w-6 h-6" />, color: 'emerald' },
                        { id: 'GUARDIANS_TO_COACHES', label: t.assignAllGuardiansToCoaches, desc: "Guardians evaluate their child's coach", icon: <Star className="w-6 h-6" />, color: 'blue' },
                        { id: 'PLAYERS_TO_COACHES', label: t.assignAllPlayersToCoaches, desc: 'Players evaluate their coach', icon: <Zap className="w-6 h-6" />, color: 'purple' },
                        { id: 'COACHES_TO_PLAYERS', label: t.assignAllCoachesToPlayers, desc: 'Coaches evaluate players they train', icon: <Shield className="w-6 h-6" />, color: 'rose' },
                      ].map(type => (
                        <button 
                          key={type.id} 
                          onClick={() => setSelectedBulkType(type.id)}
                          className={`group p-6 border-2 rounded-[32px] transition-all flex items-center gap-5 text-left ${selectedBulkType === type.id ? 'border-emerald-500 bg-emerald-50 shadow-xl' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}
                        >
                          <div className={`p-4 rounded-2xl transition-colors ${selectedBulkType === type.id ? 'bg-emerald-600 text-white' : `bg-slate-50 text-slate-400 group-hover:bg-slate-100`}`}>
                            {type.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900">{type.label}</h4>
                            <p className="text-xs text-slate-400">{type.desc}</p>
                          </div>
                          {selectedBulkType === type.id && <Check className="w-6 h-6 text-emerald-500" />}
                        </button>
                      ))}
                    </div>

                    {selectedBulkType && (
                      <div className="flex justify-center pt-4 animate-in zoom-in-95">
                        <button 
                          onClick={fetchPreview}
                          className="px-12 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-3xl shadow-2xl shadow-emerald-500/20 flex items-center gap-3 transition-all active:scale-95"
                        >
                          <Search className="w-5 h-5" />
                          {isRtl ? 'عرض المعاينة قبل التوليد' : 'Preview Assignments'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isRtl ? 'المستجيبون' : 'Respondents'}</label>
                        <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-2xl p-2 space-y-1 bg-slate-50/50 no-scrollbar">
                          {users.map(u => (
                            <button key={u.id} onClick={() => {
                              const next = new Set(selectedRespondents);
                              if (next.has(u.id)) next.delete(u.id); else next.add(u.id);
                              setSelectedRespondents(next);
                            }} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedRespondents.has(u.id) ? 'bg-emerald-500 text-white shadow-lg' : 'hover:bg-white text-slate-600'}`}>
                              <div className="flex items-center gap-3">
                                <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                                <div className="text-left"><p className="text-xs font-bold">{u.name}</p><p className="text-[10px] uppercase font-medium opacity-70">{u.role}</p></div>
                              </div>
                              {selectedRespondents.has(u.id) && <Check className="w-4 h-4" />}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isRtl ? 'الأهداف' : 'Targets'}</label>
                        <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-2xl p-2 space-y-1 bg-slate-50/50 no-scrollbar">
                          {users.map(u => (
                            <button key={u.id} onClick={() => {
                              const next = new Set(selectedTargets);
                              if (next.has(u.id)) next.delete(u.id); else next.add(u.id);
                              setSelectedTargets(next);
                            }} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedTargets.has(u.id) ? 'bg-blue-500 text-white shadow-lg' : 'hover:bg-white text-slate-600'}`}>
                              <div className="flex items-center gap-3">
                                <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                                <div className="text-left"><p className="text-xs font-bold">{u.name}</p><p className="text-[10px] uppercase font-medium opacity-70">{u.role}</p></div>
                              </div>
                              {selectedTargets.has(u.id) && <Check className="w-4 h-4" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                       <button onClick={fetchPreview} className="px-10 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl transition-all flex items-center gap-2">
                         <Search className="w-4 h-4" /> 
                         {isRtl ? 'معاينة التعيينات المحددة' : 'Preview Selected Assignments'}
                       </button>
                    </div>
                  </div>
                )}
             </div>

             <footer className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-center">
                <button onClick={() => setShowAssignModal(false)} className="px-12 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50">{t.cancel}</button>
             </footer>
          </div>
        </div>
      )}

      {showPreviewModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[48px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
             <header className={`p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={isRtl ? 'text-right' : ''}>
                   <h3 className="text-3xl font-black text-slate-900">{isRtl ? 'تأكيد التعيينات' : 'Confirm Generation'}</h3>
                   <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                     {isRtl ? 'إجمالي المقترح:' : 'Total Proposed:'} <span className="text-emerald-600">{previewData.length}</span> | 
                     {isRtl ? ' سيتم إنشاء:' : ' Will Create:'} <span className="text-emerald-600">{previewData.filter(p => !p.alreadyExists).length}</span>
                   </p>
                </div>
                <button onClick={() => setShowPreviewModal(false)} className="p-3 hover:bg-slate-200 rounded-2xl transition-colors">
                   <X className="w-8 h-8 text-slate-400" />
                </button>
             </header>

             <div className="p-6 border-b border-slate-100 bg-white">
                <div className="relative">
                  <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400`} />
                  <input 
                    type="text" 
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    placeholder={isRtl ? 'بحث في القائمة...' : 'Search preview list...'}
                    className={`w-full ${isRtl ? 'pr-12' : 'pl-12'} px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold`}
                  />
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-0 no-scrollbar">
                <table className={`w-full ${isRtl ? 'text-right' : 'text-left'}`}>
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'المستجيب' : 'Respondent'}</th>
                      <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">→</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'الهدف / اللاعب' : 'Target / Player'}</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredPreview.map((item, idx) => (
                      <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${item.alreadyExists ? 'opacity-50' : ''}`}>
                        <td className="px-8 py-4">
                           <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                              <img src={item.respondent.avatar} className="w-10 h-10 rounded-full border border-slate-200 shadow-sm" alt="" />
                              <div>
                                <p className="text-sm font-black text-slate-900">{item.respondent.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{item.respondent.role}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                           <ArrowRight className={`w-4 h-4 text-slate-300 mx-auto ${isRtl ? 'rotate-180' : ''}`} />
                        </td>
                        <td className="px-8 py-4">
                           <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                              <img src={item.target.avatar} className="w-10 h-10 rounded-full border border-slate-200 shadow-sm" alt="" />
                              <div>
                                <p className="text-sm font-black text-slate-900">{item.target.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{item.target.role}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-4">
                           {item.alreadyExists ? (
                             <div className={`flex items-center gap-2 text-rose-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{isRtl ? 'موجود مسبقاً' : 'Exists'}</span>
                             </div>
                           ) : (
                             <div className={`flex items-center gap-2 text-emerald-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <Check className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{isRtl ? 'جديد' : 'New'}</span>
                             </div>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPreview.length === 0 && (
                   <div className="py-20 text-center">
                      <ZapOff className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="font-bold text-slate-400">{isRtl ? 'لا توجد نتائج مطابقة لبحثك.' : 'No matches found for your search.'}</p>
                   </div>
                )}
             </div>

             <footer className={`p-8 border-t border-slate-100 bg-slate-50/80 flex flex-col md:flex-row gap-4 md:items-center justify-between ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 text-slate-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
                   <Info className="w-5 h-5" />
                   <p className="text-xs font-medium max-w-sm">
                     {isRtl ? 'سيتم تجاهل السجلات التي تحمل علامة "موجود مسبقاً" تلقائياً.' : 'Records marked as "Exists" will be automatically skipped during generation.'}
                   </p>
                </div>
                <div className={`flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                   <button onClick={() => setShowPreviewModal(false)} className="flex-1 md:flex-none px-12 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-600 transition-all hover:bg-slate-100">{t.cancel}</button>
                   <button 
                     onClick={executeBulkAssignment}
                     disabled={previewData.filter(p => !p.alreadyExists).length === 0}
                     className={`flex-1 md:flex-none px-16 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black rounded-3xl shadow-2xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3`}
                   >
                     <Zap className="w-5 h-5" />
                     {isRtl ? 'تأكيد وتوليد الاستبيانات' : 'Confirm & Generate'}
                   </button>
                </div>
             </footer>
          </div>
        </div>
      )}

      {showEditor && editingTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <header className={`p-6 md:p-8 border-b border-slate-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={isRtl ? 'text-right' : ''}>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900">{editingTemplate.id ? t.editTemplate : t.addTemplate}</h3>
                <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">{isRtl ? 'حدد المقاييس والأوزان والأسئلة لهذا الاستبيان.' : 'Define metrics, weights, and questions for this survey.'}</p>
              </div>
              <button onClick={() => setShowEditor(false)} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar space-y-8">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.templateName}</label><input type="text" value={editingTemplate.name} onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})} className={`w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium ${isRtl ? 'text-right' : ''}`} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.arabicTemplateName}</label><input type="text" value={editingTemplate.arName} onChange={(e) => setEditingTemplate({...editingTemplate, arName: e.target.value})} className={`w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium ${isRtl ? 'text-right' : ''}`} /></div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.description}</label><textarea value={editingTemplate.description} onChange={(e) => setEditingTemplate({...editingTemplate, description: e.target.value})} rows={1} className={`w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium resize-none ${isRtl ? 'text-right' : ''}`} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.arabicDescription}</label><textarea value={editingTemplate.arDescription} onChange={(e) => setEditingTemplate({...editingTemplate, arDescription: e.target.value})} rows={1} className={`w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium resize-none ${isRtl ? 'text-right' : ''}`} /></div>
                </div>
              </section>

              <div className="border-t border-slate-100 pt-8">
                <div className={`flex items-center justify-between mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <h4 className="text-xl font-black text-slate-900">{t.categories}</h4>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${calculateTotalCatWeight() === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {t.totalWeight}: {calculateTotalCatWeight()}%
                    </span>
                  </div>
                  <button onClick={addCategory} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all"><Plus className="w-4 h-4" />{t.addCategory}</button>
                </div>

                <div className="space-y-4">
                  {editingTemplate.categories.map((cat) => (
                    <div key={cat.id} className="bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden">
                      <div className={`p-4 md:p-6 flex items-center justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                         <div className={`flex-1 flex flex-col md:flex-row gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                            <input type="text" value={cat.name} onChange={(e) => updateCategory(cat.id, { name: e.target.value })} placeholder={t.categoryName} className={`flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold ${isRtl ? 'text-right' : ''}`} />
                            <input type="text" value={cat.arName} onChange={(e) => updateCategory(cat.id, { arName: e.target.value })} placeholder={isRtl ? 'اسم الفئة (بالعربي)' : 'Arabic Category Name'} className={`flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold ${isRtl ? 'text-right' : ''}`} />
                            <div className="relative w-32"><input type="number" value={cat.weight} onChange={(e) => updateCategory(cat.id, { weight: Number(e.target.value) })} className={`w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none text-sm font-black ${isRtl ? 'text-right' : ''}`} /><span className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400`}>%</span></div>
                         </div>
                         <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <button onClick={() => toggleCategory(cat.id)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500">{expandedCategories.has(cat.id) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</button>
                            <button onClick={() => removeCategory(cat.id)} className="p-2 hover:bg-rose-100 rounded-xl text-rose-500"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </div>
                      {expandedCategories.has(cat.id) && (
                        <div className="px-6 pb-6 pt-2 space-y-4 border-t border-white/50">
                           <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.questions} in {cat.name || 'this category'}</p><span className={`text-[10px] font-black uppercase tracking-wider ${calculateTotalQWeight(cat) === 100 ? 'text-emerald-500' : 'text-rose-500'}`}>{t.totalWeight}: {calculateTotalQWeight(cat)}%</span></div>
                           <div className="space-y-6">
                              {cat.questions.map((q) => (
                                <div key={q.id} className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4">
                                   <div className={`flex flex-col md:flex-row gap-4 items-start ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                                      <div className="flex-1 space-y-3 w-full">
                                         <input type="text" value={q.text} onChange={(e) => updateQuestion(cat.id, q.id, { text: e.target.value })} placeholder={t.questionText} className={`w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none ${isRtl ? 'text-right' : ''}`} />
                                         <input type="text" value={q.arText} onChange={(e) => updateQuestion(cat.id, q.id, { arText: e.target.value })} placeholder={t.arabicQuestionText} className={`w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none ${isRtl ? 'text-right' : ''}`} />
                                      </div>
                                      <div className={`flex flex-wrap gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                         <div className="relative w-24"><input type="number" value={q.weight} onChange={(e) => updateQuestion(cat.id, q.id, { weight: Number(e.target.value) })} className={`w-full px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-black outline-none ${isRtl ? 'text-right' : ''}`} /><span className={`absolute ${isRtl ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-400`}>%</span></div>
                                         <select value={q.type} onChange={(e) => updateQuestion(cat.id, q.id, { type: e.target.value as QuestionType, options: e.target.value === 'MULTIPLE_CHOICE' ? (q.options || []) : undefined })} className={`px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer ${isRtl ? 'text-right' : ''}`}>
                                            <option value="RATING">{t.ratingType}</option><option value="MULTIPLE_CHOICE">{t.choiceType}</option>
                                         </select>
                                         <button onClick={() => removeQuestion(cat.id, q.id)} className="p-2 hover:bg-rose-100 rounded-xl text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                      </div>
                                   </div>
                                   {q.type === 'MULTIPLE_CHOICE' && (
                                     <div className={`pl-4 border-l-2 border-emerald-100 space-y-4 mt-4 ${isRtl ? 'border-l-0 border-r-2 pr-4' : ''}`}>
                                        <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}><span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Options & Scoring</span><button onClick={() => addOption(cat.id, q.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-colors"><Plus className="w-3 h-3" />{t.addOption}</button></div>
                                        <div className="grid grid-cols-1 gap-3">
                                           {q.options?.map((opt) => (
                                              <div key={opt.id} className={`flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                 <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <input type="text" value={opt.text} onChange={(e) => updateOption(cat.id, q.id, opt.id, { text: e.target.value })} placeholder={t.optionLabel} className={`px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold ${isRtl ? 'text-right' : ''}`} />
                                                    <input type="text" value={opt.arText} onChange={(e) => updateOption(cat.id, q.id, opt.id, { arText: e.target.value })} placeholder={t.optionLabelAr} className={`px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold ${isRtl ? 'text-right' : ''}`} />
                                                    <div className="relative"><input type="number" min="1" max="10" value={opt.value} onChange={(e) => updateOption(cat.id, q.id, opt.id, { value: Number(e.target.value) })} placeholder={t.scoreValue} className={`w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black ${isRtl ? 'text-right' : ''}`} /><span className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-400`}>SCORE</span></div>
                                                 </div>
                                                 <button onClick={() => removeOption(cat.id, q.id, opt.id)} className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                              </div>
                                           ))}
                                        </div>
                                     </div>
                                   )}
                                </div>
                              ))}
                              <button onClick={() => addQuestion(cat.id)} className={`w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-xs font-black text-slate-400 uppercase tracking-widest hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}><Plus className="w-4 h-4" />{t.addQuestion}</button>
                           </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <footer className={`p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
              <div className={`flex-1 flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}><HelpCircle className="w-5 h-5 text-slate-400" /><p className="text-[10px] font-medium text-slate-500 max-w-sm">{isRtl ? 'تأكد من أن إجمالي أوزان الفئات يساوي 100٪ ، وأوزان الأسئلة داخل كل فئة تساوي 100٪ للحصول على نتائج دقيقة.' : 'Ensure total category weights equal 100%, and question weights within each category equal 100% for accurate results.'}</p></div>
              <div className={`flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}><button onClick={() => setShowEditor(false)} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors text-sm">{t.cancel}</button><button onClick={handleSave} className="px-10 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 text-sm">{t.saveChanges}</button></div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManagement;
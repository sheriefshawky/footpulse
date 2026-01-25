
import React, { useState } from 'react';
import { SurveyTemplate, Category, Question, QuestionOption, QuestionType, Language, User, UserRole } from '../types';
import { Plus, Edit3, Trash2, X, ChevronDown, ChevronUp, Save, Layout, Send, HelpCircle, Check, Search, Filter, Users } from 'lucide-react';
import { translations } from '../translations';
import { api } from '../api';

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
  const [editingTemplate, setEditingTemplate] = useState<SurveyTemplate | null>(null);
  const [assigningTemplate, setAssigningTemplate] = useState<SurveyTemplate | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Assignment State
  const [assignMonth, setAssignMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedRespondents, setSelectedRespondents] = useState<Set<string>>(new Set());
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');

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
    setShowAssignModal(true);
  };

  const handleAssignToAllGuardians = async () => {
    if (!assigningTemplate) return;
    const guardians = users.filter(u => u.role === UserRole.GUARDIAN && u.playerId);
    if (guardians.length === 0) {
      alert("No active guardians with linked players found.");
      return;
    }

    if (confirm(`Assign this survey to all ${guardians.length} guardians for their respective children for ${assignMonth}?`)) {
      try {
        // We iterate and create assignments for each guardian specifically for their child
        for (const g of guardians) {
          await api.post('/assignments', {
            template_id: assigningTemplate.id,
            respondent_ids: [g.id],
            target_ids: [g.playerId],
            month: assignMonth
          });
        }
        alert('Bulk assignment for guardians completed!');
        setShowAssignModal(false);
        onUpdate();
      } catch (err) {
        alert('Failed during bulk assignment');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await api.delete(`/templates/${id}`);
        onUpdate();
      } catch (err) {
        alert('Failed to delete template');
      }
    }
  };

  const toggleCategory = (id: string) => {
    const next = new Set(expandedCategories);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCategories(next);
  };

  const addCategory = () => {
    if (!editingTemplate) return;
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: '',
      arName: '',
      weight: 0,
      questions: []
    };
    setEditingTemplate({
      ...editingTemplate,
      categories: [...editingTemplate.categories, newCat]
    });
    toggleCategory(newCat.id);
  };

  const updateCategory = (catId: string, fields: Partial<Category>) => {
    if (!editingTemplate) return;
    const nextCats = editingTemplate.categories.map(cat => cat.id === catId ? { ...cat, ...fields } : cat);
    setEditingTemplate({ ...editingTemplate, categories: nextCats });
  };

  const removeCategory = (catId: string) => {
    if (!editingTemplate) return;
    const nextCats = editingTemplate.categories.filter(cat => cat.id !== catId);
    setEditingTemplate({ ...editingTemplate, categories: nextCats });
  };

  const addQuestion = (catId: string) => {
    if (!editingTemplate) return;
    const nextCats = editingTemplate.categories.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          questions: [
            ...cat.questions,
            { id: `q-${Date.now()}`, text: '', arText: '', weight: 0, type: 'RATING' as QuestionType }
          ]
        };
      }
      return cat;
    });
    setEditingTemplate({ ...editingTemplate, categories: nextCats });
  };

  const updateQuestion = (catId: string, qId: string, fields: Partial<Question>) => {
    if (!editingTemplate) return;
    const nextCats = editingTemplate.categories.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          questions: cat.questions.map(q => q.id === qId ? { ...q, ...fields } : q)
        };
      }
      return cat;
    });
    setEditingTemplate({ ...editingTemplate, categories: nextCats });
  };

  const removeQuestion = (catId: string, qId: string) => {
    if (!editingTemplate) return;
    const nextCats = editingTemplate.categories.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          questions: cat.questions.filter(q => q.id !== qId)
        };
      }
      return cat;
    });
    setEditingTemplate({ ...editingTemplate, categories: nextCats });
  };

  const addOption = (catId: string, qId: string) => {
    if (!editingTemplate) return;
    const nextCats = editingTemplate.categories.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          questions: cat.questions.map(q => {
            if (q.id === qId) {
              const options = q.options || [];
              return {
                ...q,
                options: [...options, { id: `opt-${Date.now()}`, text: '', arText: '', value: 3 }] // Default to mid-range
              };
            }
            return q;
          })
        };
      }
      return cat;
    });
    setEditingTemplate({ ...editingTemplate, categories: nextCats });
  };

  const updateOption = (catId: string, qId: string, optId: string, fields: Partial<QuestionOption>) => {
    if (!editingTemplate) return;
    const nextCats = editingTemplate.categories.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          questions: cat.questions.map(q => {
            if (q.id === qId && q.options) {
              return {
                ...q,
                options: q.options.map(opt => opt.id === optId ? { ...opt, ...fields } : opt)
              };
            }
            return q;
          })
        };
      }
      return cat;
    });
    setEditingTemplate({ ...editingTemplate, categories: nextCats });
  };

  const removeOption = (catId: string, qId: string, optId: string) => {
    if (!editingTemplate) return;
    const nextCats = editingTemplate.categories.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          questions: cat.questions.map(q => {
            if (q.id === qId && q.options) {
              return {
                ...q,
                options: q.options.filter(opt => opt.id !== optId)
              };
            }
            return q;
          })
        };
      }
      return cat;
    });
    setEditingTemplate({ ...editingTemplate, categories: nextCats });
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    try {
      if (editingTemplate.id) {
        await api.put(`/templates/${editingTemplate.id}`, editingTemplate);
      } else {
        await api.post('/templates', editingTemplate);
      }
      onUpdate();
      setShowEditor(false);
    } catch (err) {
      alert('Failed to save template');
    }
  };

  const handleFinalizeAssignment = async () => {
    if (!assigningTemplate || selectedRespondents.size === 0) return;
    try {
      await api.post('/assignments', {
        template_id: assigningTemplate.id,
        respondent_ids: Array.from(selectedRespondents),
        target_ids: selectedTargets.size > 0 ? Array.from(selectedTargets) : undefined,
        month: assignMonth
      });
      alert('Surveys assigned successfully!');
      setShowAssignModal(false);
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Failed to assign surveys');
    }
  };

  const filteredRespondents = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.role.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredTargets = users.filter(u => {
    // If only one respondent is selected and they are a guardian, only show their child
    if (selectedRespondents.size === 1) {
      const respId = Array.from(selectedRespondents)[0];
      const resp = users.find(user => user.id === respId);
      if (resp?.role === UserRole.GUARDIAN && resp.playerId) {
        return u.id === resp.playerId;
      }
    }
    return u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.role.toLowerCase().includes(userSearch.toLowerCase());
  });

  const calculateTotalCatWeight = () => editingTemplate?.categories.reduce((sum, c) => sum + (Number(c.weight) || 0), 0) || 0;
  const calculateTotalQWeight = (cat: Category) => cat.questions.reduce((sum, q) => sum + (Number(q.weight) || 0), 0) || 0;

  return (
    <div className={`animate-in fade-in duration-500 pb-20 ${isRtl ? 'text-right' : ''}`}>
      <div className={`flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{t.manageTemplates}</h2>
          <p className="text-slate-500 font-medium">{isRtl ? 'إعداد هيكل الاستبيانات وفئات التقييم والأسئلة.' : 'Setup survey structure, evaluation categories, and questions.'}</p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all text-sm md:text-base"
        >
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
                <button 
                  onClick={() => handleOpenAssign(template)}
                  className="p-2 hover:bg-emerald-50 rounded-xl text-emerald-600 transition-colors"
                  title="Assign Survey"
                >
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
                 <Send className="w-3 h-3" /> {isRtl ? 'توليد استبيان' : 'Generate Survey'}
               </button>
               <button onClick={() => handleEdit(template)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:underline">
                 {isRtl ? 'تعديل الهيكل' : 'Edit Structure'}
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && assigningTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
             <header className={`p-6 md:p-8 border-b border-slate-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div>
                   <h3 className="text-2xl font-black text-slate-900">{isRtl ? 'توليد وتعيين استبيان' : 'Assign & Generate Surveys'}</h3>
                   <p className="text-sm font-medium text-slate-400">{isRtl ? 'قالب:' : 'Template:'} {isRtl ? assigningTemplate.arName : assigningTemplate.name}</p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors">
                   <X className="w-6 h-6 text-slate-400" />
                </button>
             </header>

             <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar space-y-8">
                <section className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                   <div className="w-full md:w-auto">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{isRtl ? 'شهر التقييم' : 'Assessment Month'}</label>
                      <input 
                         type="month" 
                         value={assignMonth} 
                         onChange={(e) => setAssignMonth(e.target.value)}
                         className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                   </div>
                   <div className="flex-1 w-full">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{isRtl ? 'تصفية حسب الدور' : 'Filter by Role'}</label>
                      <div className="flex flex-wrap gap-2">
                         {['ALL', UserRole.ADMIN, UserRole.TRAINER, UserRole.PLAYER, UserRole.GUARDIAN].map(r => (
                           <button 
                             key={r} 
                             onClick={() => setRoleFilter(r as any)}
                             className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${roleFilter === r ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                           >
                             {r === 'ALL' ? (isRtl ? 'الكل' : 'All') : r}
                           </button>
                         ))}
                      </div>
                   </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'المستجيبون (من يملأه)' : 'Respondents (Who fills it)'}</label>
                         <span className="text-[10px] font-black text-emerald-600 uppercase">{selectedRespondents.size} selected</span>
                      </div>
                      <div className="relative mb-4">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={userSearch} 
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                         />
                      </div>
                      <div className="max-h-72 overflow-y-auto no-scrollbar border border-slate-100 rounded-2xl p-2 space-y-1">
                         {filteredRespondents.map(u => (
                            <button 
                               key={u.id}
                               onClick={() => {
                                  const next = new Set(selectedRespondents);
                                  if (next.has(u.id)) next.delete(u.id);
                                  else next.add(u.id);
                                  setSelectedRespondents(next);
                               }}
                               className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedRespondents.has(u.id) ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'}`}
                            >
                               <div className="flex items-center gap-3">
                                  <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                                  <div className="text-left">
                                     <p className="text-xs font-bold">{u.name}</p>
                                     <p className="text-[10px] uppercase font-medium text-slate-400">{u.role}</p>
                                  </div>
                               </div>
                               {selectedRespondents.has(u.id) && <Check className="w-4 h-4" />}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'الأهداف (من يتم تقييمه)' : 'Targets (Who is evaluated)'}</label>
                         <span className="text-[10px] font-black text-blue-600 uppercase">{selectedTargets.size} selected</span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 italic">Leave empty for self-assessment templates.</p>
                      <div className="max-h-[350px] overflow-y-auto no-scrollbar border border-slate-100 rounded-2xl p-2 space-y-1">
                         {filteredTargets.map(u => (
                            <button 
                               key={u.id}
                               onClick={() => {
                                  const next = new Set(selectedTargets);
                                  if (next.has(u.id)) next.delete(u.id);
                                  else next.add(u.id);
                                  setSelectedTargets(next);
                               }}
                               className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedTargets.has(u.id) ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}
                            >
                               <div className="flex items-center gap-3">
                                  <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                                  <div className="text-left">
                                     <p className="text-xs font-bold">{u.name}</p>
                                     <p className="text-[10px] uppercase font-medium text-slate-400">{u.role}</p>
                                  </div>
                               </div>
                               {selectedTargets.has(u.id) && <Check className="w-4 h-4" />}
                            </button>
                         ))}
                      </div>
                   </div>
                </section>
                
                {roleFilter === UserRole.GUARDIAN && (
                  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-emerald-600" />
                        <div>
                           <h4 className="text-sm font-black text-emerald-800 uppercase tracking-widest">{t.assignAllGuardians}</h4>
                           <p className="text-xs font-medium text-emerald-600">Quickly create assignments for all guardians to evaluate their specific children.</p>
                        </div>
                     </div>
                     <button 
                        onClick={handleAssignToAllGuardians}
                        className="px-6 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all"
                     >
                        {t.assignAllGuardians}
                     </button>
                  </div>
                )}
             </div>

             <footer className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                   <HelpCircle className="w-5 h-5 text-slate-400" />
                   <p className="text-[10px] font-medium text-slate-500 max-w-sm">
                      Each respondent will receive a pending survey for each selected target for the month of {assignMonth}.
                   </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                   <button onClick={() => setShowAssignModal(false)} className="flex-1 md:flex-none px-8 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600">Cancel</button>
                   <button 
                      onClick={handleFinalizeAssignment}
                      disabled={selectedRespondents.size === 0}
                      className="flex-1 md:flex-none px-10 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                   >
                      <Send className="w-4 h-4" /> Generate {selectedRespondents.size * (selectedTargets.size || 1)} Surveys
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
              <button onClick={() => setShowEditor(false)} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar space-y-8">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.templateName}</label>
                    <input 
                      type="text" 
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                      placeholder="e.g. Monthly Performance Review"
                      className={`w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium ${isRtl ? 'text-right' : ''}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.arabicTemplateName}</label>
                    <input 
                      type="text" 
                      value={editingTemplate.arName}
                      onChange={(e) => setEditingTemplate({...editingTemplate, arName: e.target.value})}
                      placeholder="مثال: تقييم الأداء الشهري"
                      className={`w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium ${isRtl ? 'text-right' : ''}`}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.description}</label>
                    <textarea 
                      value={editingTemplate.description}
                      onChange={(e) => setEditingTemplate({...editingTemplate, description: e.target.value})}
                      rows={1}
                      className={`w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium resize-none ${isRtl ? 'text-right' : ''}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.arabicDescription}</label>
                    <textarea 
                      value={editingTemplate.arDescription}
                      onChange={(e) => setEditingTemplate({...editingTemplate, arDescription: e.target.value})}
                      rows={1}
                      className={`w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium resize-none ${isRtl ? 'text-right' : ''}`}
                    />
                  </div>
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
                  <button onClick={addCategory} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all">
                    <Plus className="w-4 h-4" />
                    {t.addCategory}
                  </button>
                </div>

                <div className="space-y-4">
                  {editingTemplate.categories.map((cat) => (
                    <div key={cat.id} className="bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden">
                      <div className={`p-4 md:p-6 flex items-center justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                         <div className={`flex-1 flex flex-col md:flex-row gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                            <input 
                              type="text" 
                              value={cat.name} 
                              onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                              placeholder={t.categoryName}
                              className={`flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold ${isRtl ? 'text-right' : ''}`}
                            />
                            <input 
                              type="text" 
                              value={cat.arName} 
                              onChange={(e) => updateCategory(cat.id, { arName: e.target.value })}
                              placeholder={isRtl ? 'اسم الفئة (بالعربي)' : 'Arabic Category Name'}
                              className={`flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold ${isRtl ? 'text-right' : ''}`}
                            />
                            <div className="relative w-32">
                               <input 
                                 type="number" 
                                 value={cat.weight} 
                                 onChange={(e) => updateCategory(cat.id, { weight: Number(e.target.value) })}
                                 placeholder="Weight"
                                 className={`w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none text-sm font-black ${isRtl ? 'text-right' : ''}`}
                               />
                               <span className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400`}>%</span>
                            </div>
                         </div>
                         <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <button onClick={() => toggleCategory(cat.id)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500">
                               {expandedCategories.has(cat.id) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            <button onClick={() => removeCategory(cat.id)} className="p-2 hover:bg-rose-100 rounded-xl text-rose-500">
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      </div>

                      {expandedCategories.has(cat.id) && (
                        <div className="px-6 pb-6 pt-2 space-y-4 border-t border-white/50">
                           <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.questions} in {cat.name || 'this category'}</p>
                              <span className={`text-[10px] font-black uppercase tracking-wider ${calculateTotalQWeight(cat) === 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {t.totalWeight}: {calculateTotalQWeight(cat)}%
                              </span>
                           </div>
                           <div className="space-y-6">
                              {cat.questions.map((q) => (
                                <div key={q.id} className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4">
                                   <div className={`flex flex-col md:flex-row gap-4 items-start ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                                      <div className="flex-1 space-y-3 w-full">
                                         <input 
                                           type="text" 
                                           value={q.text} 
                                           onChange={(e) => updateQuestion(cat.id, q.id, { text: e.target.value })}
                                           placeholder={t.questionText}
                                           className={`w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none ${isRtl ? 'text-right' : ''}`}
                                         />
                                         <input 
                                           type="text" 
                                           value={q.arText} 
                                           onChange={(e) => updateQuestion(cat.id, q.id, { arText: e.target.value })}
                                           placeholder={t.arabicQuestionText}
                                           className={`w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none ${isRtl ? 'text-right' : ''}`}
                                         />
                                      </div>
                                      <div className={`flex flex-wrap gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                         <div className="relative w-24">
                                            <input 
                                              type="number" 
                                              value={q.weight} 
                                              onChange={(e) => updateQuestion(cat.id, q.id, { weight: Number(e.target.value) })}
                                              className={`w-full px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-black outline-none ${isRtl ? 'text-right' : ''}`}
                                            />
                                            <span className={`absolute ${isRtl ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-400`}>%</span>
                                         </div>
                                         <select 
                                            value={q.type}
                                            onChange={(e) => updateQuestion(cat.id, q.id, { type: e.target.value as QuestionType, options: e.target.value === 'MULTIPLE_CHOICE' ? (q.options || []) : undefined })}
                                            className={`px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer ${isRtl ? 'text-right' : ''}`}
                                         >
                                            <option value="RATING">{t.ratingType}</option>
                                            <option value="MULTIPLE_CHOICE">{t.choiceType}</option>
                                         </select>
                                         <button onClick={() => removeQuestion(cat.id, q.id)} className="p-2 hover:bg-rose-100 rounded-xl text-rose-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                         </button>
                                      </div>
                                   </div>

                                   {q.type === 'MULTIPLE_CHOICE' && (
                                     <div className={`pl-4 border-l-2 border-emerald-100 space-y-4 mt-4 ${isRtl ? 'border-l-0 border-r-2 pr-4' : ''}`}>
                                        <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                                           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Options & Scoring</span>
                                           <button 
                                              onClick={() => addOption(cat.id, q.id)}
                                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                                           >
                                              <Plus className="w-3 h-3" /> {t.addOption}
                                           </button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                           {q.options?.map((opt) => (
                                              <div key={opt.id} className={`flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                 <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <input 
                                                       type="text" 
                                                       value={opt.text} 
                                                       onChange={(e) => updateOption(cat.id, q.id, opt.id, { text: e.target.value })}
                                                       placeholder={t.optionLabel}
                                                       className={`px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold ${isRtl ? 'text-right' : ''}`}
                                                    />
                                                    <input 
                                                       type="text" 
                                                       value={opt.arText} 
                                                       onChange={(e) => updateOption(cat.id, q.id, opt.id, { arText: e.target.value })}
                                                       placeholder={t.optionLabelAr}
                                                       className={`px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold ${isRtl ? 'text-right' : ''}`}
                                                    />
                                                    <div className="relative">
                                                       <input 
                                                          type="number" 
                                                          min="1" max="5"
                                                          value={opt.value} 
                                                          onChange={(e) => updateOption(cat.id, q.id, opt.id, { value: Number(e.target.value) })}
                                                          placeholder={t.scoreValue}
                                                          className={`w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black ${isRtl ? 'text-right' : ''}`}
                                                       />
                                                       <span className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-400`}>SCORE</span>
                                                    </div>
                                                 </div>
                                                 <button onClick={() => removeOption(cat.id, q.id, opt.id)} className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-500 transition-colors">
                                                    <X className="w-3.5 h-3.5" />
                                                 </button>
                                              </div>
                                           ))}
                                        </div>
                                     </div>
                                   )}
                                </div>
                              ))}
                              <button onClick={() => addQuestion(cat.id)} className={`w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-xs font-black text-slate-400 uppercase tracking-widest hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <Plus className="w-4 h-4" />
                                {t.addQuestion}
                              </button>
                           </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <footer className={`p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
              <div className={`flex-1 flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <HelpCircle className="w-5 h-5 text-slate-400" />
                <p className="text-[10px] font-medium text-slate-500 max-w-sm">
                  {isRtl ? 'تأكد من أن إجمالي أوزان الفئات يساوي 100٪ ، وأوزان الأسئلة داخل كل فئة تساوي 100٪ للحصول على نتائج دقيقة.' : 'Ensure total category weights equal 100%, and question weights within each category equal 100% for accurate results.'}
                </p>
              </div>
              <div className={`flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <button 
                  onClick={() => setShowEditor(false)}
                  className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors text-sm"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleSave}
                  className="px-10 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 transition-all transform active:scale-[0.98] text-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t.saveChanges}
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManagement;

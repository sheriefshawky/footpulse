
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  ClipboardList, 
  TrendingUp, 
  LayoutDashboard, 
  LogOut, 
  ChevronRight, 
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Globe,
  Lock,
  User as UserIcon,
  FileText
} from 'lucide-react';
import { 
  User, 
  UserRole, 
  SurveyTemplate, 
  SurveyResponse, 
  SurveyAssignment,
  Language 
} from './types';
import { translations } from './translations';
import { api } from './api';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import TemplateManagement from './components/TemplateManagement';
import SurveyList from './components/SurveyList';
import SurveyForm from './components/SurveyForm';
import Analytics from './components/Analytics';
import Login from './components/Login';
import FootPulseLogo from './components/Logo';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    return (saved as Language) || 'en';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [assignments, setAssignments] = useState<SurveyAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSurvey, setActiveSurvey] = useState<{template: SurveyTemplate, targetId: string} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Profile Settings State
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });

  const t = translations[lang];
  const isRtl = lang === 'ar';

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRtl]);

  const refreshData = async () => {
    if (currentUser) {
      setLoading(true);
      try {
        const [usersData, responsesData, templatesData, assignmentsData] = await Promise.all([
          api.get('/users'),
          api.get('/responses'),
          api.get('/templates'),
          api.get('/assignments')
        ]);
        setUsers(usersData);
        setResponses(responsesData);
        setTemplates(templatesData);
        setAssignments(assignmentsData);
      } catch (err) {
        console.error("Data fetch error", err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentUser]);

  const sidebarItems = useMemo(() => {
    const items = [
      { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.PLAYER, UserRole.TRAINER, UserRole.GUARDIAN] },
      { id: 'surveys', label: t.surveys, icon: <ClipboardList className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.PLAYER, UserRole.TRAINER, UserRole.GUARDIAN] },
      { id: 'analytics', label: t.analytics, icon: <TrendingUp className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.PLAYER, UserRole.TRAINER, UserRole.GUARDIAN] },
      { id: 'users', label: t.users, icon: <Users className="w-5 h-5" />, roles: [UserRole.ADMIN] },
      { id: 'templates', label: t.templates, icon: <FileText className="w-5 h-5" />, roles: [UserRole.ADMIN] },
    ];
    return items.filter(item => item.roles.includes(currentUser?.role as UserRole));
  }, [currentUser, t]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setActiveTab('dashboard');
    setIsSidebarOpen(false);
  };

  const submitSurvey = async (response: SurveyResponse) => {
    try {
      await api.post('/responses', {
        template_id: response.templateId,
        target_player_id: response.targetPlayerId,
        month: response.month,
        answers: response.answers,
        weighted_score: response.weightedScore
      });
      await refreshData();
      setActiveSurvey(null);
      setActiveTab('dashboard');
    } catch (err) {
      alert("Failed to submit survey");
    }
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'ar' : 'en');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) {
      alert(t.passwordsDoNotMatch);
      return;
    }
    try {
      setLoading(true);
      await api.patch('/users/me/password', {
        currentPassword: passData.current,
        newPassword: passData.new
      });
      alert(t.passwordUpdated);
      setShowSettings(false);
      setPassData({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      alert(err.message || "Password update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} lang={lang} toggleLang={toggleLang} />;
  }

  return (
    <div className={`flex h-screen bg-slate-50 overflow-hidden relative ${isRtl ? 'font-arabic' : ''}`}>
      {loading && (
        <div className="fixed inset-0 z-[100] bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-900 tracking-tight">{isRtl ? 'جاري التحميل...' : 'Loading Data...'}</p>
          </div>
        </div>
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 ${isRtl ? 'right-0' : 'left-0'} z-40 w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 p-1.5 rounded-xl shadow-lg border border-slate-700/50">
              <FootPulseLogo size={40} />
            </div>
            <div>
              <h1 className="text-xl font-black italic tracking-tighter">
                <span className="text-[#0079AD]">Foot</span>
                <span className="text-[#7BC242]">Pulse</span>
              </h1>
              <p className="text-[10px] uppercase font-semibold text-emerald-400">{t.academyHub}</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setActiveSurvey(null);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === item.id 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </div>
              {activeTab === item.id && <ChevronRight className={`w-4 h-4 opacity-70 ${isRtl ? 'rotate-180' : ''}`} />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 m-4 bg-slate-800/50 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <img 
              src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}`} 
              alt={currentUser.name} 
              className="w-10 h-10 rounded-full border-2 border-slate-700 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {currentUser.role === UserRole.ADMIN ? t.admin : 
                 currentUser.role === UserRole.TRAINER ? t.coach :
                 currentUser.role === UserRole.PLAYER ? t.player : t.guardian}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors group"
          >
            <LogOut className={`w-4 h-4 transition-transform group-hover:translate-x-${isRtl ? '1' : '-1'}`} />
            {t.signOut}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
               <Menu className="w-6 h-6" />
             </button>
             <div className="relative w-full max-w-sm hidden md:block">
               <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
               <input 
                 type="text" 
                 placeholder={t.search} 
                 className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none`}
               />
             </div>
             <div className="md:hidden flex items-center gap-2">
                <FootPulseLogo size={32} />
                <span className="text-lg font-black italic">
                   <span className="text-[#0079AD]">Foot</span>
                   <span className="text-[#7BC242]">Pulse</span>
                </span>
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
             <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors text-xs font-bold text-slate-600">
               <Globe className="w-4 h-4" />
               {lang === 'en' ? 'العربية' : 'English'}
             </button>
             <button className="p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors relative">
               <Bell className="w-5 h-5 text-slate-600" />
               <span className={`absolute top-2 ${isRtl ? 'left-2.5' : 'right-2.5'} w-2 h-2 bg-emerald-500 rounded-full border-2 border-white`}></span>
             </button>
             <button 
                onClick={() => setShowSettings(true)}
                className="p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
             >
               <Settings className="w-5 h-5 text-slate-600" />
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
          {activeSurvey ? (
            <SurveyForm 
              template={activeSurvey.template} 
              targetId={activeSurvey.targetId} 
              currentUser={currentUser}
              onSubmit={submitSurvey}
              onCancel={() => setActiveSurvey(null)}
              lang={lang}
            />
          ) : (
            <div className="max-w-7xl mx-auto">
              {activeTab === 'dashboard' && (
                <Dashboard 
                  user={currentUser} 
                  responses={responses} 
                  users={users} 
                  templates={templates}
                  assignments={assignments}
                  onStartSurvey={(t, id) => setActiveSurvey({template: t, targetId: id})}
                  lang={lang}
                />
              )}
              {activeTab === 'users' && <UserManagement users={users} onRegister={refreshData} lang={lang} />}
              {activeTab === 'templates' && <TemplateManagement templates={templates} users={users} onUpdate={refreshData} lang={lang} />}
              {activeTab === 'surveys' && (
                <SurveyList 
                  user={currentUser} 
                  users={users} 
                  templates={templates} 
                  responses={responses}
                  assignments={assignments}
                  onStartSurvey={(t, id) => setActiveSurvey({template: t, targetId: id})}
                  lang={lang}
                />
              )}
              {activeTab === 'analytics' && (
                <Analytics 
                  user={currentUser} 
                  users={users} 
                  responses={responses} 
                  lang={lang}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Settings / Change Password Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 md:p-8 border-b border-slate-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={isRtl ? 'text-right' : ''}>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900">{t.profileSettings}</h3>
                <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">{isRtl ? 'إدارة كلمة المرور والخيارات الشخصية.' : 'Manage your password and personal options.'}</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className={`p-6 md:p-8 space-y-6 ${isRtl ? 'text-right' : ''}`}>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.currentPassword}</label>
                  <div className="relative">
                    <Lock className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                    <input 
                      required
                      type="password" 
                      value={passData.current}
                      // Fixed: use setPassData instead of setFormData
                      onChange={(e) => setPassData({...passData, current: e.target.value})}
                      placeholder="••••••••"
                      className={`w-full ${isRtl ? 'pr-10' : 'pl-10'} px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.newPassword}</label>
                  <div className="relative">
                    <Lock className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                    <input 
                      required
                      type="password" 
                      value={passData.new}
                      // Fixed: use setPassData instead of setFormData
                      onChange={(e) => setPassData({...passData, new: e.target.value})}
                      placeholder="••••••••"
                      className={`w-full ${isRtl ? 'pr-10' : 'pl-10'} px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.confirmPassword}</label>
                  <div className="relative">
                    <Lock className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                    <input 
                      required
                      type="password" 
                      value={passData.confirm}
                      // Fixed: use setPassData instead of setFormData
                      onChange={(e) => setPassData({...passData, confirm: e.target.value})}
                      placeholder="••••••••"
                      className={`w-full ${isRtl ? 'pr-10' : 'pl-10'} px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium`}
                    />
                  </div>
                  {passData.new && passData.confirm && passData.new !== passData.confirm && (
                    <p className="text-[10px] text-rose-500 font-bold px-1">{t.passwordsDoNotMatch}</p>
                  )}
                </div>
              </div>

              <div className={`pt-6 border-t border-slate-100 flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <button 
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors text-sm"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  disabled={loading || !passData.current || !passData.new || passData.new !== passData.confirm}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.98] text-sm"
                >
                  {t.changePassword}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

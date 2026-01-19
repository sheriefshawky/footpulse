
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  ClipboardList, 
  TrendingUp, 
  LayoutDashboard, 
  LogOut, 
  ChevronRight, 
  BarChart3, 
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Globe
} from 'lucide-react';
import { 
  User, 
  UserRole, 
  SurveyTemplate, 
  SurveyResponse, 
  Language 
} from './types';
import { INITIAL_USERS, INITIAL_TEMPLATES } from './constants';
import { translations } from './translations';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import SurveyList from './components/SurveyList';
import SurveyForm from './components/SurveyForm';
import Analytics from './components/Analytics';
import Login from './components/Login';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    return (saved as Language) || 'en';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('stamina_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [templates] = useState<SurveyTemplate[]>(INITIAL_TEMPLATES);
  const [responses, setResponses] = useState<SurveyResponse[]>(() => {
    const saved = localStorage.getItem('stamina_responses');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSurvey, setActiveSurvey] = useState<{template: SurveyTemplate, targetId: string} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const t = translations[lang];
  const isRtl = lang === 'ar';

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRtl]);

  useEffect(() => {
    localStorage.setItem('stamina_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('stamina_responses', JSON.stringify(responses));
  }, [responses]);

  useEffect(() => {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  const sidebarItems = useMemo(() => {
    const items = [
      { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.PLAYER, UserRole.TRAINER, UserRole.GUARDIAN] },
      { id: 'surveys', label: t.surveys, icon: <ClipboardList className="w-5 h-5" />, roles: [UserRole.PLAYER, UserRole.TRAINER, UserRole.GUARDIAN] },
      { id: 'analytics', label: t.analytics, icon: <TrendingUp className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.PLAYER, UserRole.TRAINER, UserRole.GUARDIAN] },
      { id: 'users', label: t.users, icon: <Users className="w-5 h-5" />, roles: [UserRole.ADMIN] },
    ];
    return items.filter(item => item.roles.includes(currentUser?.role as UserRole));
  }, [currentUser, t]);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
    setIsSidebarOpen(false);
  };

  const handleRegisterUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const submitSurvey = (response: SurveyResponse) => {
    setResponses(prev => [...prev, response]);
    setActiveSurvey(null);
    setActiveTab('dashboard');
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'ar' : 'en');
  };

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} users={users} lang={lang} toggleLang={toggleLang} />;
  }

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">FootPulse</h1>
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
    </>
  );

  return (
    <div className={`flex h-screen bg-slate-50 overflow-hidden relative ${isRtl ? 'font-arabic' : ''}`}>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 ${isRtl ? 'right-0' : 'left-0'} z-40 w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
             <button 
               onClick={() => setIsSidebarOpen(true)} 
               className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
             >
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
                <BarChart3 className="w-6 h-6 text-emerald-500" />
                <span className="text-lg font-bold text-slate-900">FootPulse</span>
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
             <button 
                onClick={toggleLang}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors text-xs font-bold text-slate-600"
             >
               <Globe className="w-4 h-4" />
               {lang === 'en' ? 'العربية' : 'English'}
             </button>
             <button className="p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors relative">
               <Bell className="w-5 h-5 text-slate-600" />
               <span className={`absolute top-2 ${isRtl ? 'left-2.5' : 'right-2.5'} w-2 h-2 bg-emerald-500 rounded-full border-2 border-white`}></span>
             </button>
             <button className="p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
               <Settings className="w-5 h-5 text-slate-600" />
             </button>
          </div>
        </header>

        {/* Content */}
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
                  onStartSurvey={(t, id) => setActiveSurvey({template: t, targetId: id})}
                  lang={lang}
                />
              )}
              {activeTab === 'users' && <UserManagement users={users} onRegister={handleRegisterUser} lang={lang} />}
              {activeTab === 'surveys' && (
                <SurveyList 
                  user={currentUser} 
                  users={users} 
                  templates={templates} 
                  responses={responses}
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
    </div>
  );
};

export default App;

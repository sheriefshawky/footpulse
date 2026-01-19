
import React, { useState } from 'react';
import { User, UserRole, Language } from '../types';
import { BarChart3, Lock, Mail, ChevronRight, Trophy, Globe } from 'lucide-react';
import { translations } from '../translations';

interface Props {
  onLogin: (u: User) => void;
  users: User[];
  lang: Language;
  toggleLang: () => void;
}

const Login: React.FC<Props> = ({ onLogin, users, lang, toggleLang }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  const t = translations[lang];
  const isRtl = lang === 'ar';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError(lang === 'en' ? 'Invalid credentials. Check the demo accounts below.' : 'بيانات الاعتماد غير صالحة. تحقق من الحسابات التجريبية أدناه.');
    }
  };

  const loginAs = (role: UserRole) => {
    const user = users.find(u => u.role === role);
    if (user) onLogin(user);
  };

  return (
    <div className={`min-h-screen bg-slate-950 flex overflow-hidden relative ${isRtl ? 'font-arabic' : ''}`}>
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
        <button 
          onClick={toggleLang}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-xs font-bold hover:bg-white/20 transition-all"
        >
          <Globe className="w-4 h-4" />
          {lang === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      <div className="absolute top-0 right-0 w-64 md:w-[800px] h-64 md:h-[800px] bg-emerald-500/10 blur-[80px] md:blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 md:w-[600px] h-48 md:h-[600px] bg-blue-500/10 blur-[60px] md:blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

      <div className="flex-1 flex flex-col justify-center px-6 md:px-24 lg:px-32 z-10 w-full">
        <div className={`max-w-md w-full mx-auto md:mx-0 animate-in fade-in slide-in-from-${isRtl ? 'right' : 'left'}-8 duration-700`}>
           <div className={`flex items-center gap-4 mb-8 md:mb-12 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="p-3 bg-emerald-500 rounded-2xl shadow-xl shadow-emerald-500/20">
                 <BarChart3 className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">FootPulse</h1>
           </div>

           <div className={`space-y-2 mb-8 md:mb-10 text-center md:${isRtl ? 'text-right' : 'text-left'}`}>
              <h2 className="text-xl md:text-2xl font-bold text-white">{t.loginTitle}</h2>
              <p className="text-slate-400 text-sm md:text-base font-medium">{t.loginSubtitle}</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                 <label className={`text-[10px] font-black uppercase text-slate-500 tracking-widest px-1 block ${isRtl ? 'text-right' : ''}`}>
                    {lang === 'en' ? 'Academy Email' : 'البريد الإلكتروني للأكاديمية'}
                 </label>
                 <div className="relative group">
                    <Mail className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors`} />
                    <input 
                       required
                       type="email" 
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       className={`w-full ${isRtl ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} py-3 md:py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm md:text-base`} 
                       placeholder="your@email.com"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className={`text-[10px] font-black uppercase text-slate-500 tracking-widest px-1 block ${isRtl ? 'text-right' : ''}`}>
                    {lang === 'en' ? 'Password' : 'كلمة المرور'}
                 </label>
                 <div className="relative group">
                    <Lock className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors`} />
                    <input 
                       required
                       type="password" 
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className={`w-full ${isRtl ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} py-3 md:py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm md:text-base`} 
                       placeholder="••••••••"
                    />
                 </div>
              </div>

              {error && <p className={`text-rose-500 text-xs md:text-sm font-bold animate-pulse ${isRtl ? 'text-right' : ''}`}>{error}</p>}

              <button className="w-full py-3 md:py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-2xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 text-sm md:text-base">
                 {t.accessPortal}
                 <ChevronRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
           </form>

           <div className="mt-10 md:mt-12 pt-6 md:pt-8 border-t border-slate-800">
              <p className={`text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4 text-center md:${isRtl ? 'text-right' : 'text-left'}`}>{t.demoPersonas}</p>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                 <button onClick={() => loginAs(UserRole.ADMIN)} className="p-2 md:p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] md:text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></div> {t.admin}
                 </button>
                 <button onClick={() => loginAs(UserRole.TRAINER)} className="p-2 md:p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] md:text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div> {t.coach}
                 </button>
                 <button onClick={() => loginAs(UserRole.PLAYER)} className="p-2 md:p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] md:text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div> {t.player}
                 </button>
                 <button onClick={() => loginAs(UserRole.GUARDIAN)} className="p-2 md:p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] md:text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0"></div> {t.guardian}
                 </button>
              </div>
           </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center p-12 xl:p-24">
         <div className="w-full h-full rounded-[48px] bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-[url('https://picsum.photos/1000/1000?random=100')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
            
            <div className={`absolute bottom-12 xl:bottom-16 ${isRtl ? 'right-12 xl:right-16 text-right' : 'left-12 xl:left-16 text-left'} right-12 xl:right-16 z-10 animate-in slide-in-from-bottom-8 duration-1000`}>
               <div className={`flex items-center gap-3 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex ${isRtl ? 'space-x-reverse -space-x-3' : '-space-x-3'}`}>
                     {[1,2,3].map(i => <img key={i} src={`https://picsum.photos/100/100?random=${i+10}`} className="w-8 h-8 xl:w-10 xl:h-10 rounded-full border-2 border-white object-cover" alt="" />)}
                  </div>
                  <span className="text-[10px] xl:text-xs font-black text-white uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                    {lang === 'en' ? 'Elite Performance Data' : 'بيانات الأداء النخبوي'}
                  </span>
               </div>
               <h2 className="text-3xl xl:text-5xl font-black text-white leading-tight mb-4 tracking-tighter">
                 {lang === 'en' ? <>Your Football <br/><span className="text-emerald-300">DNA</span> Visualized.</> : <>بصمتك الكروية <br/><span className="text-emerald-300">الرقمية</span> مجسدة أمامك.</>}
               </h2>
               <div className={`flex items-center gap-4 xl:gap-6 text-emerald-100/70 text-xs xl:text-sm font-medium ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Professional Focus</div>
                  <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Live Analytics</div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Login;

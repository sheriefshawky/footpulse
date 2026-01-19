
import React, { useState } from 'react';
import { User, Language } from '../types';
import { Lock, Mail, ChevronRight, Trophy, Globe } from 'lucide-react';
import { translations } from '../translations';
import { api } from '../api';
import FootPulseLogo from './Logo';

interface Props {
  onLogin: (u: User) => void;
  lang: Language;
  toggleLang: () => void;
}

const Login: React.FC<Props> = ({ onLogin, lang, toggleLang }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = translations[lang];
  const isRtl = lang === 'ar';

  const performLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email: loginEmail, password: loginPass });
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      onLogin(response.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(email, password);
  };

  const loginAsDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    performLogin(demoEmail, 'password123');
  };

  return (
    <div className={`min-h-screen bg-slate-950 flex overflow-hidden relative ${isRtl ? 'font-arabic' : ''}`}>
      {/* Language Switcher Fixed Top */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
        <button 
          onClick={toggleLang}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-xs font-bold hover:bg-white/20 transition-all active:scale-95"
        >
          <Globe className="w-4 h-4" />
          {lang === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 md:w-[800px] h-64 md:h-[800px] bg-emerald-500/10 blur-[80px] md:blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 md:w-[600px] h-48 md:h-[600px] bg-blue-500/10 blur-[60px] md:blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

      {/* Left Column: Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-24 lg:px-32 z-10 w-full">
        <div className={`max-w-md w-full mx-auto md:mx-0 animate-in fade-in slide-in-from-${isRtl ? 'right' : 'left'}-8 duration-700`}>
           <div className={`flex items-center gap-4 mb-8 md:mb-12 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 bg-slate-900 rounded-2xl shadow-xl shadow-emerald-500/20 border border-slate-800">
                 <FootPulseLogo size={60} />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">FootPulse</h1>
           </div>

           <div className={`space-y-2 mb-8 md:mb-10 ${isRtl ? 'text-right' : 'text-left'}`}>
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

              <button 
                disabled={loading}
                className="w-full py-3 md:py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white font-black rounded-2xl shadow-2xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 text-sm md:text-base"
              >
                 {loading ? (isRtl ? 'جاري التحقق...' : 'Authenticating...') : t.accessPortal}
                 {!loading && <ChevronRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />}
              </button>
           </form>

           {/* Quick Demo Access Grid */}
           <div className="mt-10 md:mt-12 pt-6 md:pt-8 border-t border-slate-800">
              <p className={`text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4 text-center md:${isRtl ? 'text-right' : 'text-left'}`}>{t.demoPersonas}</p>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                 <button disabled={loading} onClick={() => loginAsDemo('admin@footpulse.app')} className="p-2 md:p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] md:text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 group">
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0 group-hover:scale-150 transition-transform"></div> {t.admin}
                 </button>
                 <button disabled={loading} onClick={() => loginAsDemo('mike@footpulse.app')} className="p-2 md:p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] md:text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 group">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0 group-hover:scale-150 transition-transform"></div> {t.coach}
                 </button>
                 <button disabled={loading} onClick={() => loginAsDemo('leo@footpulse.app')} className="p-2 md:p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] md:text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 group">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 group-hover:scale-150 transition-transform"></div> {t.player}
                 </button>
                 <button disabled={loading} onClick={() => loginAsDemo('senior@footpulse.app')} className="p-2 md:p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] md:text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 group">
                   <div className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0 group-hover:scale-150 transition-transform"></div> {t.guardian}
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Right Column: Hero Visual Section */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 xl:p-24">
         <div className="w-full h-full rounded-[48px] bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl overflow-hidden relative group">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-40 mix-blend-overlay group-hover:scale-110 transition-transform duration-[2000ms]"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
            
            {/* Hero Content */}
            <div className={`absolute bottom-12 xl:bottom-16 ${isRtl ? 'right-12 xl:right-16 text-right' : 'left-12 xl:left-16 text-left'} right-12 xl:right-16 z-10 animate-in slide-in-from-bottom-8 duration-1000`}>
               <div className={`flex items-center gap-3 mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex ${isRtl ? 'space-x-reverse -space-x-3' : '-space-x-3'}`}>
                     {[1,2,3].map(i => <img key={i} src={`https://picsum.photos/100/100?random=${i+20}`} className="w-8 h-8 xl:w-10 xl:h-10 rounded-full border-2 border-white object-cover shadow-lg" alt="" />)}
                  </div>
                  <span className="text-[10px] xl:text-xs font-black text-white uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/20">
                    {lang === 'en' ? 'Elite Performance Data' : 'بيانات الأداء النخبوي'}
                  </span>
               </div>
               
               <h2 className="text-3xl xl:text-5xl font-black text-white leading-tight mb-4 tracking-tighter">
                 {lang === 'en' ? (
                   <>Your Football <br/><span className="text-emerald-300">DNA</span> Visualized.</>
                 ) : (
                   <>بصمتك الكروية <br/><span className="text-emerald-300">الرقمية</span> مجسدة أمامك.</>
                 )}
               </h2>
               
               <div className={`flex items-center gap-4 xl:gap-6 text-emerald-100/70 text-xs xl:text-sm font-medium ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-emerald-400" /> {lang === 'en' ? 'Professional Focus' : 'تركيز احترافي'}</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4"><FootPulseLogo size={16} /></div> {lang === 'en' ? 'Live Analytics' : 'تحليلات مباشرة'}</div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Login;

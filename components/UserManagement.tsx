
import React, { useState } from 'react';
import { User, UserRole, Language } from '../types';
import { UserPlus, Search, Mail, Phone, X, UserCheck } from 'lucide-react';
import { translations } from '../translations';

interface Props {
  users: User[];
  onRegister: (u: User) => void;
  lang: Language;
}

const UserManagement: React.FC<Props> = ({ users, onRegister, lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');
  const [newUser, setNewUser] = useState<Partial<User>>({
    role: UserRole.PLAYER,
    name: '',
    email: '',
    mobile: '',
    password: 'password123',
    trainerId: '',
    playerId: ''
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(filter.toLowerCase()) || 
    u.email.toLowerCase().includes(filter.toLowerCase())
  );

  const trainers = users.filter(u => u.role === UserRole.TRAINER);
  const players = users.filter(u => u.role === UserRole.PLAYER);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.mobile) return;

    // Additional validation for conditional roles
    if (newUser.role === UserRole.PLAYER && !newUser.trainerId) {
      alert("Please select a trainer for the player.");
      return;
    }
    if (newUser.role === UserRole.GUARDIAN && !newUser.playerId) {
      alert("Please assign a player to the guardian.");
      return;
    }

    const id = `u-${Math.random().toString(36).substr(2, 9)}`;
    onRegister({
      ...newUser,
      id,
      avatar: `https://picsum.photos/200/200?random=${users.length + 10}`,
    } as User);
    
    setShowModal(false);
    setNewUser({ 
      role: UserRole.PLAYER, 
      name: '', 
      email: '', 
      mobile: '', 
      password: 'password123',
      trainerId: '',
      playerId: ''
    });
  };

  return (
    <div className={`animate-in fade-in duration-500 ${isRtl ? 'text-right font-arabic' : ''}`}>
      <div className={`flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{t.userManagement}</h2>
          <p className="text-slate-500 font-medium">{isRtl ? 'أضف وأشرف على طاقم الأكاديمية واللاعبين وأولياء الأمور.' : 'Add and oversee academy staff, players, and guardians.'}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all text-sm md:text-base"
        >
          <UserPlus className="w-5 h-5" />
          {t.registerMember}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className={`p-4 md:p-6 border-b border-slate-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="relative max-w-sm w-full">
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <input 
              type="text" 
              placeholder={t.search} 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none`}
            />
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className={`w-full ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'العضو' : 'Member'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'الدور' : 'Role'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'الاتصال' : 'Contact'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'العلاقات' : 'Relations'}</th>
                <th className={`px-6 py-4 ${isRtl ? 'text-left' : 'text-right'} text-[10px] font-black text-slate-400 uppercase tracking-widest`}>{isRtl ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <img src={u.avatar} className="w-10 h-10 rounded-full border border-slate-200 object-cover" alt="" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{u.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">ID: {u.id.split('-')[1]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      u.role === UserRole.ADMIN ? 'bg-indigo-50 text-indigo-600' :
                      u.role === UserRole.TRAINER ? 'bg-emerald-50 text-emerald-600' :
                      u.role === UserRole.PLAYER ? 'bg-blue-50 text-blue-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {u.role === UserRole.TRAINER ? t.coach : u.role === UserRole.ADMIN ? t.admin : u.role === UserRole.PLAYER ? t.player : t.guardian}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className={`text-[10px] text-slate-600 flex items-center gap-1.5 font-bold truncate max-w-[150px] ${isRtl ? 'flex-row-reverse' : ''}`}><Mail className="w-3 h-3 text-slate-400" /> {u.email}</p>
                      <p className={`text-[10px] text-slate-600 flex items-center gap-1.5 font-bold ${isRtl ? 'flex-row-reverse' : ''}`}><Phone className="w-3 h-3 text-slate-400" /> {u.mobile}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {u.role === UserRole.PLAYER && u.trainerId && (
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold text-slate-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <UserCheck className="w-3 h-3" />
                        {isRtl ? 'المدرب' : 'Coach'}: {users.find(t => t.id === u.trainerId)?.name || 'Unknown'}
                      </div>
                    )}
                    {u.role === UserRole.GUARDIAN && u.playerId && (
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold text-slate-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <UserCheck className="w-3 h-3" />
                        {isRtl ? 'اللاعب' : 'Player'}: {users.find(p => p.id === u.playerId)?.name || 'Unknown'}
                      </div>
                    )}
                    {!u.trainerId && !u.playerId && <span className="text-[10px] text-slate-300 italic font-medium">{isRtl ? 'لا يوجد' : 'None'}</span>}
                  </td>
                  <td className={`px-6 py-4 ${isRtl ? 'text-left' : 'text-right'}`}>
                    <button className="text-[10px] font-black text-slate-400 hover:text-emerald-600 uppercase tracking-widest transition-colors">{isRtl ? 'تعديل' : 'Edit'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 md:p-8 border-b border-slate-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={isRtl ? 'text-right' : ''}>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900">{t.registerMember}</h3>
                <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">{isRtl ? 'قم بإعداد الملف الشخصي والدور وعلاقات الأكاديمية.' : 'Setup profile, role, and academy relations.'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleRegister} className={`p-6 md:p-8 space-y-5 md:space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar ${isRtl ? 'text-right' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.fullName}</label>
                  <input 
                    required
                    type="text" 
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    placeholder="e.g. Cristiano Ronaldo"
                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium ${isRtl ? 'text-right' : ''}`}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.emailAddress}</label>
                  <input 
                    required
                    type="email" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="name@footpulse.app"
                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium ${isRtl ? 'text-right' : ''}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.mobileNumber}</label>
                  <input 
                    required
                    type="tel" 
                    value={newUser.mobile}
                    onChange={(e) => setNewUser({...newUser, mobile: e.target.value})}
                    placeholder="+44 7700 900000"
                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium ${isRtl ? 'text-right' : ''}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.personaRole}</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-slate-700 text-sm ${isRtl ? 'text-right' : ''}`}
                  >
                    <option value={UserRole.PLAYER}>{t.player}</option>
                    <option value={UserRole.TRAINER}>{t.coach}</option>
                    <option value={UserRole.GUARDIAN}>{t.guardian}</option>
                    <option value={UserRole.ADMIN}>{t.admin}</option>
                  </select>
                </div>

                {/* Conditional Relations */}
                {newUser.role === UserRole.PLAYER && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">{t.assignTrainer}</label>
                    <select 
                      required
                      value={newUser.trainerId}
                      onChange={(e) => setNewUser({...newUser, trainerId: e.target.value})}
                      className={`w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-slate-700 text-sm ${isRtl ? 'text-right' : ''}`}
                    >
                      <option value="">{isRtl ? 'اختر المدرب...' : 'Select Coach...'}</option>
                      {trainers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {newUser.role === UserRole.GUARDIAN && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-1">{t.assignPlayer}</label>
                    <select 
                      required
                      value={newUser.playerId}
                      onChange={(e) => setNewUser({...newUser, playerId: e.target.value})}
                      className={`w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-slate-700 text-sm ${isRtl ? 'text-right' : ''}`}
                    >
                      <option value="">{isRtl ? 'اختر اللاعب...' : 'Select Child/Player...'}</option>
                      {players.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className={`pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-3 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors text-sm"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.98] text-sm"
                >
                  {t.createAccount}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

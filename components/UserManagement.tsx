
import React, { useState } from 'react';
import { User, UserRole, Language } from '../types';
import { UserPlus, Search, Mail, Phone, X, UserCheck, Lock, Edit3, Key, ToggleLeft, ToggleRight, ShieldAlert, MapPin } from 'lucide-react';
import { translations } from '../translations';
import { api } from '../api';

interface Props {
  users: User[];
  onRegister: () => void;
  lang: Language;
}

const UserManagement: React.FC<Props> = ({ users, onRegister, lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [filter, setFilter] = useState('');
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    id: '',
    role: UserRole.PLAYER,
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    trainerId: '',
    playerId: '',
    position: '',
    isActive: true
  });

  const [resetData, setResetData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(filter.toLowerCase()) || 
    u.email.toLowerCase().includes(filter.toLowerCase())
  );

  const trainers = users.filter(u => u.role === UserRole.TRAINER);
  const players = users.filter(u => u.role === UserRole.PLAYER);

  const openRegisterModal = () => {
    setEditMode(false);
    setFormData({
      id: '',
      role: UserRole.PLAYER,
      name: '',
      email: '',
      mobile: '',
      password: '',
      confirmPassword: '',
      trainerId: '',
      playerId: '',
      position: '',
      isActive: true
    });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditMode(true);
    setFormData({
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      password: '',
      confirmPassword: '',
      trainerId: user.trainerId || '',
      playerId: user.playerId || '',
      position: user.position || '',
      isActive: user.isActive
    });
    setShowModal(true);
  };

  const openResetPasswordModal = (user: User) => {
    setSelectedUserForReset(user);
    setResetData({ newPassword: '', confirmPassword: '' });
    setShowResetModal(true);
  };

  const toggleUserStatus = async (user: User) => {
    try {
      await api.patch(`/users/${user.id}`, {
        is_active: !user.isActive
      });
      onRegister();
    } catch (err: any) {
      alert(err.message || "Failed to toggle status");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.mobile) return;

    if (!editMode && formData.password !== formData.confirmPassword) {
      alert(t.passwordsDoNotMatch);
      return;
    }

    try {
      if (editMode) {
        await api.patch(`/users/${formData.id}`, {
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          role: formData.role,
          trainer_id: formData.trainerId || null,
          player_id: formData.playerId || null,
          position: formData.position || null,
          is_active: formData.isActive
        });
        alert(t.userUpdated);
      } else {
        await api.post('/users', {
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          role: formData.role,
          password: formData.password,
          trainer_id: formData.trainerId || null,
          player_id: formData.playerId || null,
          position: formData.position || null
        });
        alert("Member registered successfully");
      }
      onRegister();
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || "Operation failed");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset) return;
    if (resetData.newPassword !== resetData.confirmPassword) {
      alert(t.passwordsDoNotMatch);
      return;
    }

    try {
      await api.patch(`/users/${selectedUserForReset.id}/reset-password`, {
        new_password: resetData.newPassword
      });
      alert(t.passwordUpdated);
      setShowResetModal(false);
    } catch (err: any) {
      alert(err.message || "Reset failed");
    }
  };

  return (
    <div className={`animate-in fade-in duration-500 ${isRtl ? 'text-right font-arabic' : ''}`}>
      <div className={`flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{t.userManagement}</h2>
          <p className="text-slate-500 font-medium">{isRtl ? 'أضف وأشرف على طاقم الأكاديمية واللاعبين وأولياء الأمور.' : 'Add and oversee academy staff, players, and guardians.'}</p>
        </div>
        <button 
          onClick={openRegisterModal}
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
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'الحالة' : 'Status'}</th>
                <th className={`px-6 py-4 ${isRtl ? 'text-left' : 'text-right'} text-[10px] font-black text-slate-400 uppercase tracking-widest`}>{isRtl ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(u => (
                <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors group ${!u.isActive ? 'opacity-60 grayscale' : ''}`}>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <img src={u.avatar} className="w-10 h-10 rounded-full border border-slate-200 object-cover" alt="" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{u.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">ID: {u.id.split('-')[1]} {u.position && `| ${u.position}`}</p>
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
                     <button 
                        onClick={() => toggleUserStatus(u)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                           u.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                        } ${isRtl ? 'flex-row-reverse' : ''}`}
                     >
                        {u.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {u.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'غير نشط' : 'Inactive')}
                     </button>
                  </td>
                  <td className={`px-6 py-4 ${isRtl ? 'text-left' : 'text-right'}`}>
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => openResetPasswordModal(u)}
                        className="p-2 hover:bg-amber-50 rounded-lg text-amber-500 transition-colors"
                        title="Force Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openEditModal(u)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        title="Edit User"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && selectedUserForReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 border-b border-slate-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <h3 className="text-xl font-bold text-slate-900">{isRtl ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}</h3>
              <button onClick={() => setShowResetModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className={`p-6 space-y-4 ${isRtl ? 'text-right' : ''}`}>
              <p className="text-sm font-medium text-slate-500">
                {isRtl ? `تعيين كلمة مرور جديدة لـ ${selectedUserForReset.name}` : `Set a new password for ${selectedUserForReset.name}`}
              </p>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.newPassword}</label>
                <input 
                  required
                  type="password" 
                  value={resetData.newPassword}
                  onChange={(e) => setResetData({...resetData, newPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.confirmPassword}</label>
                <input 
                  required
                  type="password" 
                  value={resetData.confirmPassword}
                  onChange={(e) => setResetData({...resetData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••••••"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowResetModal(false)} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 md:p-8 border-b border-slate-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={isRtl ? 'text-right' : ''}>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900">{editMode ? t.editMember : t.registerMember}</h3>
                <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">{isRtl ? 'قم بإعداد الملف الشخصي والدور وعلاقات الأكاديمية.' : 'Setup profile, role, and academy relations.'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={`p-6 md:p-8 space-y-5 md:space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar ${isRtl ? 'text-right' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.fullName}</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Cristiano Ronaldo"
                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium ${isRtl ? 'text-right' : ''}`}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.emailAddress}</label>
                  <input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="name@footpulse.app"
                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium ${isRtl ? 'text-right' : ''}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.mobileNumber}</label>
                  <input 
                    required
                    type="tel" 
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    placeholder="+44 7700 900000"
                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium ${isRtl ? 'text-right' : ''}`}
                  />
                </div>

                {!editMode && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.password}</label>
                      <div className="relative">
                        <Lock className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                        <input 
                          required
                          type="password" 
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                          placeholder="••••••••"
                          className={`w-full ${isRtl ? 'pr-10' : 'pl-10'} px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium`}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.personaRole}</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-slate-700 text-sm ${isRtl ? 'text-right' : ''}`}
                  >
                    <option value={UserRole.PLAYER}>{t.player}</option>
                    <option value={UserRole.TRAINER}>{t.coach}</option>
                    <option value={UserRole.GUARDIAN}>{t.guardian}</option>
                    <option value={UserRole.ADMIN}>{t.admin}</option>
                  </select>
                </div>

                {editMode && (
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isRtl ? 'حالة الحساب' : 'Account Status'}</label>
                     <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                            formData.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                          }`}
                        >
                          {formData.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          {formData.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'غير نشط' : 'Inactive')}
                        </button>
                        {!formData.isActive && formData.role === UserRole.ADMIN && (
                           <div className="flex items-center gap-1.5 text-rose-500">
                              <ShieldAlert className="w-4 h-4" />
                              <span className="text-[8px] font-black uppercase">{isRtl ? 'لا يمكن إلغاء تنشيط المسؤول' : 'Admins cannot be deactivated'}</span>
                           </div>
                        )}
                     </div>
                   </div>
                )}

                {formData.role === UserRole.PLAYER && (
                  <>
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">{t.position}</label>
                    <div className="relative">
                      <MapPin className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                      <input 
                        type="text" 
                        value={formData.position}
                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                        placeholder="e.g. Center Midfielder"
                        className={`w-full ${isRtl ? 'pr-10' : 'pl-10'} px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold`}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">{t.assignTrainer}</label>
                    <select 
                      required
                      value={formData.trainerId}
                      onChange={(e) => setFormData({...formData, trainerId: e.target.value})}
                      className={`w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-slate-700 text-sm ${isRtl ? 'text-right' : ''}`}
                    >
                      <option value="">{isRtl ? 'اختر المدرب...' : 'Select Coach...'}</option>
                      {trainers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  </>
                )}

                {formData.role === UserRole.GUARDIAN && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-1">{t.assignPlayer}</label>
                    <select 
                      required
                      value={formData.playerId}
                      onChange={(e) => setFormData({...formData, playerId: e.target.value})}
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
                  disabled={editMode && !formData.isActive && formData.role === UserRole.ADMIN}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.98] text-sm"
                >
                  {editMode ? t.saveChanges : t.createAccount}
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

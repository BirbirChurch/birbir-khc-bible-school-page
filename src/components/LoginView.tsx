import React, { useState } from 'react';
import { LogIn, Shield, Award, User, GraduationCap, Lock, Cloud } from 'lucide-react';
import { CurrentUser, ProgramType, Student, UserRole } from '../types.ts';
import { FirebaseConnectionReport } from '../services/firebaseSync.ts';
import { CHURCH_LOGO } from '../assets/logo.ts';

interface LoginViewProps {
  students: Student[];
  teachers: string[];
  userPasswords: Record<string, string>;
  systemLocked: boolean;
  onLogin: (user: CurrentUser) => void;
  showNotify: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  firebaseReport: FirebaseConnectionReport | null;
  isTestingFirebase: boolean;
  onOpenFirebaseModal: () => void;
  churchLogo?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({
  students,
  teachers,
  userPasswords,
  systemLocked,
  onLogin,
  showNotify,
  firebaseReport,
  isTestingFirebase,
  onOpenFirebaseModal,
  churchLogo
}) => {
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [studentProgram, setStudentProgram] = useState<ProgramType>('Diploma');
  const [selectedTeacher, setSelectedTeacher] = useState<string>(teachers[0] || '');
  const [studentId, setStudentId] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (systemLocked && role !== 'ADMIN') {
      showNotify('ሲስተሙ በጥገና ሁነታ ላይ ስለሆነ ከአድሚን ውጪ መግባት አይቻልም!', 'error');
      return;
    }

    if (role === 'STUDENT') {
      const cleanId = studentId.trim();
      if (!cleanId) {
        showNotify('እባክዎ የተማሪ መለያ ኮድ ያስገቡ!', 'error');
        return;
      }

      const found = students.find(
        (s) => s.id === cleanId && s.program === studentProgram
      ) || students.find((s) => s.id === cleanId);

      if (!found) {
        showNotify(`የተሳሳተ የተማሪ መለያ ኮድ (${cleanId})! እባክዎ እንደገና ይሞክሩ።`, 'error');
        return;
      }

      // Check student's individual password (stored by found.uid)
      const expectedPassword = userPasswords[found.uid] || found.id;
      if (password !== expectedPassword) {
        showNotify('የተሳሳተ የተማሪ የይለፍ ቃል!', 'error');
        return;
      }

      onLogin({
        role: 'STUDENT',
        id: found.id,
        uid: found.uid,
        name: found.name,
        program: found.program
      });
      showNotify(`እንኳን ደህና መጣህ/ሽ ${found.name}!`, 'success');
      return;
    }

    if (role === 'TEACHER') {
      const expectedPassword = userPasswords[selectedTeacher] || 'teacher123';
      if (password !== expectedPassword) {
        showNotify('የተሳሳተ የመምህር የይለፍ ቃል!', 'error');
        return;
      }
      onLogin({
        role: 'TEACHER',
        id: selectedTeacher,
        name: selectedTeacher
      });
      showNotify(`እንኳን ደህና መጡ ${selectedTeacher}!`, 'success');
      return;
    }

    // ADMIN, DEAN, REGISTRAR
    const roleKey = role.toLowerCase();
    const expectedPassword = userPasswords[roleKey] || (role === 'ADMIN' ? 'admin123' : role === 'DEAN' ? 'dean123' : 'reg123');

    if (password !== expectedPassword) {
      showNotify('የተሳሳተ የይለፍ ቃል!', 'error');
      return;
    }

    const roleNameMap: Record<string, string> = {
      ADMIN: 'አድሚን (Admin)',
      DEAN: 'ዋና ዲን (Academic Dean)',
      REGISTRAR: 'ሪጅስተራል (Registrar)'
    };

    onLogin({
      role,
      id: roleKey,
      name: roleNameMap[role]
    });
    showNotify(`እንኳን ደህና መጡ ${roleNameMap[role]}!`, 'success');
  };

  return (
    <div className="max-w-md mx-auto my-10 px-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Card Header with church branding */}
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 p-8 text-center text-white relative">
          <div className="flex justify-center mb-3">
            <img
              src={churchLogo || CHURCH_LOGO}
              alt="የብርብር ከተማ ቃለ ሕይወት ቤተ ክርስቲያን"
              className="h-20 sm:h-24 w-auto object-contain drop-shadow-md"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-amber-300 tracking-wide">
            ወደ ሲስተሙ ይግቡ
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200 mt-1 font-medium">
            የብርብር ከተማ ቃለ ሕይወት መጽሐፍ ቅዱስ ትምህርት ቤት
          </p>
        </div>

        {/* Clean Form Body (Zero password hints or demo notes) */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {/* Role selector tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              የመግቢያ ሚና (Role)
            </label>
            <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => { setRole('STUDENT'); setPassword(''); }}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  role === 'STUDENT'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>ተማሪ</span>
              </button>
              <button
                type="button"
                onClick={() => { setRole('TEACHER'); setPassword(''); }}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  role === 'TEACHER'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>መምህር</span>
              </button>
              <button
                type="button"
                onClick={() => { setRole('REGISTRAR'); setPassword(''); }}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  role === 'REGISTRAR'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>ሪጅስተራል</span>
              </button>
              <button
                type="button"
                onClick={() => { setRole('DEAN'); setPassword(''); }}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  role === 'DEAN'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>ዲን</span>
              </button>
              <button
                type="button"
                onClick={() => { setRole('ADMIN'); setPassword(''); }}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  role === 'ADMIN'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>አድሚን</span>
              </button>
            </div>
          </div>

          {/* Teacher Selection */}
          {role === 'TEACHER' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                መምህር ይምረጡ
              </label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 bg-slate-50 font-medium cursor-pointer"
              >
                {teachers.filter(t => !t.includes('—')).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Student ID & Program input */}
          {role === 'STUDENT' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  የትምህርት ፕሮግራም
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStudentProgram('Diploma')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      studentProgram === 'Diploma'
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                        : 'bg-slate-50 border-slate-300 text-slate-600'
                    }`}
                  >
                    ዲፕሎማ (Diploma)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentProgram('Degree')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      studentProgram === 'Degree'
                        ? 'bg-indigo-100 border-indigo-500 text-indigo-900'
                        : 'bg-slate-50 border-slate-300 text-slate-600'
                    }`}
                  >
                    ድግሪ (Degree)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  የተማሪ መለያ ኮድ (Student ID No)
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="የተማሪ መለያ ቁጥርዎን ያስገቡ"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 bg-slate-50 font-mono tracking-wider font-semibold"
                  required
                />
              </div>
            </div>
          )}

          {/* Password Input for all roles */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              የይለፍ ቃል (Password)
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 bg-slate-50 font-mono"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-900 hover:to-emerald-800 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-sm gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>ወደ ሲስተሙ ግባ</span>
          </button>

          {/* Firebase Connection Quick Info */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onOpenFirebaseModal}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                firebaseReport?.status === 'connected'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : isTestingFirebase
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>
                Firebase Cloud ሁኔታ፦{' '}
                {firebaseReport?.status === 'connected'
                  ? 'ተገናኝቷል (Connected)'
                  : isTestingFirebase
                  ? 'በመፈተሽ ላይ...'
                  : 'አልተገናኘም (ምክንያቱን እይ)'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

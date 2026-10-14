import React, { useRef, useState } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  Key,
  GraduationCap,
  Download,
  Upload,
  RotateCcw,
  Users,
  BookOpen,
  Award,
  CheckCircle2,
  FileSpreadsheet,
  Edit,
  Trash2,
  Cloud,
  RefreshCw,
  UploadCloud,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';
import { GradingScaleItem, Student, Course, GradeBreakdown } from '../types.ts';
import { OFFICIAL_GRADING_SCALE } from '../data/initialData.ts';
import { FirebaseConnectionReport } from '../services/firebaseSync.ts';
import { DEFAULT_CHURCH_LOGO } from '../assets/logo.ts';

interface AdminPortalProps {
  systemLocked: boolean;
  onToggleLock: () => void;
  userPasswords: Record<string, string>;
  onOpenPasswordModal: (userKey: string, displayName: string) => void;
  students: Student[];
  courses: Course[];
  teachers: string[];
  grades: Record<string, GradeBreakdown>;
  currentYear: string;
  currentSemester: string;
  gradePublished: boolean;
  onToggleGradePublication: () => void;
  onExportData: () => void;
  onImportData: (jsonData: string) => void;
  onResetDefaults: () => void;
  onSelectPrintTranscript: (student: Student) => void;
  onSwitchView: (view: 'ADMIN' | 'DEAN' | 'REGISTRAR' | 'TEACHER' | 'STUDENT') => void;
  firebaseReport: FirebaseConnectionReport | null;
  isTestingFirebase: boolean;
  onTestFirebaseConnection: () => Promise<void>;
  onOpenFirebaseModal: () => void;
  onPushAllToFirebase: () => Promise<void>;
  churchLogo: string;
  onUpdateChurchLogo: (newLogo: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  systemLocked,
  onToggleLock,
  userPasswords,
  onOpenPasswordModal,
  students,
  courses,
  teachers,
  grades,
  currentYear,
  currentSemester,
  gradePublished,
  onToggleGradePublication,
  onExportData,
  onImportData,
  onResetDefaults,
  onSelectPrintTranscript,
  onSwitchView,
  firebaseReport,
  isTestingFirebase,
  onTestFirebaseConnection,
  onOpenFirebaseModal,
  onPushAllToFirebase,
  churchLogo,
  onUpdateChurchLogo
}) => {
  const [adminTab, setAdminTab] = useState<'security' | 'courses' | 'students' | 'teachers'>('security');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportData(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateChurchLogo(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const coreRoles = [
    { key: 'admin', name: 'አድሚን (Admin)', username: 'admin' },
    { key: 'dean', name: 'ዋና ዲን (Academic Dean)', username: 'dean' },
    { key: 'registrar', name: 'ሪጅስተራል (Registrar)', username: 'registrar' }
  ];

  return (
    <div className="space-y-6 no-print">
      {/* Top Banner & Maintenance Mode */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-7 h-7 text-emerald-800" />
            <span>የአድሚን ጠቅላይ መቆጣጠሪያ ፖርታል (Super Admin Hub)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ሁሉንም ሌሎች ገጾች (ዲን፣ ሪጅስተራል፣ መምህራን እና ተማሪዎች) ሙሉ በሙሉ የመቆጣጠርና የማስተዳደር ስልጣን
          </p>
        </div>

        {/* Lock Switch */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            {systemLocked ? <Lock className="w-4 h-4 text-rose-600" /> : <Unlock className="w-4 h-4 text-emerald-600" />}
            <span>የጥገና ሁነታ (Maintenance Lock):</span>
          </div>
          <button
            onClick={onToggleLock}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
              systemLocked
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {systemLocked ? 'ተቆልፏል (LOCKED)' : 'ክፍት ነው (ACTIVE)'}
          </button>
        </div>
      </div>

      {/* Quick Access to other portals bar */}
      <div className="bg-gradient-to-r from-emerald-950 to-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md">
        <div>
          <h4 className="font-bold text-xs text-amber-300">በቀጥታ ወደ ሌሎች ፖርታሎች ገብተው ያስተዳድሩ፦</h4>
          <p className="text-[11px] text-emerald-200">አድሚን ወደ ማንኛውም ገጽ ገብቶ ማረም፣ ማስተካከልና ማዘዝ ይችላል</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSwitchView('DEAN')}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            🎓 የዋና ዲን ገጽ
          </button>
          <button
            onClick={() => onSwitchView('REGISTRAR')}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            📑 የሪጅስተራል ገጽ
          </button>
          <button
            onClick={() => onSwitchView('TEACHER')}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            📖 የመምህራን ገጽ
          </button>
          <button
            onClick={() => onSwitchView('STUDENT')}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            👨‍🎓 የተማሪዎች ገጽ
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setAdminTab('security')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            adminTab === 'security'
              ? 'border-emerald-700 text-emerald-800 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Key className="w-4 h-4 text-amber-500" />
          <span>የደህንነትና የመግቢያ ቁልፎች</span>
        </button>

        <button
          onClick={() => setAdminTab('courses')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            adminTab === 'courses'
              ? 'border-emerald-700 text-emerald-800 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>የትምህርት ሰሌዳና መምህራን ({courses.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('students')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            adminTab === 'students'
              ? 'border-emerald-700 text-emerald-800 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-700" />
          <span>የተማሪዎች ማህደርና ቁልፎች ({students.length})</span>
        </button>
      </div>

      {/* TAB 1: Security & Passwords */}
      {adminTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-700" />
                <span>የስርዓቱ ዋና ተጠቃሚዎች የይለፍ ቃል</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">የተጠቃሚ መለያዎች</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] rounded-lg">
                  <tr>
                    <th className="p-3">ተጠቃሚ / ሚና</th>
                    <th className="p-3">የመግቢያ ስም</th>
                    <th className="p-3">የአሁኑ ቁልፍ</th>
                    <th className="p-3 text-right">ተግባር</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coreRoles.map((item) => (
                    <tr key={item.key} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-800">{item.name}</td>
                      <td className="p-3 font-mono text-xs text-slate-600">{item.username}</td>
                      <td className="p-3 font-mono text-xs text-emerald-800 font-bold">
                        •••••• ({userPasswords[item.key] || '---'})
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onOpenPasswordModal(item.key, item.name)}
                          className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] px-3 py-1.5 rounded-lg font-bold shadow-sm transition-colors cursor-pointer"
                        >
                          <Key className="w-3 h-3" />
                          <span>ቁልፍ ቀይር</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Backup, Export and Reset Controls */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  የመረጃ ጥበቃና አስተዳደር (Local Backup & Data Management)
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={onExportData}
                    className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs px-3.5 py-2 rounded-xl font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>መረጃ ወደ ኮምፒውተር አስቀምጥ (Export JSON)</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-3.5 py-2 rounded-xl font-bold border border-slate-300 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>የተቀመጠ መረጃ አንብብ (Import JSON)</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />

                  <button
                    onClick={onResetDefaults}
                    className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs px-3.5 py-2 rounded-xl font-bold border border-rose-200 transition-colors ml-auto cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    <span>ወደ ነባሪ መልስ (Reset Defaults)</span>
                  </button>
                </div>
              </div>

              {/* Firebase Cloud Firestore Sync Card */}
              <div className="bg-gradient-to-r from-emerald-50 via-slate-50 to-amber-50 p-4 rounded-2xl border border-emerald-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-emerald-700 text-white rounded-xl shadow-xs">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span>Firebase Cloud Firestore ዳታቤዝ</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            firebaseReport?.status === 'connected'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isTestingFirebase
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {firebaseReport?.status === 'connected'
                            ? '● ተገናኝቷል (Connected)'
                            : isTestingFirebase
                            ? '◌ በመፈተሽ ላይ...'
                            : '● አልተገናኘም (Not Connected)'}
                        </span>
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {firebaseReport?.message || 'ሁሉንም የተማሪዎች፣ ኮርሶች እና ውጤቶች መረጃ ወደ Cloud Firestore ያመሳስላል'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={onTestFirebaseConnection}
                      disabled={isTestingFirebase}
                      className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-xl font-bold border border-slate-300 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingFirebase ? 'animate-spin' : ''}`} />
                      <span>{isTestingFirebase ? 'በመፈተሽ ላይ...' : 'ግንኙነት ፈትሽ'}</span>
                    </button>

                    <button
                      onClick={onOpenFirebaseModal}
                      className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3 py-1.5 rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>ዝርዝርና መፍትሔዎች</span>
                    </button>

                    {firebaseReport?.status === 'connected' && (
                      <button
                        onClick={onPushAllToFirebase}
                        className="inline-flex items-center gap-1 bg-indigo-700 hover:bg-indigo-800 text-white text-xs px-3 py-1.5 rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>ወደ Cloud ላክ</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Church Logo Management Card */}
              <div className="bg-gradient-to-r from-amber-50/70 via-slate-50 to-emerald-50/70 p-4 rounded-2xl border border-amber-200/90">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-2xl bg-white p-1.5 border border-amber-300 shadow-sm flex items-center justify-center flex-shrink-0">
                      <img
                        src={churchLogo || DEFAULT_CHURCH_LOGO}
                        alt="የቤተ ክርስቲያን አርማ"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-amber-600" />
                        <span>የቤተ ክርስቲያኑ ይፋዊ አርማና ሎጎ (Church Official Logo)</span>
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ይህ ሎጎ በዋናው አርዕስት (Header)፣ በመግቢያ ገጽ (Login) እና በሁሉም ተማሪዎች ትራንስክሪፕት ላይ ይታያል።
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>አዲስ ሎጎ ጫን (Upload Logo)</span>
                    </button>

                    <button
                      onClick={() => onUpdateChurchLogo(DEFAULT_CHURCH_LOGO)}
                      className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs px-3 py-2 rounded-xl font-bold border border-slate-300 transition-colors cursor-pointer"
                      title="ወደ መጀመሪያው ይፋዊ አርማ መልስ"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>ነባሪ አርማ (Reset)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Official 13-Tier Grading Scale Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-800">
                  ይፋዊ የ13-ደረጃ ውጤት መስፈርት
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Official 13-Tier Grading Scale
              </p>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-xs text-slate-700">
                  <thead className="bg-slate-100 sticky top-0 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2 text-left">የውጤት መጠን (%)</th>
                      <th className="p-2 text-center">ፊደል</th>
                      <th className="p-2 text-right">ነጥብ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {OFFICIAL_GRADING_SCALE.map((g) => (
                      <tr key={g.letter} className="hover:bg-slate-50">
                        <td className="p-2 font-medium">
                          {g.min === 97 ? '97% – 100%' : g.min === 0 ? '0% – 59%' : `${g.min}% – ${g.max}%`}
                        </td>
                        <td className="p-2 text-center font-black text-emerald-800">{g.letter}</td>
                        <td className="p-2 text-right font-bold font-mono">{g.points.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900">
              <p className="font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                <span>አድሚን ሁሉንም የተማሪ ውጤቶች፣ ኮርሶችና ቁልፎች የመቆጣጠር ሙሉ ስልጣን አለው።</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Courses */}
      {adminTab === 'courses' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-700" />
              <span>የኮርሶች የቀን ሰሌዳና የመምህራን ድልድል ({courses.length})</span>
            </h3>
            <button
              onClick={() => onSwitchView('DEAN')}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl cursor-pointer"
            >
              በዋና ዲን ገጽ አስተዳድር
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-3">ተ.ቁ</th>
                  <th className="p-3">ፕሮግራም</th>
                  <th className="p-3">ቀን / ሰሌዳ</th>
                  <th className="p-3">የኮርስ ስም</th>
                  <th className="p-3">የተመደበ መምህር</th>
                  <th className="p-3 text-center">ክሬዲት</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.program === 'Degree' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {c.program}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-amber-900 bg-amber-50/50 rounded">{c.schedule}</td>
                    <td className="p-3 font-bold text-slate-900">{c.name}</td>
                    <td className="p-3 font-semibold text-slate-700">{c.teacher}</td>
                    <td className="p-3 text-center font-mono font-bold text-amber-700">{c.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Students & Individual Passwords */}
      {adminTab === 'students' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                <span>የተማሪዎች ማህደር፣ ውጤት እና የግል የይለፍ ቃሎች ({students.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                አድሚን የማንኛውንም ተማሪ የግል መግቢያ ቁልፍ መቀየርና ትራንስክሪፕት ማዘጋጀት ይችላል
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 sticky top-0 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-2.5">ተ.ቁ</th>
                  <th className="p-2.5">ID</th>
                  <th className="p-2.5">የተማሪ ስም</th>
                  <th className="p-2.5">ጾታ</th>
                  <th className="p-2.5">ፕሮግራም</th>
                  <th className="p-2.5">የግል ቁልፍ</th>
                  <th className="p-2.5 text-right">ተግባር</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s, idx) => (
                  <tr key={s.uid} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-bold text-slate-800">{s.id}</td>
                    <td className="p-2.5 font-bold text-slate-900">{s.name}</td>
                    <td className="p-2.5 text-slate-600">{s.gender}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.program === 'Degree' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {s.program}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-xs text-emerald-800 font-bold">
                      •••••• ({userPasswords[s.uid] || s.id})
                    </td>
                    <td className="p-2.5 text-right space-x-1 space-x-reverse">
                      <button
                        onClick={() => onOpenPasswordModal(s.uid, s.name)}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                        title="ቁልፍ ቀይር"
                      >
                        ቁልፍ ቀይር
                      </button>
                      <button
                        onClick={() => onSelectPrintTranscript(s)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                        title="ትራንስክሪፕት"
                      >
                        ትራንስክሪፕት
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

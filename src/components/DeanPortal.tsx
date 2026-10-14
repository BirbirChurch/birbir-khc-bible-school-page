import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  EyeOff,
  Trophy,
  Calendar,
  Key,
  Download,
  Users,
  Eye,
  Printer,
  UserPlus,
  Save
} from 'lucide-react';
import { Course, GradeBreakdown, ProgramType, Student } from '../types.ts';
import { calculateGradeDetails, calculateStudentGPA, getGradeKey } from '../utils/gradeCalculations.ts';

interface DeanPortalProps {
  currentYear: string;
  currentSemester: string;
  onYearChange: (year: string) => void;
  onSemesterChange: (sem: string) => void;
  availableYears: string[];
  onAddAcademicYear: (year: string) => void;
  gradePublished: boolean;
  onToggleGradePublication: () => void;
  courses: Course[];
  students: Student[];
  teachers: string[];
  grades: Record<string, GradeBreakdown>;
  onAddTeacher: (teacherName: string) => void;
  onOpenAddCourse: () => void;
  onOpenEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onOpenAddStudent: () => void;
  onDeleteStudent: (studentUid: string) => void;
  onSaveGrades: (updatedGrades: Record<string, GradeBreakdown>) => void;
  onSelectPrintTranscript: (student: Student) => void;
  showNotify: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const DeanPortal: React.FC<DeanPortalProps> = ({
  currentYear,
  currentSemester,
  onYearChange,
  onSemesterChange,
  availableYears,
  onAddAcademicYear,
  gradePublished,
  onToggleGradePublication,
  courses,
  students,
  teachers,
  grades,
  onAddTeacher,
  onOpenAddCourse,
  onOpenEditCourse,
  onDeleteCourse,
  onOpenAddStudent,
  onDeleteStudent,
  onSaveGrades,
  onSelectPrintTranscript,
  showNotify
}) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'supervision' | 'transcripts' | 'teachers'>('courses');
  const [courseProgramFilter, setCourseProgramFilter] = useState<'ALL' | ProgramType>('ALL');
  const [newYearInput, setNewYearInput] = useState('');
  const [showAddYearModal, setShowAddYearModal] = useState(false);

  // New Teacher Modal
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');

  // Grade supervision view & edit
  const [superviseCourseId, setSuperviseCourseId] = useState<string>(courses[0]?.id || '');
  const [editingGradeMatrix, setEditingGradeMatrix] = useState<Record<string, GradeBreakdown>>({});

  // Sync supervision matrix when course changes
  React.useEffect(() => {
    const course = courses.find((c) => c.id === superviseCourseId);
    if (!course) return;
    const enrolled = students.filter((s) => s.program === course.program);
    const initial: Record<string, GradeBreakdown> = {};
    enrolled.forEach((s) => {
      const key = getGradeKey(s.uid, course.id, currentYear, currentSemester);
      initial[s.uid] = grades[key] || { p1: 0, p2: 0, mid: 0, final: 0, att: 0 };
    });
    setEditingGradeMatrix(initial);
  }, [superviseCourseId, courses, students, grades, currentYear, currentSemester]);

  const filteredCourses = courses.filter((c) => {
    if (courseProgramFilter === 'ALL') return true;
    return c.program === courseProgramFilter;
  });

  const selectedSupervisedCourse = courses.find((c) => c.id === superviseCourseId) || courses[0];
  const supervisedStudents = selectedSupervisedCourse
    ? students.filter((s) => s.program === selectedSupervisedCourse.program)
    : [];

  const handleCreateYear = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newYearInput.trim();
    if (!clean) return;
    if (availableYears.includes(clean)) {
      showNotify(`የትምህርት ዘመን ${clean} አስቀድሞ አለ!`, 'warning');
      return;
    }
    onAddAcademicYear(clean);
    onYearChange(clean);
    setNewYearInput('');
    setShowAddYearModal(false);
    showNotify(`አዲስ የትምህርት ዘመን (${clean} ዓ.ም) ተጨምሯል!`, 'success');
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTeacherName.trim();
    if (!clean) return;
    if (teachers.includes(clean)) {
      showNotify('ይህ መምህር አስቀድሞ ተመዝግቧል!', 'warning');
      return;
    }
    onAddTeacher(clean);
    setNewTeacherName('');
    setShowAddTeacherModal(false);
    showNotify(`አዲስ መምህር "${clean}" በስኬት ተመዝግቧል!`, 'success');
  };

  const handleDeanGradeChange = (studentUid: string, field: keyof GradeBreakdown, val: string, maxVal: number) => {
    const num = Math.min(maxVal, Math.max(0, parseFloat(val) || 0));
    setEditingGradeMatrix((prev) => ({
      ...prev,
      [studentUid]: {
        ...(prev[studentUid] || { p1: 0, p2: 0, mid: 0, final: 0, att: 0 }),
        [field]: num
      }
    }));
  };

  const handleSaveDeanGrades = () => {
    if (!selectedSupervisedCourse) return;
    const updated = { ...grades };
    supervisedStudents.forEach((s) => {
      const key = getGradeKey(s.uid, selectedSupervisedCourse.id, currentYear, currentSemester);
      updated[key] = editingGradeMatrix[s.uid] || { p1: 0, p2: 0, mid: 0, final: 0, att: 0 };
    });
    onSaveGrades(updated);
    showNotify('የተስተካከሉት ውጤቶች በስኬት ተመዝግበዋል!', 'success');
  };

  // Download course grades as CSV
  const handleDownloadCourseGrades = (course: Course) => {
    const enrolled = students.filter((s) => s.program === course.program);
    let csv = `\uFEFFተ.ቁ,መለያ ቁጥር (ID),የተማሪ ስም,ጾታ,ክፍል 1 (20%),ክፍል 2 (20%),ሚድ ፈተና (30%),ፋይናል (20%),ተሳትፎ (10%),ድምር (100%),የውጤት ፊደል,ነጥብ\n`;

    enrolled.forEach((s, idx) => {
      const key = getGradeKey(s.uid, course.id, currentYear, currentSemester);
      const g = grades[key] || { p1: 0, p2: 0, mid: 0, final: 0, att: 0 };
      const total = (g.p1 || 0) + (g.p2 || 0) + (g.mid || 0) + (g.final || 0) + (g.att || 0);
      const gd = calculateGradeDetails(total);

      csv += `${idx + 1},"${s.id}","${s.name}","${s.gender}",${g.p1 || 0},${g.p2 || 0},${g.mid || 0},${g.final || 0},${g.att || 0},${total},"${gd.letter}",${gd.points.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ውጤት_${course.name}_${course.program}_${currentYear}_${currentSemester}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotify(`የ${course.name} ውጤት CSV ፋይል ዳውንሎድ ተደርጓል!`, 'success');
  };

  // Rank Top Performers
  const getTopStudents = (prog: ProgramType) => {
    return students
      .filter((s) => s.program === prog)
      .map((s) => ({
        ...s,
        gpa: parseFloat(calculateStudentGPA(s, courses, grades, currentYear, currentSemester))
      }))
      .sort((a, b) => b.gpa - a.gpa)
      .slice(0, 3);
  };

  const topDegree = getTopStudents('Degree');
  const topDiploma = getTopStudents('Diploma');

  return (
    <div className="space-y-6 no-print">
      {/* Top Dean Controls */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-7 h-7 text-emerald-800" />
            <span>የዋና ዲን (Academic Dean) ፖርታል</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            የትምህርት ዘመን፣ የኮርሶችና የመምህራን ምደባ፣ የውጤት ማጽደቂያ፣ እና ይፋዊ ትራንስክሪፕት ማዘጋጃ
          </p>
        </div>

        {/* Academic Year, Semester & Grade Publish */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year select + Add year */}
          <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-300 rounded-xl px-3 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-amber-700" />
            <label className="text-xs font-bold text-amber-900">የትምህርት ዘመን:</label>
            <select
              value={currentYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="text-xs font-bold bg-transparent text-amber-900 focus:outline-none cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y} className="text-slate-800">
                  {y} ዓ.ም
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowAddYearModal(true)}
              className="ml-1 p-1 rounded-md bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-xs cursor-pointer"
              title="አዲስ የትምህርት ዘመን ጨምር"
            >
              <Plus className="w-3 h-3 inline" />
            </button>
          </div>

          {/* Semester select */}
          <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-300 rounded-xl px-3 py-1.5 shadow-xs">
            <label className="text-xs font-bold text-amber-900">ሴሚስተር:</label>
            <select
              value={currentSemester}
              onChange={(e) => onSemesterChange(e.target.value)}
              className="text-xs font-bold bg-transparent text-amber-900 focus:outline-none cursor-pointer"
            >
              <option value="1" className="text-slate-800">1ኛ ሴሚስተር</option>
              <option value="2" className="text-slate-800">2ኛ ሴሚስተር</option>
            </select>
          </div>

          {/* Grade Approval / Publish Button */}
          <button
            onClick={onToggleGradePublication}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
              gradePublished
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {gradePublished ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>ውጤት ጸድቋል / ይፋ ሆኗል</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                <span>ውጤት ለማጽደቅ በመጠባበቅ ላይ (Hidden)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dean Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('courses')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'courses'
              ? 'border-emerald-700 text-emerald-800 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>የኮርሶች ድልድልና የቀን ሰሌዳ ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('supervision')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'supervision'
              ? 'border-emerald-700 text-emerald-800 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Eye className="w-4 h-4 text-indigo-600" />
          <span>የመምህራን ውጤት መቆጣጠሪያና ማረሚያ</span>
        </button>

        <button
          onClick={() => setActiveTab('transcripts')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'transcripts'
              ? 'border-emerald-700 text-emerald-800 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Printer className="w-4 h-4 text-amber-600" />
          <span>ትራንስክሪፕት ማዘጋጃ ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('teachers')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'teachers'
              ? 'border-emerald-700 text-emerald-800 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-700" />
          <span>የመምህራን ዝርዝር ({teachers.filter(t => !t.includes('—')).length})</span>
        </button>
      </div>

      {/* TAB 1: Course Allocations & Schedule */}
      {activeTab === 'courses' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-800" />
              <h3 className="text-base font-bold text-slate-800">
                የኮርስ ድልድል፣ መምህራን እና የቀን ሰሌዳ ({filteredCourses.length})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setCourseProgramFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    courseProgramFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ሁሉም ({courses.length})
                </button>
                <button
                  onClick={() => setCourseProgramFilter('Degree')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    courseProgramFilter === 'Degree' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ድግሪ ({courses.filter(c => c.program === 'Degree').length})
                </button>
                <button
                  onClick={() => setCourseProgramFilter('Diploma')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    courseProgramFilter === 'Diploma' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ዲፕሎማ ({courses.filter(c => c.program === 'Diploma').length})
                </button>
              </div>

              <button
                onClick={onOpenAddCourse}
                className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs px-3.5 py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>አዲስ የትምህርት ዓይነት ጨምር</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] rounded-lg">
                <tr>
                  <th className="p-3">ተ/ቁ</th>
                  <th className="p-3">ፕሮግራም</th>
                  <th className="p-3">ቀን / የጊዜ ሰሌዳ</th>
                  <th className="p-3">የኮርስ ዓይነት</th>
                  <th className="p-3">የተመደበ መምህር</th>
                  <th className="p-3 text-center">ክሬዲት</th>
                  <th className="p-3 text-right">ተግባር</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-semibold">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          c.program === 'Degree'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.program === 'Degree' ? 'ድግሪ' : 'ዲፕሎማ'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-amber-900 bg-amber-50/40 rounded">
                      {c.schedule || 'አልተወሰነም'}
                    </td>
                    <td className="p-3 font-bold text-slate-800">{c.name}</td>
                    <td className="p-3 font-semibold text-slate-700">
                      {c.teacher === 'አልተመደበም (—)' ? (
                        <span className="text-slate-400 italic">አልተመደበም (—)</span>
                      ) : (
                        c.teacher
                      )}
                    </td>
                    <td className="p-3 text-center font-black text-amber-700 font-mono text-sm">
                      {c.credits}
                    </td>
                    <td className="p-3 text-right space-x-1 space-x-reverse">
                      <button
                        onClick={() => handleDownloadCourseGrades(c)}
                        className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="ውጤት አውርድ (CSV)"
                      >
                        <Download className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => onOpenEditCourse(c)}
                        className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="አስተካክል"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => onDeleteCourse(c.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="ሰርዝ"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Grade Supervision, Editing & Approval */}
      {activeTab === 'supervision' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-700" />
                <span>የመምህራን ውጤት መቆጣጠሪያ፣ ማረሚያ እና ማጽደቂያ</span>
              </h3>
              <p className="text-xs text-slate-500">
                ዲን የሁሉም መምህራንን ውጤት በቀጥታ ማየት፣ ማስተካከልና ማረም ይችላል
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={superviseCourseId}
                onChange={(e) => setSuperviseCourseId(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-600"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.program}] {c.name} — {c.teacher}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSaveDeanGrades}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>ለውጦችን መዝግብ</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100/80 sticky top-0 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">ID</th>
                  <th className="p-2.5">የተማሪ ስም</th>
                  <th className="p-2.5 text-center w-20">ክፍል 1 (20)</th>
                  <th className="p-2.5 text-center w-20">ክፍል 2 (20)</th>
                  <th className="p-2.5 text-center w-20">ሚድ (30)</th>
                  <th className="p-2.5 text-center w-20">ፋይናል (20)</th>
                  <th className="p-2.5 text-center w-20">ተሳትፎ (10)</th>
                  <th className="p-2.5 text-center">ድምር (100)</th>
                  <th className="p-2.5 text-center">ፊደል</th>
                  <th className="p-2.5 text-center">ነጥብ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supervisedStudents.map((s) => {
                  const g = editingGradeMatrix[s.uid] || { p1: 0, p2: 0, mid: 0, final: 0, att: 0 };
                  const total = (g.p1 || 0) + (g.p2 || 0) + (g.mid || 0) + (g.final || 0) + (g.att || 0);
                  const gd = calculateGradeDetails(total);

                  return (
                    <tr key={s.uid} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-800">{s.id}</td>
                      <td className="p-2.5 font-bold text-slate-900">{s.name}</td>
                      <td className="p-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={g.p1}
                          onChange={(e) => handleDeanGradeChange(s.uid, 'p1', e.target.value, 20)}
                          className="w-14 px-1 py-0.5 text-center font-mono text-xs border rounded bg-white"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={g.p2}
                          onChange={(e) => handleDeanGradeChange(s.uid, 'p2', e.target.value, 20)}
                          className="w-14 px-1 py-0.5 text-center font-mono text-xs border rounded bg-white"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          step="0.5"
                          value={g.mid}
                          onChange={(e) => handleDeanGradeChange(s.uid, 'mid', e.target.value, 30)}
                          className="w-14 px-1 py-0.5 text-center font-mono text-xs border rounded bg-white"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={g.final}
                          onChange={(e) => handleDeanGradeChange(s.uid, 'final', e.target.value, 20)}
                          className="w-14 px-1 py-0.5 text-center font-mono text-xs border rounded bg-white"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={g.att}
                          onChange={(e) => handleDeanGradeChange(s.uid, 'att', e.target.value, 10)}
                          className="w-14 px-1 py-0.5 text-center font-mono text-xs border rounded bg-white"
                        />
                      </td>
                      <td className="p-2.5 text-center font-black font-mono text-emerald-800">{total}</td>
                      <td className="p-2.5 text-center font-black text-amber-700">{gd.letter}</td>
                      <td className="p-2.5 text-center font-bold font-mono">{gd.points.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Direct Transcript Printing for Degree & Diploma */}
      {activeTab === 'transcripts' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-600" />
                <span>የትራንስክሪፕት ማዘጋጃና ማተሚያ (Transcript Preparation)</span>
              </h3>
              <p className="text-xs text-slate-500">
                ዋና ዲን የድግሪም ሆነ የዲፕሎማ ተማሪዎችን ይፋዊ ትራንስክሪፕት በቀጥታ ማዘጋጀትና ማተም ይችላል
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-2.5">ተ.ቁ</th>
                  <th className="p-2.5">መለያ ቁጥር (ID)</th>
                  <th className="p-2.5">የተማሪ ስም</th>
                  <th className="p-2.5">ፕሮግራም</th>
                  <th className="p-2.5 text-center">ሴሚስተር GPA</th>
                  <th className="p-2.5 text-right">ትራንስክሪፕት</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s, idx) => {
                  const gpa = calculateStudentGPA(s, courses, grades, currentYear, currentSemester);
                  return (
                    <tr key={s.uid} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-800">{s.id}</td>
                      <td className="p-2.5 font-bold text-slate-900">{s.name}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.program === 'Degree' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {s.program}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-black text-amber-700 font-mono">{gpa}</td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => onSelectPrintTranscript(s)}
                          className="bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] px-3 py-1.5 rounded-lg font-bold shadow-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>ትራንስክሪፕት አትም</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Manage Teachers */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-800" />
                <span>የመምህራን ማህደርና ምደባ</span>
              </h3>
              <p className="text-xs text-slate-500">
                አዳዲስ መምህራንን መመዝገብና ለኮርሶች መመደብ
              </p>
            </div>

            <button
              onClick={() => setShowAddTeacherModal(true)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>አዲስ መምህር ጨምር</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {teachers.filter(t => !t.includes('—')).map((t, idx) => {
              const assignedCount = courses.filter(c => c.teacher === t).length;
              return (
                <div key={t} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-xs text-slate-900">{t}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">የተመደቡ ኮርሶች: <strong>{assignedCount}</strong></p>
                  </div>
                  <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Performers Ranking */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-6 h-6 text-amber-500" />
          <div>
            <h3 className="text-base font-bold text-slate-800">
              የሴሚስተሩ ከፍተኛ ውጤት ያመጡ ተማሪዎች (Top Performers)
            </h3>
            <p className="text-xs text-slate-500">
              የትምህርት ዘመን {currentYear} ዓ.ም | {currentSemester}ኛ ሴሚስተር
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center justify-between pb-2 border-b border-indigo-200">
              <span>የድግሪ ፕሮግራም (Degree)</span>
              <span className="text-[11px] font-normal text-indigo-700">Top 3</span>
            </h4>
            <div className="space-y-2.5">
              {topDegree.map((s, idx) => (
                <div
                  key={s.uid}
                  className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800 font-black'
                          : 'bg-amber-700 text-white font-black'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{s.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {s.id}</p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-xs text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                    GPA: {s.gpa.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3 flex items-center justify-between pb-2 border-b border-emerald-200">
              <span>የዲፕሎማ ፕሮግራም (Diploma)</span>
              <span className="text-[11px] font-normal text-emerald-700">Top 3</span>
            </h4>
            <div className="space-y-2.5">
              {topDiploma.map((s, idx) => (
                <div
                  key={s.uid}
                  className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800 font-black'
                          : 'bg-amber-700 text-white font-black'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{s.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {s.id}</p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-xs text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    GPA: {s.gpa.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Academic Year Modal */}
      {showAddYearModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-800">አዲስ የትምህርት ዘመን ጨምር</h3>
            <form onSubmit={handleCreateYear} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  የትምህርት ዘመን (በኢትዮጵያ ካላንደር ዓ.ም)
                </label>
                <input
                  type="text"
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(e.target.value)}
                  placeholder="ምሳሌ: 2031"
                  required
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs font-bold focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddYearModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold border rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  ሰርዝ
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer"
                >
                  አክል
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Teacher Modal */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-800">አዲስ መምህር መመዝገቢያ</h3>
            <form onSubmit={handleCreateTeacher} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  የመምህሩ ሙሉ ስም (ከነ ማዕረጉ)
                </label>
                <input
                  type="text"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="ምሳሌ: መ/ር ዮሐንስ አበበ ወይም ፓ/ር..."
                  required
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs font-bold focus:ring-2 focus:ring-emerald-700"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold border rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  ሰርዝ
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg cursor-pointer"
                >
                  መዝግብ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

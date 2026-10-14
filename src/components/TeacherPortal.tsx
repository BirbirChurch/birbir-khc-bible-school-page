import React, { useState, useEffect } from 'react';
import { GraduationCap, Save, BookOpen, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { Course, GradeBreakdown, Student } from '../types.ts';
import { calculateGradeDetails, getGradeKey } from '../utils/gradeCalculations.ts';
import { OFFICIAL_GRADING_SCALE } from '../data/initialData.ts';

interface TeacherPortalProps {
  teacherName: string;
  courses: Course[];
  students: Student[];
  grades: Record<string, GradeBreakdown>;
  currentYear: string;
  currentSemester: string;
  onSaveGrades: (updatedGrades: Record<string, GradeBreakdown>) => void;
  showNotify: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  teacherName,
  courses,
  students,
  grades,
  currentYear,
  currentSemester,
  onSaveGrades,
  showNotify
}) => {
  const teacherCourses = courses.filter((c) => c.teacher === teacherName);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(teacherCourses[0]?.id || '');
  const [localGrades, setLocalGrades] = useState<Record<string, GradeBreakdown>>({});

  useEffect(() => {
    if (teacherCourses.length > 0 && (!selectedCourseId || !teacherCourses.some(c => c.id === selectedCourseId))) {
      setSelectedCourseId(teacherCourses[0].id);
    }
  }, [teacherCourses, selectedCourseId]);

  // Sync initial local grades for this course
  useEffect(() => {
    const course = courses.find((c) => c.id === selectedCourseId);
    if (!course) return;

    const enrolled = students.filter((s) => s.program === course.program);
    const initial: Record<string, GradeBreakdown> = {};

    enrolled.forEach((s) => {
      const key = getGradeKey(s.uid, course.id, currentYear, currentSemester);
      const existing = grades[key] || { p1: 0, p2: 0, mid: 0, final: 0, att: 0 };
      initial[s.uid] = { ...existing };
    });

    setLocalGrades(initial);
  }, [selectedCourseId, courses, students, grades, currentYear, currentSemester]);

  const activeCourse = courses.find((c) => c.id === selectedCourseId);
  const enrolledStudents = activeCourse ? students.filter((s) => s.program === activeCourse.program) : [];

  const handleInputChange = (
    studentUid: string,
    field: keyof GradeBreakdown,
    val: string,
    maxVal: number
  ) => {
    const parsed = Math.min(maxVal, Math.max(0, parseFloat(val) || 0));
    setLocalGrades((prev) => ({
      ...prev,
      [studentUid]: {
        ...(prev[studentUid] || { p1: 0, p2: 0, mid: 0, final: 0, att: 0 }),
        [field]: parsed
      }
    }));
  };

  const handleSaveAll = () => {
    if (!activeCourse) return;

    const updated = { ...grades };
    enrolledStudents.forEach((s) => {
      const key = getGradeKey(s.uid, activeCourse.id, currentYear, currentSemester);
      updated[key] = localGrades[s.uid] || { p1: 0, p2: 0, mid: 0, final: 0, att: 0 };
    });

    onSaveGrades(updated);
    showNotify('የሁሉም ተማሪዎች ውጤቶች በስኬት ተመዝግበዋል!', 'success');
  };

  // Live class statistics
  let totalScoreSum = 0;
  let gradedCount = 0;
  const gradeDistribution: Record<string, number> = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };

  enrolledStudents.forEach((s) => {
    const g = localGrades[s.uid] || { p1: 0, p2: 0, mid: 0, final: 0, att: 0 };
    const sum = (g.p1 || 0) + (g.p2 || 0) + (g.mid || 0) + (g.final || 0) + (g.att || 0);
    if (sum > 0) {
      totalScoreSum += sum;
      gradedCount++;
      const gd = calculateGradeDetails(sum);
      if (gradeDistribution[gd.letter] !== undefined) {
        gradeDistribution[gd.letter]++;
      }
    }
  });

  const classAverage = gradedCount > 0 ? (totalScoreSum / gradedCount).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 no-print">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-emerald-800" />
            <span>የመምህራን ውጤት መሙያ ገጽ</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            መምህር: <strong className="text-emerald-900 font-bold">{teacherName}</strong> | የትምህርት ዘመን {currentYear} ዓ.ም ({currentSemester}ኛ ሴሚስተር)
          </p>
        </div>

        {/* Course selection dropdown */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 rounded-2xl px-3.5 py-2">
          <BookOpen className="w-4 h-4 text-emerald-800" />
          <label className="text-xs font-bold text-emerald-900">የሚያስተምሩት ኮርስ:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="text-xs font-bold bg-transparent text-emerald-950 focus:outline-none cursor-pointer"
          >
            {teacherCourses.length === 0 ? (
              <option value="">የተመደበ ኮርስ የለም</option>
            ) : (
              teacherCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.program}] {c.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {teacherCourses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">ምንም የተመደበ ኮርስ አልተገኘም</h3>
          <p className="text-xs text-slate-500 mt-1">
            ዋና ዲን ኮርስ ሲመድቡሎት በዚህ ገጽ ላይ ተዘርዝረው ይታያሉ።
          </p>
        </div>
      ) : (
        <>
          {/* Active Course Schedule Card & Grade Legend Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                የተመደበ ኮርስና የቀን ሰሌዳ
              </span>
              <h4 className="text-lg font-extrabold text-white">{activeCourse?.name}</h4>
              <p className="text-xs text-emerald-200 flex items-center gap-1.5 font-semibold">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>ቀን: {activeCourse?.schedule || 'አልተወሰነም'}</span>
              </p>
              <div className="pt-2 flex justify-between text-xs text-slate-300 border-t border-emerald-800">
                <span>ፕሮግራም: <strong>{activeCourse?.program}</strong></span>
                <span>ተማሪዎች: <strong>{enrolledStudents.length}</strong></span>
              </div>
            </div>

            {/* Official Grading Scale Reference Card */}
            <div className="md:col-span-2 bg-amber-50/70 border border-amber-300 rounded-3xl p-5 space-y-2">
              <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-700" />
                <span>ይፋዊ የውጤት መስፈርት (Grading Scale):</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-800">
                <div className="bg-white p-1.5 rounded-lg border border-amber-200">
                  <strong className="text-emerald-700 font-bold">90% – 100%</strong> ➔ A+ (እጅግ በጣም ጥሩ)
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-amber-200">
                  <strong className="text-emerald-700 font-bold">80% – 89%</strong> ➔ A (በጣም ጥሩ)
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-amber-200">
                  <strong className="text-indigo-700 font-bold">70% – 79%</strong> ➔ B (ጥሩ)
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-amber-200">
                  <strong className="text-amber-700 font-bold">60% – 69%</strong> ➔ C (አልፏል)
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-amber-200">
                  <strong className="text-orange-700 font-bold">50% – 59%</strong> ➔ D (ዝቅተኛ / ማለፊያ)
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-amber-200">
                  <strong className="text-rose-700 font-bold">ከ 50% በታች</strong> ➔ F (ወድቋል)
                </div>
              </div>
            </div>
          </div>

          {/* Grade Entry Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  የተማሪዎች ውጤት ማስገቢያ ሰንጠረዥ: {activeCourse?.name} ({activeCourse?.program})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ክፍል 1 (20%) + ክፍል 2 (20%) + ሚድ ፈተና (30%) + ፋይናል (20%) + ተሳትፎ (10%) = ድምር (100%)
                </p>
              </div>

              <button
                onClick={handleSaveAll}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-4 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>ውጤቶችን መዝግብ (Save All)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] rounded-lg">
                  <tr>
                    <th className="p-2.5 border-b border-slate-200">ተ.ቁ</th>
                    <th className="p-2.5 border-b border-slate-200">ID No</th>
                    <th className="p-2.5 border-b border-slate-200">የተማሪ ስም</th>
                    <th className="p-2.5 border-b border-slate-200 text-center w-20">ክፍል 1 (20%)</th>
                    <th className="p-2.5 border-b border-slate-200 text-center w-20">ክፍል 2 (20%)</th>
                    <th className="p-2.5 border-b border-slate-200 text-center w-20">ሚድ (30%)</th>
                    <th className="p-2.5 border-b border-slate-200 text-center w-20">ፋይናል (20%)</th>
                    <th className="p-2.5 border-b border-slate-200 text-center w-20">ተሳትፎ (10%)</th>
                    <th className="p-2.5 border-b border-slate-200 text-center">ድምር (100%)</th>
                    <th className="p-2.5 border-b border-slate-200 text-center">ፊደል ደረጃ</th>
                    <th className="p-2.5 border-b border-slate-200 text-center">ትርጉም</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrolledStudents.map((s, idx) => {
                    const g = localGrades[s.uid] || { p1: 0, p2: 0, mid: 0, final: 0, att: 0 };
                    const total = (g.p1 || 0) + (g.p2 || 0) + (g.mid || 0) + (g.final || 0) + (g.att || 0);
                    const gd = calculateGradeDetails(total);

                    return (
                      <tr key={s.uid} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-800">{s.id}</td>
                        <td className="p-2.5 font-bold text-slate-900">{s.name}</td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={g.p1}
                            onChange={(e) => handleInputChange(s.uid, 'p1', e.target.value, 20)}
                            className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-slate-50"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={g.p2}
                            onChange={(e) => handleInputChange(s.uid, 'p2', e.target.value, 20)}
                            className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-slate-50"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            step="0.5"
                            value={g.mid}
                            onChange={(e) => handleInputChange(s.uid, 'mid', e.target.value, 30)}
                            className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-slate-50"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={g.final}
                            onChange={(e) => handleInputChange(s.uid, 'final', e.target.value, 20)}
                            className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-slate-50"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={g.att}
                            onChange={(e) => handleInputChange(s.uid, 'att', e.target.value, 10)}
                            className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-slate-50"
                          />
                        </td>
                        <td className="p-2.5 text-center font-black font-mono text-emerald-800 text-sm">
                          {total}
                        </td>
                        <td className="p-2.5 text-center font-black text-xs text-amber-700">
                          {gd.letter}
                        </td>
                        <td className="p-2.5 text-center text-[10px] font-semibold text-slate-500">
                          {gd.desc}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t flex justify-between items-center">
              <span className="text-xs text-slate-500 font-semibold">
                የክፍሉ አማካይ ውጤት: <strong className="text-slate-800">{classAverage}%</strong>
              </span>

              <button
                onClick={handleSaveAll}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>ውጤቶችን መዝግብ (Save All)</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

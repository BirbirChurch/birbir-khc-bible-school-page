import { OFFICIAL_GRADING_SCALE } from '../data/initialData.ts';
import { Course, GradeBreakdown, GradeDetail, Student } from '../types.ts';

export function calculateGradeDetails(score: number): GradeDetail {
  const num = Math.min(100, Math.max(0, Math.round((Number(score) || 0) * 10) / 10));
  const grade = OFFICIAL_GRADING_SCALE.find(g => num >= g.min && num <= g.max) 
    || OFFICIAL_GRADING_SCALE[OFFICIAL_GRADING_SCALE.length - 1];
  
  return {
    score: num,
    letter: grade.letter,
    points: grade.points,
    desc: grade.desc
  };
}

export function getGradeKey(studentUid: string, courseId: string, year: string, sem: string): string {
  return `${studentUid}_${courseId}_${year}_${sem}`;
}

export function calculateStudentGPA(
  student: Student,
  allCourses: Course[],
  gradesRecord: Record<string, GradeBreakdown>,
  year: string,
  sem: string
): string {
  const studentCourses = allCourses.filter(c => c.program === student.program);
  let totalQualityPoints = 0;
  let totalCredits = 0;

  studentCourses.forEach(course => {
    const key = getGradeKey(student.uid, course.id, year, sem);
    const breakdown = gradesRecord[key];
    if (breakdown) {
      const sum = (breakdown.p1 || 0) + (breakdown.p2 || 0) + (breakdown.mid || 0) + (breakdown.final || 0) + (breakdown.att || 0);
      const detail = calculateGradeDetails(sum);
      totalQualityPoints += (detail.points * course.credits);
      totalCredits += course.credits;
    }
  });

  if (totalCredits === 0) return '0.00';
  return (totalQualityPoints / totalCredits).toFixed(2);
}

export function generateInitialSampleGrades(
  students: Student[],
  courses: Course[]
): Record<string, GradeBreakdown> {
  const sample: Record<string, GradeBreakdown> = {};

  students.forEach((s, idx) => {
    const progCourses = courses.filter(c => c.program === s.program);
    progCourses.forEach(c => {
      const key = getGradeKey(s.uid, c.id, '2019', '1');
      // Produce realistic distribution (70 - 98)
      const baseScore = 70 + ((idx * 11 + c.name.length * 5) % 28);
      
      const p1 = Math.min(20, Math.round(baseScore * 0.20));
      const p2 = Math.min(20, Math.round(baseScore * 0.20));
      const mid = Math.min(30, Math.round(baseScore * 0.30));
      const final = Math.min(20, Math.round(baseScore * 0.20));
      const att = Math.min(10, Math.round(baseScore * 0.10));

      sample[key] = { p1, p2, mid, final, att };
    });
  });

  return sample;
}

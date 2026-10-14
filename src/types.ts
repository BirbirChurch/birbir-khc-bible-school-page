export type UserRole = 'ADMIN' | 'DEAN' | 'REGISTRAR' | 'TEACHER' | 'STUDENT';

export interface CurrentUser {
  role: UserRole;
  id: string; // username, teacher name, or student id
  uid?: string; // unique student uid if student
  name: string;
  program?: ProgramType;
}

export type ProgramType = 'Degree' | 'Diploma';

export interface Student {
  uid: string; // Unique identifier (e.g. 'dip_201901', 'deg_201901')
  id: string;  // Official Student ID
  name: string;
  gender: 'ወንድ' | 'ሴት';
  program: ProgramType;
  phone?: string;
  photoUrl?: string;
}

export interface Course {
  id: string;
  program: ProgramType;
  name: string;
  teacher: string;
  schedule: string; // e.g. "መስከረም 11 – 25/2019"
  credits: number;
  remarks?: string;
}

export interface GradeBreakdown {
  p1: number;   // ክፍል 1 (max 20)
  p2: number;   // ክፍል 2 (max 20)
  mid: number;  // ሚድ ፈተና (max 30)
  final: number;// ፋይናል (max 20)
  att: number;  // ተሳትፎ (max 10)
}

export interface GradeDetail {
  score: number;
  letter: string;
  points: number;
  desc: string;
}

export interface GradingScaleItem {
  min: number;
  max: number;
  letter: string;
  points: number;
  desc: string;
}

export interface SystemNotification {
  id: string;
  text: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

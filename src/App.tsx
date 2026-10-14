import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { NotificationToast } from './components/NotificationToast.tsx';
import { LoginView } from './components/LoginView.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { DeanPortal } from './components/DeanPortal.tsx';
import { RegistrarPortal } from './components/RegistrarPortal.tsx';
import { TeacherPortal } from './components/TeacherPortal.tsx';
import { StudentPortal } from './components/StudentPortal.tsx';
import { TranscriptModal } from './components/TranscriptModal.tsx';
import { PasswordModal } from './components/PasswordModal.tsx';
import { CourseModal } from './components/CourseModal.tsx';
import { StudentModal } from './components/StudentModal.tsx';
import { PhotoModal } from './components/PhotoModal.tsx';
import { FirebaseStatusModal } from './components/FirebaseStatusModal.tsx';
import { firebaseConfig } from './firebase.ts';
import { getStoredChurchLogo, saveChurchLogo, DEFAULT_CHURCH_LOGO } from './assets/logo.ts';

import {
  PRELOADED_COURSES,
  PRELOADED_STUDENTS,
  PRELOADED_TEACHERS,
  generateInitialUserPasswords
} from './data/initialData.ts';
import { Course, CurrentUser, GradeBreakdown, Student, SystemNotification } from './types.ts';
import { generateInitialSampleGrades } from './utils/gradeCalculations.ts';
import {
  checkFirebaseConnection,
  pushAllStateToFirestore,
  loadInitialFromFirestore,
  syncMetaToFirestore,
  syncStudentsToFirestore,
  syncCoursesToFirestore,
  syncGradesToFirestore,
  syncPasswordsToFirestore,
  syncPhotosToFirestore,
  FirebaseConnectionReport
} from './services/firebaseSync.ts';

const DEFAULT_ACADEMIC_YEARS = [
  '2019', '2020', '2021', '2022', '2023', '2024',
  '2025', '2026', '2027', '2028', '2029', '2030'
];

export default function App() {
  // Current user state
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Admin universal view switcher ('ADMIN' | 'DEAN' | 'REGISTRAR' | 'TEACHER' | 'STUDENT')
  const [adminActiveView, setAdminActiveView] = useState<'ADMIN' | 'DEAN' | 'REGISTRAR' | 'TEACHER' | 'STUDENT'>('ADMIN');

  // Academic calendar state
  const [currentYear, setCurrentYear] = useState<string>('2019');
  const [currentSemester, setCurrentSemester] = useState<string>('1');
  const [systemLocked, setSystemLocked] = useState<boolean>(false);
  const [gradePublished, setGradePublished] = useState<boolean>(true);

  const [availableYears, setAvailableYears] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('bk_academic_years');
      return stored ? JSON.parse(stored) : DEFAULT_ACADEMIC_YEARS;
    } catch {
      return DEFAULT_ACADEMIC_YEARS;
    }
  });

  // Teachers roster state
  const [teachers, setTeachers] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('bk_teachers');
      return stored ? JSON.parse(stored) : PRELOADED_TEACHERS;
    } catch {
      return PRELOADED_TEACHERS;
    }
  });

  // Students roster state
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const stored = localStorage.getItem('bk_students');
      return stored ? JSON.parse(stored) : PRELOADED_STUDENTS;
    } catch {
      return PRELOADED_STUDENTS;
    }
  });

  // Courses state
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const stored = localStorage.getItem('bk_courses');
      return stored ? JSON.parse(stored) : PRELOADED_COURSES;
    } catch {
      return PRELOADED_COURSES;
    }
  });

  // Grades state
  const [grades, setGrades] = useState<Record<string, GradeBreakdown>>(() => {
    try {
      const stored = localStorage.getItem('bk_grades');
      return stored ? JSON.parse(stored) : generateInitialSampleGrades(PRELOADED_STUDENTS, PRELOADED_COURSES);
    } catch {
      return generateInitialSampleGrades(PRELOADED_STUDENTS, PRELOADED_COURSES);
    }
  });

  // Photos state
  const [photos, setPhotos] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('bk_photos');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Individual user passwords state
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('bk_user_passwords');
      return stored ? JSON.parse(stored) : generateInitialUserPasswords();
    } catch {
      return generateInitialUserPasswords();
    }
  });

  // Toast notifications
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Modals state
  const [passwordModalData, setPasswordModalData] = useState<{
    isOpen: boolean;
    targetKey: string;
    displayName: string;
  }>({
    isOpen: false,
    targetKey: '',
    displayName: ''
  });

  const [courseModalData, setCourseModalData] = useState<{ isOpen: boolean; course: Course | null }>({
    isOpen: false,
    course: null
  });
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [photoModalStudentUid, setPhotoModalStudentUid] = useState<string | null>(null);
  const [transcriptStudent, setTranscriptStudent] = useState<Student | null>(null);

  // Church official emblem / logo state (supports default and custom uploaded logo)
  const [churchLogo, setChurchLogo] = useState<string>(getStoredChurchLogo);

  // Firebase connection and diagnostic states
  const [firebaseReport, setFirebaseReport] = useState<FirebaseConnectionReport | null>(null);
  const [isTestingFirebase, setIsTestingFirebase] = useState<boolean>(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);

  // Initialize and Sync from Firebase Firestore
  useEffect(() => {
    async function initFirestore() {
      setIsTestingFirebase(true);
      try {
        const report = await checkFirebaseConnection();
        setFirebaseReport(report);
        if (report.status === 'connected') {
          // Check remote branding logo
          try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('./firebase.ts');
            const brandSnap = await getDoc(doc(db, '_system_settings', 'branding'));
            if (brandSnap.exists() && brandSnap.data()?.churchLogo) {
              const remoteLogo = brandSnap.data()?.churchLogo;
              setChurchLogo(remoteLogo);
              saveChurchLogo(remoteLogo);
            }
          } catch (_) {}

          const remoteState = await loadInitialFromFirestore();
          if (remoteState) {
            if (remoteState.students) setStudents(remoteState.students);
            if (remoteState.teachers) setTeachers(remoteState.teachers);
            if (remoteState.courses) setCourses(remoteState.courses);
            if (remoteState.grades) setGrades(remoteState.grades);
            if (remoteState.photos) setPhotos(remoteState.photos);
            if (remoteState.userPasswords) setUserPasswords(remoteState.userPasswords);
            if (remoteState.availableYears) setAvailableYears(remoteState.availableYears);
            if (typeof remoteState.systemLocked === 'boolean') setSystemLocked(remoteState.systemLocked);
            if (typeof remoteState.gradePublished === 'boolean') setGradePublished(remoteState.gradePublished);
            if (remoteState.currentYear) setCurrentYear(remoteState.currentYear);
            if (remoteState.currentSemester) setCurrentSemester(remoteState.currentSemester);
          } else {
            // First time seeding to Firestore
            syncMetaToFirestore({
              systemLocked,
              gradePublished,
              currentYear,
              currentSemester,
              availableYears,
              teachers
            });
            syncStudentsToFirestore(students);
            syncCoursesToFirestore(courses);
            syncGradesToFirestore(grades);
            syncPasswordsToFirestore(userPasswords);
          }
        }
      } catch (err) {
        console.warn('Firebase sync note:', err);
      } finally {
        setIsTestingFirebase(false);
      }
    }
    initFirestore();
  }, []);

  const handleTestFirebaseConnection = async () => {
    setIsTestingFirebase(true);
    try {
      const rep = await checkFirebaseConnection();
      setFirebaseReport(rep);
      if (rep.status === 'connected') {
        showNotification(rep.message || 'Firebase ተገናኝቷል!', 'success');
      } else {
        showNotification(rep.message || 'Firebase አልተገናኘም', 'error');
      }
    } catch (e: any) {
      showNotification('ግንኙነቱን መፈተሽ አልተቻለም', 'error');
    } finally {
      setIsTestingFirebase(false);
    }
  };

  const handlePushAllToFirebase = async () => {
    showNotification('መረጃዎችን ወደ Firebase በመጫን ላይ...', 'info');
    const result = await pushAllStateToFirestore({
      meta: {
        systemLocked,
        gradePublished,
        currentYear,
        currentSemester,
        availableYears,
        teachers
      },
      students,
      courses,
      grades,
      passwords: userPasswords,
      photos
    });

    if (result.success) {
      showNotification('ሁሉም መረጃዎች በስኬት ወደ Firebase ተጭነዋል!', 'success');
    } else {
      showNotification(`ወደ Firebase መጫን አልተቻለም፦ ${result.error}`, 'error');
    }
  };

  const handlePullFromFirebase = async () => {
    showNotification('መረጃዎችን ከFirebase በማውረድ ላይ...', 'info');
    try {
      const remoteState = await loadInitialFromFirestore();
      if (remoteState) {
        if (remoteState.students) setStudents(remoteState.students);
        if (remoteState.teachers) setTeachers(remoteState.teachers);
        if (remoteState.courses) setCourses(remoteState.courses);
        if (remoteState.grades) setGrades(remoteState.grades);
        if (remoteState.photos) setPhotos(remoteState.photos);
        if (remoteState.userPasswords) setUserPasswords(remoteState.userPasswords);
        if (remoteState.availableYears) setAvailableYears(remoteState.availableYears);
        if (typeof remoteState.systemLocked === 'boolean') setSystemLocked(remoteState.systemLocked);
        if (typeof remoteState.gradePublished === 'boolean') setGradePublished(remoteState.gradePublished);
        if (remoteState.currentYear) setCurrentYear(remoteState.currentYear);
        if (remoteState.currentSemester) setCurrentSemester(remoteState.currentSemester);
        showNotification('የቅርብ ጊዜ መረጃዎች ከFirebase ተወስደዋል!', 'success');
      } else {
        showNotification('በFirebase ውስጥ የተቀመጠ መረጃ አልተገኘም', 'warning');
      }
    } catch (err: any) {
      showNotification('ከFirebase ማውረድ አልተቻለም', 'error');
    }
  };

  const handleUpdateChurchLogo = async (newLogo: string) => {
    setChurchLogo(newLogo);
    saveChurchLogo(newLogo);
    showNotification('የቤተ ክርስቲያኑ አርማና ሎጎ በተሳካ ሁኔታ ተቀይሯል!', 'success');
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase.ts');
      await setDoc(doc(db, '_system_settings', 'branding'), { churchLogo: newLogo, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Firebase logo sync note:', err);
    }
  };

  // Save changes to localStorage and Firestore
  useEffect(() => {
    localStorage.setItem('bk_students', JSON.stringify(students));
    syncStudentsToFirestore(students);
  }, [students]);

  useEffect(() => {
    localStorage.setItem('bk_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('bk_courses', JSON.stringify(courses));
    syncCoursesToFirestore(courses);
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('bk_grades', JSON.stringify(grades));
    syncGradesToFirestore(grades);
  }, [grades]);

  useEffect(() => {
    localStorage.setItem('bk_photos', JSON.stringify(photos));
    syncPhotosToFirestore(photos);
  }, [photos]);

  useEffect(() => {
    localStorage.setItem('bk_user_passwords', JSON.stringify(userPasswords));
    syncPasswordsToFirestore(userPasswords);
  }, [userPasswords]);

  useEffect(() => {
    localStorage.setItem('bk_academic_years', JSON.stringify(availableYears));
  }, [availableYears]);

  useEffect(() => {
    localStorage.setItem('bk_systemLocked', String(systemLocked));
  }, [systemLocked]);

  useEffect(() => {
    localStorage.setItem('bk_gradePublished', String(gradePublished));
  }, [gradePublished]);

  useEffect(() => {
    localStorage.setItem('bk_currentYear', currentYear);
  }, [currentYear]);

  useEffect(() => {
    localStorage.setItem('bk_currentSemester', currentSemester);
  }, [currentSemester]);

  // Sync meta on meta state changes
  useEffect(() => {
    syncMetaToFirestore({
      systemLocked,
      gradePublished,
      currentYear,
      currentSemester,
      availableYears,
      teachers
    });
  }, [systemLocked, gradePublished, currentYear, currentSemester, availableYears, teachers]);

  const showNotification = (
    text: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    const id = Date.now().toString() + Math.random().toString();
    setNotifications((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Lock toggle
  const handleToggleSystemLock = () => {
    setSystemLocked((prev) => {
      const next = !prev;
      showNotification(
        next ? 'ሲስተሙ ተቆልፏል (Maintenance Lock ON)' : 'ሲስተሙ ክፍት ሆኗል (Maintenance Lock OFF)',
        next ? 'warning' : 'success'
      );
      return next;
    });
  };

  // Grade publication toggle
  const handleToggleGradePublication = () => {
    setGradePublished((prev) => {
      const next = !prev;
      showNotification(
        next ? 'ውጤት ለተማሪዎች ይፋ ሆኗል!' : 'ውጤት ለተማሪዎች እንዳይታይ ተሰውሯል።',
        next ? 'success' : 'info'
      );
      return next;
    });
  };

  // Add custom academic year
  const handleAddAcademicYear = (newYear: string) => {
    setAvailableYears((prev) => [...prev, newYear]);
  };

  // Add new teacher
  const handleAddTeacher = (newTeacherName: string) => {
    setTeachers((prev) => [newTeacherName, ...prev]);
    setUserPasswords((prev) => ({
      ...prev,
      [newTeacherName]: 'teacher123'
    }));
  };

  // Password save for any user key
  const handleSavePassword = (userKey: string, newPass: string) => {
    setUserPasswords((prev) => ({
      ...prev,
      [userKey]: newPass
    }));
    setPasswordModalData({ isOpen: false, targetKey: '', displayName: '' });
    showNotification('የይለፍ ቃሉ በስኬት ተቀይሯል!', 'success');
  };

  // Trigger password change for currently logged-in user
  const handleTriggerSelfPasswordChange = () => {
    if (!currentUser) return;
    if (currentUser.role === 'ADMIN') {
      setPasswordModalData({ isOpen: true, targetKey: 'admin', displayName: 'የአድሚን' });
    } else if (currentUser.role === 'DEAN') {
      setPasswordModalData({ isOpen: true, targetKey: 'dean', displayName: 'የዋና ዲን' });
    } else if (currentUser.role === 'REGISTRAR') {
      setPasswordModalData({ isOpen: true, targetKey: 'registrar', displayName: 'የሪጅስተራል' });
    } else if (currentUser.role === 'TEACHER') {
      setPasswordModalData({ isOpen: true, targetKey: currentUser.name, displayName: `የ${currentUser.name}` });
    } else if (currentUser.role === 'STUDENT') {
      const activeUid = currentUser.uid || `dip_${currentUser.id}`;
      setPasswordModalData({ isOpen: true, targetKey: activeUid, displayName: `የ${currentUser.name}` });
    }
  };

  // Course save
  const handleSaveCourse = (courseData: Omit<Course, 'id'> & { id?: string }) => {
    if (courseData.id) {
      setCourses((prev) =>
        prev.map((c) => (c.id === courseData.id ? { ...c, ...courseData, id: c.id } : c))
      );
      showNotification('የኮርሱ መረጃ በስኬት ተስተካክሏል!', 'success');
    } else {
      const newCourse: Course = {
        ...courseData,
        id: `c_${Date.now()}`
      };
      setCourses((prev) => [...prev, newCourse]);
      showNotification('አዲስ የትምህርት ዓይነት በስኬት ተጨምሯል!', 'success');
    }
    setCourseModalData({ isOpen: false, course: null });
  };

  const handleDeleteCourse = (courseId: string) => {
    if (window.confirm('እርግጠኛ ነዎት ይህንን ኮርስ ማሰረዝ ይፈልጋሉ?')) {
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      showNotification('ኮርሱ ተሰርዟል!', 'info');
    }
  };

  // Student save
  const handleSaveStudent = (newStudent: Student) => {
    setStudents((prev) => [...prev, newStudent]);
    setUserPasswords((prev) => ({
      ...prev,
      [newStudent.uid]: newStudent.id
    }));
    setIsStudentModalOpen(false);
    showNotifyUser(`ተማሪ "${newStudent.name}" (${newStudent.program}) በስኬት ተመዝግቧል!`);
  };

  const showNotifyUser = (msg: string) => {
    showNotification(msg, 'success');
  };

  const handleDeleteStudent = (studentUid: string) => {
    const s = students.find((item) => item.uid === studentUid);
    if (window.confirm(`ተማሪ "${s?.name || studentUid}"ን ከሲስተሙ ማሰረዝ ይፈልጋሉ?`)) {
      setStudents((prev) => prev.filter((item) => item.uid !== studentUid));
      showNotification('ተማሪው ከሲስተሙ ተሰርዟል!', 'info');
    }
  };

  // Photo save
  const handleSavePhoto = (studentUid: string, photoUrl: string) => {
    setPhotos((prev) => ({ ...prev, [studentUid]: photoUrl }));
    setPhotoModalStudentUid(null);
    showNotification('የተማሪው ፎቶ በስኬት ተቀምጧል!', 'success');
  };

  // Export / Import / Reset System Data
  const handleExportData = () => {
    const backupData = {
      version: '3.0',
      timestamp: new Date().toISOString(),
      students,
      teachers,
      courses,
      grades,
      photos,
      userPasswords,
      availableYears,
      systemLocked,
      gradePublished,
      currentYear,
      currentSemester
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `birbir_kale_heywet_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('የመረጃ መጠባበቂያ ፋይል (Backup) በስኬት ዳውንሎድ ተደርጓል!', 'success');
  };

  const handleImportData = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.students)) setStudents(data.students);
      if (Array.isArray(data.teachers)) setTeachers(data.teachers);
      if (Array.isArray(data.courses)) setCourses(data.courses);
      if (data.grades) setGrades(data.grades);
      if (data.photos) setPhotos(data.photos);
      if (data.userPasswords) setUserPasswords(data.userPasswords);
      if (Array.isArray(data.availableYears)) setAvailableYears(data.availableYears);
      if (typeof data.systemLocked === 'boolean') setSystemLocked(data.systemLocked);
      if (typeof data.gradePublished === 'boolean') setGradePublished(data.gradePublished);
      if (data.currentYear) setCurrentYear(data.currentYear);
      if (data.currentSemester) setCurrentSemester(data.currentSemester);
      showNotification('የመረጃ መጠባበቂያ ፋይሉ በስኬት ተጭኗል!', 'success');
    } catch {
      showNotification('ትክክለኛ ያልሆነ የመረጃ ፋይል!', 'error');
    }
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        'እርግጠኛ ነዎት ሁሉንም መረጃዎች ወደ መጀመሪያው ነባሪ ሁኔታ መመለስ ይፈልጋሉ? የተቀየሩ ውጤቶችና አዳዲስ ተማሪዎች ይሰረዛሉ።'
      )
    ) {
      const defStudents = PRELOADED_STUDENTS;
      const defTeachers = PRELOADED_TEACHERS;
      const defCourses = PRELOADED_COURSES;
      const defGrades = generateInitialSampleGrades(PRELOADED_STUDENTS, PRELOADED_COURSES);
      const defPasswords = generateInitialUserPasswords();

      setStudents(defStudents);
      setTeachers(defTeachers);
      setCourses(defCourses);
      setGrades(defGrades);
      setPhotos({});
      setUserPasswords(defPasswords);
      setAvailableYears(DEFAULT_ACADEMIC_YEARS);
      setSystemLocked(false);
      setGradePublished(true);
      setCurrentYear('2019');
      setCurrentSemester('1');
      localStorage.clear();
      showNotification('ሲስተሙ ወደ ነባሪ ሁኔታ ተመልሷል!', 'info');
    }
  };

  // Find active student if logged in as student or previewed by admin
  const activeStudent =
    currentUser?.role === 'STUDENT'
      ? students.find(
          (s) => (currentUser.uid ? s.uid === currentUser.uid : s.id === currentUser.id && (!currentUser.program || s.program === currentUser.program))
        ) || students[0]
      : students[0];

  // Determine active view when Admin is logged in
  const effectiveView = currentUser?.role === 'ADMIN' ? adminActiveView : currentUser?.role;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased">
      {/* Toast notifications */}
      <NotificationToast
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />

      {/* Main Header */}
      <Header
        currentUser={currentUser}
        systemLocked={systemLocked}
        adminActiveView={adminActiveView}
        onAdminChangeView={(view) => {
          setAdminActiveView(view);
          showNotification(`ወደ ${view} ገጽ ተቀይሯል!`, 'info');
        }}
        onOpenPasswordModal={handleTriggerSelfPasswordChange}
        onLogout={() => {
          setCurrentUser(null);
          setAdminActiveView('ADMIN');
          showNotification('በስኬት ወጥተዋል!', 'info');
        }}
        firebaseReport={firebaseReport}
        isTestingFirebase={isTestingFirebase}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        churchLogo={churchLogo}
      />

      {/* Main Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!currentUser ? (
          <LoginView
            students={students}
            teachers={teachers}
            userPasswords={userPasswords}
            systemLocked={systemLocked}
            onLogin={(user) => {
              setCurrentUser(user);
              if (user.role === 'ADMIN') setAdminActiveView('ADMIN');
            }}
            showNotify={showNotification}
            firebaseReport={firebaseReport}
            isTestingFirebase={isTestingFirebase}
            onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
            churchLogo={churchLogo}
          />
        ) : (
          <>
            {effectiveView === 'ADMIN' && (
              <AdminPortal
                systemLocked={systemLocked}
                onToggleLock={handleToggleSystemLock}
                userPasswords={userPasswords}
                onOpenPasswordModal={(userKey, displayName) => {
                  setPasswordModalData({ isOpen: true, targetKey: userKey, displayName });
                }}
                students={students}
                courses={courses}
                teachers={teachers}
                grades={grades}
                currentYear={currentYear}
                currentSemester={currentSemester}
                gradePublished={gradePublished}
                onToggleGradePublication={handleToggleGradePublication}
                onExportData={handleExportData}
                onImportData={handleImportData}
                onResetDefaults={handleResetDefaults}
                onSelectPrintTranscript={(s) => setTranscriptStudent(s)}
                onSwitchView={(v) => setAdminActiveView(v)}
                firebaseReport={firebaseReport}
                isTestingFirebase={isTestingFirebase}
                onTestFirebaseConnection={handleTestFirebaseConnection}
                onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
                onPushAllToFirebase={handlePushAllToFirebase}
                churchLogo={churchLogo}
                onUpdateChurchLogo={handleUpdateChurchLogo}
              />
            )}

            {effectiveView === 'DEAN' && (
              <DeanPortal
                currentYear={currentYear}
                currentSemester={currentSemester}
                onYearChange={(y) => setCurrentYear(y)}
                onSemesterChange={(s) => setCurrentSemester(s)}
                availableYears={availableYears}
                onAddAcademicYear={handleAddAcademicYear}
                gradePublished={gradePublished}
                onToggleGradePublication={handleToggleGradePublication}
                courses={courses}
                students={students}
                teachers={teachers}
                grades={grades}
                onAddTeacher={handleAddTeacher}
                onOpenAddCourse={() => setCourseModalData({ isOpen: true, course: null })}
                onOpenEditCourse={(c) => setCourseModalData({ isOpen: true, course: c })}
                onDeleteCourse={handleDeleteCourse}
                onOpenAddStudent={() => setIsStudentModalOpen(true)}
                onDeleteStudent={handleDeleteStudent}
                onSaveGrades={(updated) => setGrades(updated)}
                onSelectPrintTranscript={(s) => setTranscriptStudent(s)}
                showNotify={showNotification}
              />
            )}

            {effectiveView === 'REGISTRAR' && (
              <RegistrarPortal
                students={students}
                courses={courses}
                grades={grades}
                photos={photos}
                currentYear={currentYear}
                currentSemester={currentSemester}
                onOpenAddStudent={() => setIsStudentModalOpen(true)}
                onOpenPhotoModal={(sid) => setPhotoModalStudentUid(sid)}
                onSelectPrintTranscript={(s) => setTranscriptStudent(s)}
                onDeleteStudent={handleDeleteStudent}
                showNotify={showNotification}
              />
            )}

            {effectiveView === 'TEACHER' && (
              <TeacherPortal
                teacherName={currentUser.role === 'TEACHER' ? currentUser.name : (teachers[0] || 'መ/ር ሰሎሞን ሶርሳ')}
                courses={courses}
                students={students}
                grades={grades}
                currentYear={currentYear}
                currentSemester={currentSemester}
                onSaveGrades={(updated) => setGrades(updated)}
                showNotify={showNotification}
              />
            )}

            {effectiveView === 'STUDENT' && activeStudent && (
              <StudentPortal
                student={activeStudent}
                courses={courses}
                grades={grades}
                photoUrl={photos[activeStudent.uid]}
                currentYear={currentYear}
                currentSemester={currentSemester}
                gradePublished={gradePublished}
                onOpenTranscript={() => setTranscriptStudent(activeStudent)}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 mt-12 no-print border-t border-slate-800 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="text-slate-200 font-semibold">
            የብርብር ከተማ ቃለ ሕይወት ቤተ ክርስቲያን መጽሐፍ ቅዱስ ትምህርት ቤት
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-0.5">
            <span>Birbir City Kale Heywet Church Bible Training School &copy; 2019 – 2030 ዓ.ም</span>
            <span>•</span>
            <span className="text-amber-400 font-mono">Firebase: {firebaseConfig.projectId}</span>
          </div>
        </div>
      </footer>

      {/* Generic Password Modal for all users */}
      {passwordModalData.isOpen && (
        <PasswordModal
          targetKey={passwordModalData.targetKey}
          targetDisplayName={passwordModalData.displayName}
          onClose={() => setPasswordModalData({ isOpen: false, targetKey: '', displayName: '' })}
          onSave={handleSavePassword}
        />
      )}

      {courseModalData.isOpen && (
        <CourseModal
          course={courseModalData.course}
          teachers={teachers}
          onClose={() => setCourseModalData({ isOpen: false, course: null })}
          onSave={handleSaveCourse}
        />
      )}

      {isStudentModalOpen && (
        <StudentModal
          existingUids={students.map((s) => s.uid)}
          onClose={() => setIsStudentModalOpen(false)}
          onSave={handleSaveStudent}
          showNotify={showNotification}
        />
      )}

      {photoModalStudentUid && (
        <PhotoModal
          student={students.find((s) => s.uid === photoModalStudentUid) || students[0]}
          currentPhoto={photos[photoModalStudentUid]}
          onClose={() => setPhotoModalStudentUid(null)}
          onSavePhoto={handleSavePhoto}
        />
      )}

      {transcriptStudent && (
        <TranscriptModal
          student={transcriptStudent}
          courses={courses}
          grades={grades}
          currentYear={currentYear}
          currentSemester={currentSemester}
          onClose={() => setTranscriptStudent(null)}
          churchLogo={churchLogo}
        />
      )}

      {/* Firebase Diagnostics & Cloud Sync Modal */}
      {isFirebaseModalOpen && (
        <FirebaseStatusModal
          report={firebaseReport}
          isTesting={isTestingFirebase}
          onTestConnection={handleTestFirebaseConnection}
          onPushAllToFirebase={handlePushAllToFirebase}
          onPullFromFirebase={handlePullFromFirebase}
          onClose={() => setIsFirebaseModalOpen(false)}
        />
      )}
    </div>
  );
}

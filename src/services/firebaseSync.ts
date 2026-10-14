import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firebaseConfig } from '../firebase.ts';
import { Course, GradeBreakdown, Student } from '../types.ts';

export interface FirebaseConnectionReport {
  status: 'connected' | 'error' | 'testing';
  code?: string;
  message?: string;
  solution?: string;
  lastChecked?: string;
}

export interface FirebaseSystemState {
  students?: Student[];
  teachers?: string[];
  courses?: Course[];
  grades?: Record<string, GradeBreakdown>;
  photos?: Record<string, string>;
  userPasswords?: Record<string, string>;
  availableYears?: string[];
  systemLocked?: boolean;
  gradePublished?: boolean;
  currentYear?: string;
  currentSemester?: string;
}

/**
 * Actively checks connection and read/write permission to Cloud Firestore with timeout
 */
export async function checkFirebaseConnection(): Promise<FirebaseConnectionReport> {
  const timestamp = new Date().toLocaleTimeString();

  const pingPromise = async () => {
    const testRef = doc(db, 'system_state', 'connection_ping');
    await setDoc(testRef, { lastPing: new Date().toISOString() }, { merge: true });
    const snap = await getDoc(testRef);
    return snap.exists();
  };

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT_FIRESTORE')), 8000)
  );

  try {
    const success = await Promise.race([pingPromise(), timeoutPromise]);

    if (success) {
      return {
        status: 'connected',
        message: 'ከFirebase Firestore ዳታቤዝ ጋር በስኬት ተገናኝቷል (Connected to Firestore successfully)!',
        lastChecked: timestamp
      };
    } else {
      return {
        status: 'error',
        code: 'not-found',
        message: 'የFirestore ዳታቤዝ ሰነድ ማግኘት አልተቻለም።',
        solution: 'በFirebase Console ውስጥ Cloud Firestore Database መፈጠሩን ያረጋግጡ።',
        lastChecked: timestamp
      };
    }
  } catch (err: any) {
    const errorCode = err?.code || 'unknown';
    const errorMsg = String(err?.message || err);

    let message = 'ከFirebase Firestore ጋር መገናኘት አልተቻለም።';
    let solution = 'እባክዎ በFirebase Console ውስጥ Cloud Firestore Database መፈጠሩንና ደንቦች (Rules) ክፍት መሆናቸውን ያረጋግጡ።';

    if (
      errorMsg.includes('Cloud Firestore API has not been used') ||
      errorMsg.includes('firestore.googleapis.com') ||
      errorMsg.includes('it is disabled') ||
      errorMsg.includes('not been used in project')
    ) {
      message = `በGoogle Cloud/Firebase ፕሮጀክት (${firebaseConfig.projectId}) ውስጥ Cloud Firestore Database ገና አልተከፈተም (Firestore is not enabled yet)።`;
      solution = `1. ወደ Firebase Console ይሂዱ፦ https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore\n` +
        `2. "Create database" የሚለውን አዝራር ይጫኑ።\n` +
        `3. "Start in test mode" የሚለውን ይምረጡና "Enable" ይጫኑ።\n` +
        `4. ከዚያ በኋላ እዚህ መጥተው "ግንኙነት ፈትሽ" ሲጫኑ ወዲያውኑ ይገናኛል!`;
    } else if (
      errorCode.includes('permission-denied') ||
      errorMsg.includes('permission-denied') ||
      errorMsg.includes('insufficient permissions')
    ) {
      message = 'የፍቃድ እክል (Permission Denied): የFirestore Security Rules ዝግ ናቸው ወይም አልተፈቀደም።';
      solution = `1. ወደ Firebase Console > Firestore Database > Rules ክፍል ይሂዱ።\n` +
        `2. "allow read, write: if true;" ብለው በማስተካከል "Publish" የሚለውን ይጫኑ።`;
    } else if (errorCode.includes('not-found') || errorMsg.includes('NOT_FOUND')) {
      message = 'ዳታቤዙ አልተፈጠረም (Database Not Found)።';
      solution = `በFirebase Console ውስጥ ገብተው Cloud Firestore Database መፍጠርዎን ያረጋግጡ።`;
    } else if (errorMsg.includes('TIMEOUT_FIRESTORE')) {
      message = 'የዳታቤዝ ግንኙነት ምላሽ ዘግይቷል (Connection Timeout)።';
      solution = 'የኢንተርኔት ግንኙነትዎን ያረጋግጡ፤ ወይም በFirebase Console ውስጥ Firestore Database ገና መፈጠር ላይ ሊሆን ይችላል።';
    } else if (errorCode.includes('unavailable') || errorMsg.includes('unavailable')) {
      message = 'የኢንተርኔት ግንኙነት እክል (Service Unavailable)።';
      solution = 'የኮምፒውተርዎን ወይም የሞባይልዎን የኢንተርኔት ግንኙነት ያረጋግጡ።';
    }

    return {
      status: 'error',
      code: errorCode,
      message,
      solution,
      lastChecked: timestamp
    };
  }
}

export async function loadInitialFromFirestore(): Promise<FirebaseSystemState | null> {
  try {
    const metaDoc = await getDoc(doc(db, 'system_state', 'meta'));
    const studentsDoc = await getDoc(doc(db, 'system_state', 'students'));
    const coursesDoc = await getDoc(doc(db, 'system_state', 'courses'));
    const gradesDoc = await getDoc(doc(db, 'system_state', 'grades'));
    const passwordsDoc = await getDoc(doc(db, 'system_state', 'passwords'));
    const photosDoc = await getDoc(doc(db, 'system_state', 'photos'));

    const state: FirebaseSystemState = {};

    if (metaDoc.exists()) {
      const data = metaDoc.data();
      if (typeof data.systemLocked === 'boolean') state.systemLocked = data.systemLocked;
      if (typeof data.gradePublished === 'boolean') state.gradePublished = data.gradePublished;
      if (data.currentYear) state.currentYear = data.currentYear;
      if (data.currentSemester) state.currentSemester = data.currentSemester;
      if (Array.isArray(data.availableYears)) state.availableYears = data.availableYears;
      if (Array.isArray(data.teachers)) state.teachers = data.teachers;
    }

    if (studentsDoc.exists()) {
      const data = studentsDoc.data();
      if (Array.isArray(data.list) && data.list.length > 0) state.students = data.list;
    }

    if (coursesDoc.exists()) {
      const data = coursesDoc.data();
      if (Array.isArray(data.list) && data.list.length > 0) state.courses = data.list;
    }

    if (gradesDoc.exists()) {
      const data = gradesDoc.data();
      if (data.data) state.grades = data.data;
    }

    if (passwordsDoc.exists()) {
      const data = passwordsDoc.data();
      if (data.data) state.userPasswords = data.data;
    }

    if (photosDoc.exists()) {
      const data = photosDoc.data();
      if (data.data) state.photos = data.data;
    }

    return state;
  } catch (error) {
    console.warn('Firebase initial load note:', error);
    return null;
  }
}

export async function syncMetaToFirestore(meta: {
  systemLocked: boolean;
  gradePublished: boolean;
  currentYear: string;
  currentSemester: string;
  availableYears: string[];
  teachers: string[];
}) {
  try {
    await setDoc(doc(db, 'system_state', 'meta'), meta, { merge: true });
  } catch (e) {
    console.warn('Error saving meta to Firestore:', e);
  }
}

export async function syncStudentsToFirestore(students: Student[]) {
  try {
    await setDoc(doc(db, 'system_state', 'students'), { list: students }, { merge: true });
  } catch (e) {
    console.warn('Error saving students to Firestore:', e);
  }
}

export async function syncCoursesToFirestore(courses: Course[]) {
  try {
    await setDoc(doc(db, 'system_state', 'courses'), { list: courses }, { merge: true });
  } catch (e) {
    console.warn('Error saving courses to Firestore:', e);
  }
}

export async function syncGradesToFirestore(grades: Record<string, GradeBreakdown>) {
  try {
    await setDoc(doc(db, 'system_state', 'grades'), { data: grades }, { merge: true });
  } catch (e) {
    console.warn('Error saving grades to Firestore:', e);
  }
}

export async function syncPasswordsToFirestore(userPasswords: Record<string, string>) {
  try {
    await setDoc(doc(db, 'system_state', 'passwords'), { data: userPasswords }, { merge: true });
  } catch (e) {
    console.warn('Error saving passwords to Firestore:', e);
  }
}

export async function syncPhotosToFirestore(photos: Record<string, string>) {
  try {
    await setDoc(doc(db, 'system_state', 'photos'), { data: photos }, { merge: true });
  } catch (e) {
    console.warn('Error saving photos to Firestore:', e);
  }
}

/**
 * Pushes entire system state to Firebase Firestore at once
 */
export async function pushAllStateToFirestore(payload: {
  meta: {
    systemLocked: boolean;
    gradePublished: boolean;
    currentYear: string;
    currentSemester: string;
    availableYears: string[];
    teachers: string[];
  };
  students: Student[];
  courses: Course[];
  grades: Record<string, GradeBreakdown>;
  passwords: Record<string, string>;
  photos: Record<string, string>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await Promise.all([
      setDoc(doc(db, 'system_state', 'meta'), payload.meta, { merge: true }),
      setDoc(doc(db, 'system_state', 'students'), { list: payload.students }, { merge: true }),
      setDoc(doc(db, 'system_state', 'courses'), { list: payload.courses }, { merge: true }),
      setDoc(doc(db, 'system_state', 'grades'), { data: payload.grades }, { merge: true }),
      setDoc(doc(db, 'system_state', 'passwords'), { data: payload.passwords }, { merge: true }),
      setDoc(doc(db, 'system_state', 'photos'), { data: payload.photos }, { merge: true })
    ]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

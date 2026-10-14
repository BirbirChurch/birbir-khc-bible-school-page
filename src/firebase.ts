import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyDhtugGra6StAb_-DRmYKJBaumdPlK-y04",
  authDomain: "birbir-khc-bible-school-page.firebaseapp.com",
  projectId: "birbir-khc-bible-school-page",
  storageBucket: "birbir-khc-bible-school-page.firebasestorage.app",
  messagingSenderId: "576895642986",
  appId: "1:576895642986:web:89b6f1922a37f671ec8913"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;

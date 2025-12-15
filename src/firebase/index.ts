
// This file is the single-point-of-entry for all Firebase-related functionality.
// It is the only file that should be imported by other parts of the application.
// It is responsible for initializing the Firebase app and exporting the necessary services.
// It should be imported as follows:
// import { db, auth } from '@/firebase';

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

let app, db, auth;

function initializeFirebase(firebaseConfig: FirebaseOptions) {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
    } else {
        app = getApp();
        db = getFirestore(app);
        auth = getAuth(app);
    }
    return { app, db, auth };
}


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase for client components
if (typeof window !== 'undefined') {
    initializeFirebase(firebaseConfig);
}

export { app, db, auth, initializeFirebase };

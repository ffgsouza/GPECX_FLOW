// This file is the single-point-of-entry for all Firebase-related functionality.
// It is the only file that should be imported by other parts of the application.
// It is responsible for initializing the Firebase app and exporting the necessary services.
// It should be imported as follows:
// import { initializeFirebase, db } from '@/firebase';

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

let app, auth, storage;
export let db: Firestore;

// This function should only be called on the client-side.
function initializeFirebase() {
    const firebaseConfig: FirebaseOptions = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    
    return { app, db, auth, storage };
}

// Initialize Firebase on module load for client-side usage
if (typeof window !== 'undefined') {
    initializeFirebase();
}


// The direct initialization is removed from here.
// The instances will be available after initializeFirebase is called.
// Components should get these from a context or by calling initializeFirebase themselves
// in a client-side context.

export { initializeFirebase };

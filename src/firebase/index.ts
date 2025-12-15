
// This file is the single-point-of-entry for all Firebase-related functionality.
// It is the only file that should be imported by other parts of the application.
// It is responsible for initializing the Firebase app and exporting the necessary services.
// It should be imported as follows:
// import { db, auth, initializeFirebase } from '@/firebase';

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

let app, db, auth;

function initializeFirebase(firebaseConfig?: FirebaseOptions) {
    if (firebaseConfig) {
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
        } else {
            app = getApp();
        }
        db = getFirestore(app);
        auth = getAuth(app);
    }
    return { app, db, auth };
}

// The direct initialization is removed from here.
// Initialization will now be handled by the component that needs Firebase,
// typically the main AppContextProvider.

export { app, db, auth, initializeFirebase };


import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import { storage } from '../firebase'; // Import from your firebase config
import imageCompression from 'browser-image-compression';

interface UseFileUploadReturn {
    uploadFile: (file: File, path: string) => Promise<string | null>;
    uploadProgress: number;
    isUploading: boolean;
    error: string | null;
}

export function useFileUpload(): UseFileUploadReturn {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = async (file: File, path: string): Promise<string | null> => {
        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            // REMOVED COMPRESSION: directly using the file to avoid processing hangs
            // const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
            // const compressedFile = await imageCompression(file, options);
            const fileToUpload = file;

            // 3. Create storage ref
            if (!storage) throw new Error("Firebase Storage not initialized");
            const storageRef = ref(storage, path);

            // 4. Upload task (Simpler uploadBytes) with Timeout
            // uploadBytesResumable seems to hang on some environments/listeners. 
            // uploadBytes is a simple promise.

            // Fake progress for UX since uploadBytes doesn't emit progress
            setUploadProgress(30);

            // Create a timeout promise
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Upload timed out after 15 seconds")), 15000)
            );

            // Race between upload and timeout
            const snapshot = await Promise.race([
                uploadBytes(storageRef, fileToUpload),
                timeoutPromise
            ]);

            setUploadProgress(100);

            // 5. Get URL
            const downloadURL = await getDownloadURL(snapshot.ref);
            setIsUploading(false);
            return downloadURL;

        } catch (err: any) {
            console.error("Upload Error:", err);
            // Translate common Firebase errors for user
            let msg = err.message || "Unknown error occurred";
            if (msg.includes("unauthorized")) msg = "Permissão negada (Configurar Storage Rules).";
            if (msg.includes("timed out")) msg = "O upload demorou muito. Verifique sua conexão.";

            setError(msg);
            setIsUploading(false);
            return null;
        }
    };

    return { uploadFile, uploadProgress, isUploading, error };
}

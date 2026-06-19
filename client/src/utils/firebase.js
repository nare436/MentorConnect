// Firebase configuration for frontend
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCOaLFgOW1ZiCbCIZ3qxWTyyzDkELFxvfM",
  authDomain: "mentorconnect-bbe32.firebaseapp.com",
  projectId: "mentorconnect-bbe32",
  storageBucket: "mentorconnect-bbe32.firebasestorage.app",
  messagingSenderId: "733451500121",
  appId: "1:733451500121:web:db504a26007fc231520f48",
  measurementId: "G-P04P6KD8ZD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Sign in with Google popup
export const signInWithGoogle = async (role = 'student') => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Domain restriction for students
    const email = result.user.email;
    if (role === 'student' && !email.endsWith('@mnit.ac.in')) {
      await signOut(auth);
      throw new Error('Only MNIT students can register. Please use your @mnit.ac.in email.');
    }

    // Get the Firebase ID token to send to our backend
    const idToken = await result.user.getIdToken();
    return {
      idToken,
      user: {
        name: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL
      }
    };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

export const uploadProfilePicture = async (file, userId) => {
  if (!file) return null;
  const storageRef = ref(storage, `profile_pictures/${userId}_${Date.now()}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

export { auth, storage };
export default app;

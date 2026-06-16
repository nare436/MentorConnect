// Firebase configuration for frontend
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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
const googleProvider = new GoogleAuthProvider();

// Sign in with Google popup
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
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

export { auth };
export default app;

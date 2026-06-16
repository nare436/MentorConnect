// Firebase Admin SDK initialization for backend token verification
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin using environment variables
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Only initialize if credentials are provided
if (!firebaseConfig.projectId || firebaseConfig.projectId === 'your-firebase-project-id') {
  console.warn('⚠️  Firebase Admin SDK not configured.');

  module.exports = {
    auth: () => ({
      verifyIdToken: async () => {
        throw new Error('Firebase Admin SDK is not configured. Please set Firebase credentials in .env');
      }
    })
  };
} else {
  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(firebaseConfig)
      });
      console.log('✅ Firebase Admin SDK initialized');
    }
  } catch (err) {
    console.error('Firebase init error:', err);
  }

  module.exports = { auth: getAuth };
}

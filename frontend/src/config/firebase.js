// Firebase configuration for the frontend
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    'AIzaSyDYNdLXJkZl2t0_0NKLDb-I-bx12DGuiNo',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    'workspace-booking-system.firebaseapp.com',
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || 'workspace-booking-system',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'workspace-booking-system.appspot.com',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1060735424967',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:1060735424967:web:b5e59a61de03db86f0e1e2'
}

export default firebaseConfig

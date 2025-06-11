import { initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import type { Auth } from "firebase/auth"
import { Firestore, getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAOR4vOTV7sOenr9trFGd2RNDxye2o7q9I",
  authDomain: "murder-party-cb48e.firebaseapp.com",
  projectId: "murder-party-cb48e",
  storageBucket: "murder-party-cb48e.firebasestorage.app",
  messagingSenderId: "647471363260",
  appId: "1:647471363260:web:6ccdaf692480526df7ccb9",
  measurementId: "G-XY451LPFG9",
}

const app: FirebaseApp = initializeApp(firebaseConfig)

// Khởi tạo các dịch vụ Firebase
const auth: Auth = getAuth(app)
const db: Firestore = getFirestore(app) // Ví dụ nếu bạn dùng Firestore

const googleProvider = new GoogleAuthProvider() // Tạo một provider cho Google

export { app, auth, db, googleProvider }

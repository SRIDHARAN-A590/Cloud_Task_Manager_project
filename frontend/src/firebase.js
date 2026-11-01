import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyBqQ0NrtzLKcvJG8clXcDmuJfk04f1wqFU",
  authDomain: "fir-react-crud-d670d.firebaseapp.com",
  projectId: "fir-react-crud-d670d",
  storageBucket: "fir-react-crud-d670d.firebasestorage.app",
  messagingSenderId: "575631973359",
  appId: "1:575631973359:web:8093e4cbb9144c8c29741a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export default app;
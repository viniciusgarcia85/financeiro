import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCH_WBTMevs2dIRrbYJFJg_NónTojvauZM",
  authDomain: "financeiro-vinicius-44f20.firebaseapp.com",
  projectId: "financeiro-vinicius-44f20",
  storageBucket: "financeiro-vinicius-44f20.firebasestorage.app",
  messagingSenderId: "168810365301",
  appId: "1:168810365301:web:29d19dba0d0b950e32133c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

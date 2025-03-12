import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
   
    authDomain: "diary-darling.firebaseapp.com",
    projectId: "diary-darling",
    storageBucket: "diary-darling.firebasestorage.app",
    messagingSenderId: "1072132672596",
    appId: "1:1072132672596:web:b84ca3846ba961dcf831c1",
    measurementId: "G-64YD7PMBKX"
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

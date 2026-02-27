import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDylxHedoMEc-aV6TwEV4VIgUNefBzKRMQ",
  authDomain: "note-app-b3a2c.firebaseapp.com",
  databaseURL: "https://note-app-b3a2c-default-rtdb.firebaseio.com",
  projectId: "note-app-b3a2c",
  storageBucket: "note-app-b3a2c.firebasestorage.app",
  messagingSenderId: "911530465662",
  appId: "1:911530465662:web:dd6cc60c019c5797b03b2f",
  measurementId: "G-YJQMRJ15G1"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);

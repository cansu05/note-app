import { getDatabase } from "firebase/database";
import { app } from "./firebaseApp";

export const db = getDatabase(app);

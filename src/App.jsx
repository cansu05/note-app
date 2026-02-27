import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { AuthPage } from "./features/auth/AuthPage";
import { NotesPage } from "./features/notes/NotesPage";
import { auth } from "./lib/firebase";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <main className="auth-shell">Yükleniyor...</main>;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <header className="session-bar">
        <span>{user.email}</span>
        <button type="button" onClick={() => signOut(auth)}>
          Çıkış Yap
        </button>
      </header>
      <NotesPage />
    </>
  );
}

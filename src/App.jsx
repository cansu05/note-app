import { onAuthStateChanged, signOut } from "firebase/auth";
import { lazy, Suspense, useEffect, useState } from "react";
import { auth } from "./lib/firebase";

const AuthPage = lazy(() =>
  import("./features/auth/AuthPage").then((module) => ({ default: module.AuthPage }))
);
const NotesPage = lazy(() =>
  import("./features/notes/NotesPage").then((module) => ({ default: module.NotesPage }))
);

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
    return (
      <Suspense fallback={<main className="auth-shell">Yükleniyor...</main>}>
        <AuthPage />
      </Suspense>
    );
  }

  return (
    <>
      <header className="session-bar">
        <span>{user.displayName || user.email}</span>
        <button type="button" onClick={() => signOut(auth)}>
          Çıkış Yap
        </button>
      </header>
      <Suspense fallback={<main className="auth-shell">Yükleniyor...</main>}>
        <NotesPage />
      </Suspense>
    </>
  );
}

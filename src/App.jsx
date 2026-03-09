import { lazy, Suspense, useCallback, useEffect, useState } from "react";

const AuthPage = lazy(() =>
  import("./features/auth/AuthPage").then((module) => ({ default: module.AuthPage }))
);
const NotesPage = lazy(() =>
  import("./features/notes/NotesPage").then((module) => ({ default: module.NotesPage }))
);

export default function App() {
  const [authInstance, setAuthInstance] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = null;

    const setupAuthObserver = async () => {
      try {
        const [{ onAuthStateChanged }, { auth }] = await Promise.all([
          import("firebase/auth"),
          import("./lib/firebaseAuth")
        ]);
        if (cancelled) return;

        setAuthInstance(auth);
        unsubscribe = onAuthStateChanged(auth, (nextUser) => {
          setUser(nextUser);
          setLoading(false);
        });
      } catch {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void setupAuthObserver();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    if (!authInstance) return;
    const { signOut } = await import("firebase/auth");
    await signOut(authInstance);
  }, [authInstance]);

  if (loading) {
    return <main className="auth-shell">Yukleniyor...</main>;
  }

  if (!user) {
    return (
      <Suspense fallback={<main className="auth-shell">Yukleniyor...</main>}>
        <AuthPage />
      </Suspense>
    );
  }

  return (
    <>
      <header className="session-bar">
        <span>{user.displayName || user.email}</span>
        <button type="button" onClick={handleSignOut}>
          Cikis Yap
        </button>
      </header>
      <Suspense fallback={<main className="auth-shell">Yukleniyor...</main>}>
        <NotesPage />
      </Suspense>
    </>
  );
}

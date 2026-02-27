import React from "react";

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Unhandled UI error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="auth-shell">
          <section className="auth-card" role="alert" aria-live="assertive">
            <h1>Bir şeyler ters gitti</h1>
            <p className="auth-subtitle">
              Uygulama beklenmeyen bir hatayla karşılaştı. Lütfen sayfayı yenileyip tekrar dene.
            </p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

import React from 'react';

interface State {
  hasError: boolean;
}

/**
 * Last-resort safety net: if any component crashes while rendering, show a calm
 * message with a reload button instead of an empty screen.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) {
      console.error('App crashed:', error);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          padding: 24,
          textAlign: 'center',
          background: '#faf9f5',
          color: '#242522',
          fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0 }}>حدث خطأ غير متوقع</h1>
        <p style={{ margin: 0, color: '#777973' }}>
          نعتذر عن ذلك. جرّب إعادة تحميل الصفحة، وإن استمرت المشكلة عُد بعد قليل.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#23483f',
            color: '#faf9f5',
            border: 0,
            padding: '12px 28px',
            cursor: 'pointer',
            fontSize: 15,
          }}
        >
          إعادة التحميل
        </button>
      </div>
    );
  }
}

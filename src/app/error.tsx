'use client';

export default function ErrorPage({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100dvh',
      gap: '16px',
      padding: '24px',
      textAlign: 'center',
      background: 'var(--background)',
      color: 'var(--on-background)',
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Something went wrong</h1>
      <p style={{ color: 'var(--on-surface-variant)', maxWidth: '400px' }}>
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        style={{
          padding: '12px 24px',
          background: 'var(--primary)',
          color: 'var(--on-primary)',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}

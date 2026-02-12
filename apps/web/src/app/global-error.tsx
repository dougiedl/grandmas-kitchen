"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="error-panel" role="alert">
          <h2>Server error</h2>
          <p>There is a problem with server configuration.</p>
          <p>{error.message}</p>
          <button type="button" onClick={reset}>
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}

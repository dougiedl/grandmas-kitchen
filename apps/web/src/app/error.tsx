"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div role="alert" className="error-panel">
      <h2>Something went wrong in the kitchen.</h2>
      <p>Try reloading this screen. If it keeps happening, we will investigate it.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}

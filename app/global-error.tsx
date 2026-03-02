"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#0a0a0a",
          color: "#e5e5e5",
          fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
          }}
        >
          <div
            style={{ textAlign: "center", maxWidth: "480px", padding: "2rem" }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#dc2626",
                margin: "0 auto 1.5rem",
              }}
            />
            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: 600,
                marginBottom: "1rem",
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                color: "#737373",
                fontSize: "0.9rem",
                lineHeight: 1.7,
                marginBottom: "1.5rem",
              }}
            >
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "12px 24px",
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

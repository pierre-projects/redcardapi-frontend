/**
 * Simple loading spinner component.
 */
export default function LoadingSpinner({ size = 20, color }) {
  const spinnerColor = color || "var(--color-text-muted)";

  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        border: `2px solid ${spinnerColor}`,
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
      role="status"
      aria-label="Loading"
    >
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </span>
  );
}

/**
 * Loading state with message.
 */
export function LoadingMessage({ message = "Loading..." }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 16,
        color: "var(--color-text-muted)",
      }}
    >
      <LoadingSpinner />
      <span>{message}</span>
    </div>
  );
}

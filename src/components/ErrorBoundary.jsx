import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 32,
            textAlign: "center",
            maxWidth: 500,
            margin: "40px auto",
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
            }}
          >
            ⚠️
          </div>
          <h2 style={{ margin: "0 0 12px" }}>Something went wrong</h2>
          <p style={{ color: "var(--color-text-muted)", marginBottom: 20 }}>
            An unexpected error occurred. Please try again.
          </p>
          {this.state.error && (
            <pre
              style={{
                background: "var(--bg-tertiary)",
                padding: 12,
                borderRadius: 8,
                fontSize: 12,
                textAlign: "left",
                overflow: "auto",
                marginBottom: 20,
                color: "var(--error-border)",
              }}
            >
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={this.handleRetry}
            style={{
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              background: "var(--link-color)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

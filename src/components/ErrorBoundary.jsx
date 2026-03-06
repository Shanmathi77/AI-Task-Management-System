// frontend/src/components/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: "#fff" }}>
          <h2>Something went wrong</h2>
          <p>We caught an error in the UI. Check the console for details.</p>
          <pre style={{ whiteSpace: "pre-wrap", color: "#ddd" }}>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

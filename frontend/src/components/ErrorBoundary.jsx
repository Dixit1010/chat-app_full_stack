import { Component } from "react";

// Purely decorative visual extras (e.g. the WebGL auth background) should
// never be able to take down a whole page. Wrap them in this and render
// `fallback` (or nothing) if they throw.
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

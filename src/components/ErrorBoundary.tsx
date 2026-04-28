import { Component, ReactNode } from "react";

interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center px-6">
          <div className="max-w-md w-full panel p-8 text-center">
            <div className="label-mono mb-4">// runtime error</div>
            <h1 className="font-display text-2xl font-bold mb-3">Something went wrong</h1>
            <p className="text-muted-foreground text-sm mb-6 font-mono break-all">
              {this.state.error?.message ?? "Unknown error"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-sm bg-gradient-amber text-primary-foreground px-4 py-2 font-semibold text-sm hover:opacity-90 transition"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

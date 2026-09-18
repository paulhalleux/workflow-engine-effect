import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Workflow viewer crashed", error, info);
  }

  private reload = () => window.location.reload();

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="fatal-error">
        <div className="fatal-error__icon">
          <AlertTriangle size={24} />
        </div>
        <p className="eyebrow">Interface error</p>
        <h1>The workflow view stopped responding.</h1>
        <p>{this.state.error.message}</p>
        <Button onClick={this.reload}>
          <RotateCcw size={15} /> Reload explorer
        </Button>
      </main>
    );
  }
}

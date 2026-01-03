import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import MarketingApp from './marketingApp';

// Reuse the main frontend styles.
import '../../frontend/src/index.css';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log enough detail so production debugging isn't a guessing game.
    console.error('Marketing app crashed during render', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground mt-2">
            The marketing site failed to render. Check the console for details.
          </p>
          <pre className="mt-6 whitespace-pre-wrap rounded-xl border bg-muted/40 p-4 text-sm text-foreground/90 overflow-auto">
            {this.state.error.message || String(this.state.error)}
          </pre>
        </div>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MarketingApp />
      </BrowserRouter>
    </RootErrorBoundary>
  </React.StrictMode>,
);



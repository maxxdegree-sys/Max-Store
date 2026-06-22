import { Component } from 'react';

// Catches render-time errors in any child so a single broken component
// can never blank out / freeze the entire site (which would also make the
// cart drawer, navbar, etc. appear unresponsive).
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('App error caught by ErrorBoundary:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] grid place-items-center px-6 text-center">
          <div className="max-w-md">
            <h1 className="text-2xl font-extrabold text-brand-700">Something went wrong</h1>
            <p className="mt-2 text-ink-500">
              An unexpected error occurred while loading this page. Please reload to continue shopping.
            </p>
            <button onClick={this.handleReload} className="btn-primary mt-5">
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

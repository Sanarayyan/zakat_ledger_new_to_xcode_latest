import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: 'red', color: 'white', zIndex: 9999, position: 'relative' }}>
          <h1>Something went wrong.</h1>
          <p>Your saved information has not been cleared. Reopen the app to try again.</p>
          <button onClick={() => window.location.reload()}>Reopen app</button>
        </div>
      );
    }
    return this.props.children; 
  }
}

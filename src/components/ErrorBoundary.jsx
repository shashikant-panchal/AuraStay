import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AuraStay ErrorBoundary caught an exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-6 bg-white border border-rose-200 rounded-2xl shadow-sm text-center max-w-lg mx-auto space-y-4 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Module View Recovered
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              An unexpected condition occurred while displaying this module. Your database and booking records are safe.
            </p>
            {this.state.error?.message && (
              <p className="text-[11px] font-mono text-rose-600 bg-rose-50 p-2 rounded-lg mt-2 overflow-x-auto text-left">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex items-center justify-center space-x-2 pt-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Try Again
            </button>
            <button
              onClick={this.handleReset}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload AuraStay</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

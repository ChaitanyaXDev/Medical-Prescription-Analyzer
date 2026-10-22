import React from 'react';

export default function Header({ onReset }) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Name */}
          <button
            onClick={onReset}
            className="flex items-center space-x-3 text-left group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1 -ml-1 transition-transform"
            aria-label="MedScript Analyzer Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                <path d="m8.5 8.5 7 7" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
                MedScript <span className="text-blue-600">Analyzer</span>
              </span>
              <span className="hidden sm:block text-xs text-gray-500 font-medium">
                AI-Powered Prescription Analysis
              </span>
            </div>
          </button>

          {/* Simple Navigation */}
          <nav className="flex items-center space-x-1 sm:space-x-4">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              How it works
            </a>
            <a
              href="#upload-section"
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Upload
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}

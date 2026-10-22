import React from 'react';
import Disclaimer from './Disclaimer';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-16 sm:mt-24 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Medical disclaimer in footer */}
        <div className="mb-10">
          <Disclaimer />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-gray-100">
          {/* Brand & Mission */}
          <div className="flex items-center space-x-3 text-center md:text-left">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                <path d="m8.5 8.5 7 7" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-gray-900 tracking-tight">
                MedScript <span className="text-blue-600">Analyzer</span>
              </span>
              <p className="text-xs text-gray-500">
                AI-Powered Prescription Analysis with Spoken Audio Explanations
              </p>
            </div>
          </div>

          {/* Quick links & Privacy */}
          <div className="flex items-center space-x-6 text-xs text-gray-500">
            <span>In-Memory Processing</span>
            <span>•</span>
            <span>Zero Persistent Storage</span>
            <span>•</span>
            <span>HIPAA Conscious Architecture</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>© {currentYear} MedScript Analyzer. All rights reserved. For educational and informational assistance only.</p>
        </div>
      </div>
    </footer>
  );
}

import React from 'react';

export default function Disclaimer({ className = '' }) {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-amber-200 bg-amber-50/90 p-4 sm:p-5 flex items-start gap-3.5 text-amber-900 shadow-sm ${className}`}
    >
      <div className="p-1 rounded-lg bg-amber-100 text-amber-700 flex-shrink-0 mt-0.5">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <div className="text-xs sm:text-sm leading-relaxed">
        <strong className="font-bold text-amber-950 block sm:inline mr-1">
          Important Medical Disclaimer:
        </strong>
        <span>
          AI-generated information, not medical advice. Verify with your doctor or pharmacist before taking any medicine. Never alter or discontinue your prescribed medication based solely on this automated summary.
        </span>
      </div>
    </div>
  );
}

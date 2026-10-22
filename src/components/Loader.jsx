import React, { useState, useEffect } from 'react';

const messages = [
  'Reading prescription…',
  'Identifying medicines…',
  'Analyzing dosages & timings…',
  'Checking potential interactions…',
  'Preparing explanation…'
];

export default function Loader() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-16 sm:py-20 px-4 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
        {/* Animated Icon */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-30" />
          <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-600 flex items-center justify-center text-blue-600 shadow-inner">
            <svg
              className="w-8 h-8 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>

        {/* Rotating message */}
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight transition-all duration-300">
          {messages[msgIndex]}
        </h3>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          Our vision AI is inspecting handwriting, dosage amounts, and clinical indications. This usually takes 5-15 seconds.
        </p>

        {/* Loading skeleton placeholder */}
        <div className="mt-10 max-w-2xl mx-auto space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded-lg w-3/4 mx-auto" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-100 rounded-xl" />
            <div className="h-20 bg-gray-100 rounded-xl" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto" />
            <div className="h-4 bg-gray-100 rounded w-4/6 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

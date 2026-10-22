import React from 'react';

const steps = [
  {
    number: '01',
    title: 'Upload Prescription',
    description: 'Take a clear photo or upload an image (JPG, PNG, WEBP) or PDF of your doctor prescription.',
    icon: (
      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100'
  },
  {
    number: '02',
    title: 'AI Analyzes',
    description: 'Vision AI extracts legible medication names, dosages, timings, potential interactions, and safety alerts.',
    icon: (
      <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-100'
  },
  {
    number: '03',
    title: 'Read and Listen',
    description: 'Review structured medication cards, identify unclear handwriting warnings, and listen to spoken audio summaries.',
    icon: (
      <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
    ),
    bgColor: 'bg-green-50',
    borderColor: 'border-green-100'
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-600 mb-2">
            Simple 3-Step Process
          </h2>
          <p className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            How MedScript Analyzer Works
          </p>
          <p className="mt-3 text-base sm:text-lg text-gray-600">
            From handwritten prescription to clear, intelligible medicine details and voice playback in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => (
            <div
              key={step.number}
              className={`relative rounded-2xl border ${step.borderColor} ${step.bgColor} p-6 sm:p-8 flex flex-col justify-between hover:shadow-lg transition-all`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-black text-gray-300 tracking-wider">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-gray-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

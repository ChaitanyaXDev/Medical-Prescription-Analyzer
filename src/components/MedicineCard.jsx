import React from 'react';

export default function MedicineCard({ medicine, index }) {
  const isUnclear = (val) => !val || val.toLowerCase() === 'unclear';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            {index + 1}
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              {medicine.name || 'Unnamed Medication'}
              {isUnclear(medicine.name) && (
                <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                  Unclear
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* Strength Badge */}
        {medicine.strength && (
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              isUnclear(medicine.strength)
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
            }`}
          >
            {medicine.strength}
          </span>
        )}
      </div>

      {/* Dosage Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        {/* Dose */}
        <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100">
          <span className="block text-xs text-gray-500 font-medium">Dose</span>
          <span className={`text-sm font-semibold ${isUnclear(medicine.dose) ? 'text-amber-600 italic' : 'text-gray-800'}`}>
            {medicine.dose || 'unclear'}
          </span>
        </div>

        {/* Frequency */}
        <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100">
          <span className="block text-xs text-gray-500 font-medium">Frequency</span>
          <span className={`text-sm font-semibold ${isUnclear(medicine.frequency) ? 'text-amber-600 italic' : 'text-gray-800'}`}>
            {medicine.frequency || 'unclear'}
          </span>
        </div>

        {/* Timing */}
        <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100">
          <span className="block text-xs text-gray-500 font-medium">Timing</span>
          <span className={`text-sm font-semibold ${isUnclear(medicine.timing) ? 'text-amber-600 italic' : 'text-gray-800'}`}>
            {medicine.timing || 'unclear'}
          </span>
        </div>

        {/* Duration */}
        <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100">
          <span className="block text-xs text-gray-500 font-medium">Duration</span>
          <span className={`text-sm font-semibold ${isUnclear(medicine.duration) ? 'text-amber-600 italic' : 'text-gray-800'}`}>
            {medicine.duration || 'unclear'}
          </span>
        </div>
      </div>

      {/* Purpose */}
      {medicine.purpose && (
        <div className="pt-2 text-xs sm:text-sm text-gray-600 bg-blue-50/40 p-3 rounded-lg border border-blue-100/60 flex items-start gap-2">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong className="font-semibold text-gray-800">Purpose: </strong>
            <span>{medicine.purpose}</span>
          </div>
        </div>
      )}
    </div>
  );
}

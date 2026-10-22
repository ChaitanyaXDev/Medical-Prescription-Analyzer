import React, { useState } from 'react';
import MedicineCard from './MedicineCard';
import AudioPlayer from './AudioPlayer';
import Disclaimer from './Disclaimer';
import { generatePrescriptionPDF } from '../lib/pdf';

export default function ResultView({ data, onReset }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      let text = `MedScript Analyzer - Prescription Analysis\n`;
      text += `==========================================\n\n`;

      if (data.patient?.name && data.patient.name !== 'unclear') {
        text += `Patient: ${data.patient.name}`;
        if (data.patient.age && data.patient.age !== 'unclear') text += ` (${data.patient.age} yrs)`;
        if (data.patient.gender && data.patient.gender !== 'unclear') text += `, ${data.patient.gender}`;
        text += `\n`;
      }

      if (data.doctor?.name && data.doctor.name !== 'unclear') {
        text += `Doctor: ${data.doctor.name}`;
        if (data.doctor.clinic && data.doctor.clinic !== 'unclear') text += ` - ${data.doctor.clinic}`;
        text += `\n`;
      }

      text += `\nMEDICINES:\n`;
      if (Array.isArray(data.medicines)) {
        data.medicines.forEach((m, idx) => {
          text += `${idx + 1}. ${m.name || 'Unnamed'}`;
          if (m.strength && m.strength !== 'unclear') text += ` [${m.strength}]`;
          text += `\n   - Dose: ${m.dose || 'unclear'}\n   - Frequency: ${m.frequency || 'unclear'}\n   - Timing: ${m.timing || 'unclear'}\n   - Duration: ${m.duration || 'unclear'}\n   - Purpose: ${m.purpose || 'unclear'}\n\n`;
        });
      }

      if (Array.isArray(data.interactions) && data.interactions.length > 0) {
        text += `POTENTIAL INTERACTIONS:\n${data.interactions.map((i) => `• ${i}`).join('\n')}\n\n`;
      }

      if (Array.isArray(data.precautions) && data.precautions.length > 0) {
        text += `PRECAUTIONS:\n${data.precautions.map((p) => `• ${p}`).join('\n')}\n\n`;
      }

      if (Array.isArray(data.sideEffects) && data.sideEffects.length > 0) {
        text += `SIDE EFFECTS:\n${data.sideEffects.map((s) => `• ${s}`).join('\n')}\n\n`;
      }

      if (data.instructions && data.instructions.trim()) {
        text += `DOCTOR INSTRUCTIONS:\n${data.instructions}\n\n`;
      }

      if (Array.isArray(data.uncertainFields) && data.uncertainFields.length > 0) {
        text += `UNCLEAR ITEMS (Verify with Doctor):\n${data.uncertainFields.map((u) => `• ${u}`).join('\n')}\n\n`;
      }

      text += `Disclaimer: AI-generated information, not medical advice. Verify with your doctor or pharmacist.`;

      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDownloadPDF = () => {
    generatePrescriptionPDF(data);
  };

  const hasPatientInfo =
    data.patient &&
    ((data.patient.name && data.patient.name !== 'unclear') ||
      (data.patient.age && data.patient.age !== 'unclear') ||
      (data.patient.gender && data.patient.gender !== 'unclear'));

  const hasDoctorInfo =
    data.doctor &&
    ((data.doctor.name && data.doctor.name !== 'unclear') ||
      (data.doctor.clinic && data.doctor.clinic !== 'unclear'));

  const hasInteractions = Array.isArray(data.interactions) && data.interactions.length > 0;
  const hasPrecautions = Array.isArray(data.precautions) && data.precautions.length > 0;
  const hasSideEffects = Array.isArray(data.sideEffects) && data.sideEffects.length > 0;
  const hasUnclear = Array.isArray(data.uncertainFields) && data.uncertainFields.length > 0;

  return (
    <section className="py-12 sm:py-16 bg-gray-50/60 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header & Action Buttons */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                <span className="w-2 h-2 rounded-full bg-green-600" />
                Analysis Complete
              </span>
              <span className="text-xs text-gray-400">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Prescription Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Structured medications, safe dosage timings, and patient advice
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl border border-gray-300 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-700">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl border border-gray-300 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download PDF</span>
            </button>

            <button
              onClick={onReset}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Analyze Another</span>
            </button>
          </div>
        </div>

        {/* Audio Player Card */}
        <AudioPlayer summaryText={data.audioSummary} />

        {/* Patient & Doctor Cards (if present) */}
        {(hasPatientInfo || hasDoctorInfo) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hasPatientInfo && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-blue-600 font-semibold text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Patient Information</span>
                </div>
                <div className="space-y-1 text-sm text-gray-700">
                  {data.patient?.name && data.patient.name !== 'unclear' && (
                    <p><strong className="text-gray-900">Name:</strong> {data.patient.name}</p>
                  )}
                  {data.patient?.age && data.patient.age !== 'unclear' && (
                    <p><strong className="text-gray-900">Age:</strong> {data.patient.age}</p>
                  )}
                  {data.patient?.gender && data.patient.gender !== 'unclear' && (
                    <p><strong className="text-gray-900">Gender:</strong> {data.patient.gender}</p>
                  )}
                </div>
              </div>
            )}

            {hasDoctorInfo && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-indigo-600 font-semibold text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Prescribing Doctor</span>
                </div>
                <div className="space-y-1 text-sm text-gray-700">
                  {data.doctor?.name && data.doctor.name !== 'unclear' && (
                    <p><strong className="text-gray-900">Doctor:</strong> {data.doctor.name}</p>
                  )}
                  {data.doctor?.clinic && data.doctor.clinic !== 'unclear' && (
                    <p><strong className="text-gray-900">Clinic / Hospital:</strong> {data.doctor.clinic}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Medicines Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Prescribed Medications ({data.medicines?.length || 0})</span>
            </h3>
          </div>

          {Array.isArray(data.medicines) && data.medicines.length > 0 ? (
            <div className="space-y-4">
              {data.medicines.map((med, index) => (
                <MedicineCard key={index} medicine={med} index={index} />
              ))}
            </div>
          ) : (
            <div className="p-6 bg-white rounded-xl border border-gray-200 text-center text-gray-500">
              No specific medications could be legibly identified on this prescription.
            </div>
          )}
        </div>

        {/* Drug Interactions Section */}
        {hasInteractions && (
          <div className="bg-amber-50/80 rounded-2xl border border-amber-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-amber-900 flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Potential Interactions & Medication Warnings</span>
            </h3>
            <ul className="space-y-2 text-sm text-amber-900">
              {data.interactions.map((interaction, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{interaction}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Precautions and Side Effects Grid */}
        {(hasPrecautions || hasSideEffects) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Precautions */}
            {hasPrecautions && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Precautions</span>
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  {data.precautions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Side Effects */}
            {hasSideEffects && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h4 className="text-sm font-bold text-red-900 flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Possible Side Effects</span>
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  {data.sideEffects.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Doctor's Instructions */}
        {data.instructions && data.instructions.trim() && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Doctor's General Instructions & Follow-up Notes</span>
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {data.instructions}
            </p>
          </div>
        )}

        {/* Unclear items warning box */}
        {hasUnclear && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50/90 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-lg bg-yellow-100 text-yellow-800 flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-yellow-900">
                  Unclear / Illegible Items (Please Confirm with Doctor)
                </h4>
                <p className="text-xs sm:text-sm text-yellow-800 mt-1 mb-2">
                  The following fields could not be confidently deciphered from handwriting or image quality. Do not guess these dosages:
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.uncertainFields.map((field, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-yellow-200/70 text-yellow-900 font-mono text-xs font-semibold"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer Banner on Results */}
        <Disclaimer />
      </div>
    </section>
  );
}

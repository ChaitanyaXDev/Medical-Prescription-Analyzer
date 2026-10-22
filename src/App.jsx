import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import UploadBox from './components/UploadBox';
import Loader from './components/Loader';
import ResultView from './components/ResultView';
import Footer from './components/Footer';
import { analyzePrescription } from './lib/api';

export default function App() {
  const [appState, setAppState] = useState('idle'); // 'idle' | 'loading' | 'result' | 'error'
  const [resultData, setResultData] = useState(null);
  const [errorDetails, setErrorDetails] = useState('');

  const handleAnalyze = async (base64Image, mimeType, filename) => {
    setAppState('loading');
    setErrorDetails('');

    try {
      const data = await analyzePrescription(base64Image, mimeType);
      setResultData(data);
      setAppState('result');
      // Scroll smoothly to results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorDetails(err.message || 'An error occurred during prescription analysis.');
      setAppState('error');
    }
  };

  const handleReset = () => {
    setAppState('idle');
    setResultData(null);
    setErrorDetails('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHeroUploadClick = () => {
    if (appState === 'result' || appState === 'error') {
      handleReset();
    }
    setTimeout(() => {
      const el = document.getElementById('upload-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <Header onReset={handleReset} />

      <main className="flex-1">
        {/* If in idle or loading, show Hero & HowItWorks */}
        {appState === 'idle' && (
          <>
            <Hero onUploadClick={handleHeroUploadClick} />
            <HowItWorks />
            <UploadBox onAnalyze={handleAnalyze} isLoading={false} />
          </>
        )}

        {/* Loading state */}
        {appState === 'loading' && (
          <div className="pt-8">
            <Loader />
          </div>
        )}

        {/* Error state */}
        {appState === 'error' && (
          <div className="py-16 px-4 max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 sm:p-10">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Analysis Unsuccessful
              </h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {errorDetails}
              </p>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Upload a Clearer Prescription
              </button>
            </div>
          </div>
        )}

        {/* Result state */}
        {appState === 'result' && resultData && (
          <ResultView data={resultData} onReset={handleReset} />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

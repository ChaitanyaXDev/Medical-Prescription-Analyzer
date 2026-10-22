import React, { useState, useEffect, useRef } from 'react';

export default function AudioPlayer({ summaryText }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (!allVoices || allVoices.length === 0) return;

      // Filter and prioritize English, Hindi, and Marathi
      const preferred = allVoices.filter((v) => {
        const lang = v.lang.toLowerCase();
        return lang.startsWith('en') || lang.startsWith('hi') || lang.startsWith('mr');
      });

      const listToUse = preferred.length > 0 ? preferred : allVoices;
      setVoices(listToUse);

      if (!selectedVoiceUri && listToUse.length > 0) {
        // default to first english voice or first available
        const defaultVoice = listToUse.find((v) => v.lang.toLowerCase().startsWith('en')) || listToUse[0];
        setSelectedVoiceUri(defaultVoice.voiceURI);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    if (!summaryText) return;

    const utterance = new SpeechSynthesisUtterance(summaryText);
    utteranceRef.current = utterance;
    utterance.rate = rate;

    if (selectedVoiceUri) {
      const selected = voices.find((v) => v.voiceURI === selectedVoiceUri);
      if (selected) {
        utterance.voice = selected;
        utterance.lang = selected.lang;
      }
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleRateChange = (newRate) => {
    setRate(newRate);
    if (isPlaying) {
      // Re-trigger with new rate seamlessly
      handleStop();
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(summaryText);
        utteranceRef.current = utterance;
        utterance.rate = newRate;
        if (selectedVoiceUri) {
          const selected = voices.find((v) => v.voiceURI === selectedVoiceUri);
          if (selected) {
            utterance.voice = selected;
            utterance.lang = selected.lang;
          }
        }
        utterance.onstart = () => {
          setIsPlaying(true);
          setIsPaused(false);
        };
        utterance.onend = () => {
          setIsPlaying(false);
          setIsPaused(false);
        };
        window.speechSynthesis.speak(utterance);
      }, 50);
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 text-center">
        Text-to-speech audio explanation is not supported in this browser.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-200/80 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
              Audio Explanation
              {isPlaying && (
                <span className="flex items-center gap-1 text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  Playing
                </span>
              )}
              {isPaused && (
                <span className="text-xs font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Paused
                </span>
              )}
            </h4>
            <p className="text-xs text-gray-600">
              Listen to a clear spoken explanation of your prescription instructions
            </p>
          </div>
        </div>

        {/* Voice Selector */}
        {voices.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="voice-select" className="text-xs text-gray-500 font-medium">
              Voice:
            </label>
            <select
              id="voice-select"
              value={selectedVoiceUri}
              onChange={(e) => setSelectedVoiceUri(e.target.value)}
              className="text-xs bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Spoken Text Preview / Summary */}
      <div className="bg-white/90 rounded-xl p-3.5 mb-5 border border-blue-100 text-xs sm:text-sm text-gray-700 leading-relaxed max-h-36 overflow-y-auto">
        <p className="italic text-gray-800">
          "{summaryText || 'Your prescription summary will be narrated here.'}"
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-blue-100/70">
        {/* Play / Pause / Stop */}
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {isPaused ? 'Resume' : 'Listen Now'}
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
              Pause
            </button>
          )}

          <button
            onClick={handleStop}
            disabled={!isPlaying && !isPaused}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-40 disabled:hover:bg-white rounded-lg text-xs sm:text-sm font-medium border border-gray-200 transition-colors focus:outline-none"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
            Stop
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 font-medium mr-1">Speed:</span>
          {[0.75, 1, 1.25].map((s) => (
            <button
              key={s}
              onClick={() => handleRateChange(s)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                rate === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef, useCallback } from "react";
import { preprocessImage, readAsDataURL } from "../lib/imagePreprocess";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"];

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadBox({ onAnalyze, isLoading }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [preprocessOpts, setPreprocessOpts] = useState({ enhance: true, grayscale: false, resize: true });
  const [preprocessing, setPreprocessing] = useState(false);
  const [preprocessInfo, setPreprocessInfo] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = useCallback(async (selectedFile) => {
    setErrorMessage("");
    setPreprocessInfo(null);
    setProcessedPreviewUrl(null);
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setErrorMessage("Unsupported file format. Please upload JPG, PNG, WEBP, or PDF.");
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File too large (${formatFileSize(selectedFile.size)}). Max is 10 MB.`);
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);

      // Run preprocessing preview
      setPreprocessing(true);
      try {
        const result = await preprocessImage(selectedFile, preprocessOpts);
        if (result.wasProcessed && result.dataUrl) {
          setProcessedPreviewUrl(result.dataUrl);
          setPreprocessInfo({
            originalSize: result.originalSize,
            processedSize: result.processedSize,
            reduction: Math.round((1 - result.processedSize / result.originalSize) * 100)
          });
        }
      } catch {
        // preprocessing failed silently — original will be used
      } finally {
        setPreprocessing(false);
      }
    } else {
      setPreviewUrl(null);
    }
  }, [preprocessOpts]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setProcessedPreviewUrl(null);
    setPreprocessInfo(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyzeClick = async () => {
    if (!file) { setErrorMessage("Please select or drop a prescription image first."); return; }

    try {
      let finalBlob = file;

      if (file.type.startsWith("image/") && (preprocessOpts.enhance || preprocessOpts.grayscale || preprocessOpts.resize)) {
        setPreprocessing(true);
        try {
          const result = await preprocessImage(file, preprocessOpts);
          finalBlob = result.blob;
        } catch {
          // fall back to original
        } finally {
          setPreprocessing(false);
        }
      }

      const dataUrl = await readAsDataURL(finalBlob);
      onAnalyze(dataUrl, file.type, file.name);
    } catch {
      setErrorMessage("Failed to prepare image. Please try again.");
    }
  };

  const activePreview = showOriginal ? previewUrl : (processedPreviewUrl || previewUrl);

  return (
    <section id="upload-section" className="py-12 sm:py-16 bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Upload Your Prescription</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Drag and drop your image or document, or browse from your device</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-8">
          {!file ? (
            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag}
              onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragActive ? "border-blue-500 bg-blue-50/50 scale-[0.99]" : "border-gray-300 hover:border-blue-400 bg-gray-50/50 hover:bg-gray-50"
              }`}
            >
              <input ref={fileInputRef} type="file" className="hidden"
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleChange} />
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Click to upload or drag &amp; drop</p>
                <p className="text-xs sm:text-sm text-gray-500 mb-4">Supports JPG, PNG, WEBP, and PDF up to 10 MB</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Browse Files
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl p-4 sm:p-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* Preview */}
                <div className="flex-shrink-0 w-full sm:w-auto">
                  <div className="relative w-full sm:w-44 h-40 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center shadow-sm">
                    {activePreview ? (
                      <img src={activePreview} alt="Prescription preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-red-600">
                        <svg className="w-12 h-12 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs font-semibold uppercase tracking-wider">PDF Document</span>
                      </div>
                    )}
                    {preprocessing && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Original / Enhanced toggle */}
                  {processedPreviewUrl && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <button onClick={() => setShowOriginal(true)}
                        className={`px-2 py-1 rounded transition-colors ${showOriginal ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        Original
                      </button>
                      <button onClick={() => setShowOriginal(false)}
                        className={`px-2 py-1 rounded transition-colors ${!showOriginal ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        Enhanced
                      </button>
                    </div>
                  )}
                </div>

                {/* File Details */}
                <div className="flex-1 w-full min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Ready for analysis</span>
                    <span className="text-xs text-gray-500 uppercase">{file.type.split("/")[1]}</span>
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 truncate" title={file.name}>{file.name}</h4>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Size: {formatFileSize(file.size)}</p>

                  {preprocessInfo && (
                    <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      Image enhanced for better OCR accuracy
                      {preprocessInfo.reduction > 0 && ` · ${preprocessInfo.reduction}% smaller`}
                    </p>
                  )}

                  {/* Preprocessing controls */}
                  {file.type.startsWith("image/") && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        Image Preprocessing
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer select-none">
                          <input type="checkbox" checked={preprocessOpts.enhance}
                            onChange={e => { setPreprocessOpts(p => ({...p, enhance: e.target.checked})); processFile(file); }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          Contrast enhance
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer select-none">
                          <input type="checkbox" checked={preprocessOpts.grayscale}
                            onChange={e => { setPreprocessOpts(p => ({...p, grayscale: e.target.checked})); processFile(file); }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          Grayscale
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer select-none">
                          <input type="checkbox" checked={preprocessOpts.resize}
                            onChange={e => { setPreprocessOpts(p => ({...p, resize: e.target.checked})); processFile(file); }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          Auto-resize
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading}
                      className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors focus:outline-none">
                      Change file
                    </button>
                    <button type="button" onClick={handleRemove} disabled={isLoading}
                      className="text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors focus:outline-none">
                      Remove
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {file && (
            <div className="mt-6 flex flex-col items-center justify-center">
              <button type="button" onClick={handleAnalyzeClick} disabled={isLoading || preprocessing}
                className="w-full sm:w-auto min-w-[240px] inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                {(isLoading || preprocessing) ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>{preprocessing ? "Enhancing image..." : "Analyzing Prescription..."}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>Analyze Prescription</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center text-xs text-gray-500 gap-1.5">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Your prescription is processed securely in memory and never stored on our servers.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

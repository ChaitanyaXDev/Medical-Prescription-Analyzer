# MedScript Analyzer — AI-Powered Medical Prescription Analyzer

An AI-powered web application that reads medical prescription images and PDFs, extracts structured medicine information, and provides audio explanations — with optional **Microsoft Azure AI Vision** OCR enhancement.

> Built as a portfolio project demonstrating computer vision, OCR, image preprocessing, and AI-assisted text extraction concepts from the Microsoft Azure AI Vision Coursera course.

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38BDF8?style=for-the-badge&logo=tailwindcss)
![Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?style=for-the-badge&logo=netlify)
![Azure](https://img.shields.io/badge/Azure%20AI%20Vision-Optional-0078D4?style=for-the-badge&logo=microsoftazure)

---

## Features

### Core (Always Available)
- Upload prescriptions as JPG, JPEG, PNG, WEBP, or PDF (up to 10 MB)
- Drag-and-drop file upload with instant image preview
- AI-powered prescription analysis via Google Gemini Vision API
- Structured output: patient info, doctor info, medicines, dosage, frequency, timing, duration
- Drug interaction warnings and side effect information
- Unclear/illegible field detection — never invents medicine names
- Audio explanation via browser Web Speech API (text-to-speech)
- Copy extracted text to clipboard
- Download analysis as a PDF report
- Rate limiting (10 requests per IP per minute)
- **Demo mode** when no API keys are configured (clearly labelled synthetic data)

### Computer Vision Enhancements (New)
- **Azure AI Vision Read OCR** (optional): Pre-extracts raw text from images using Microsoft's handwriting-capable OCR before sending to AI analysis
- **Client-side image preprocessing**: contrast enhancement, grayscale conversion, auto-resize, unsharp mask sharpening
- Original vs. Enhanced image preview toggle
- Raw OCR text panel with copy button (when Azure is configured)
- Processing pipeline badge showing which AI services were used

### Safety & Privacy
- All API keys are server-side only — never exposed to the browser
- Prescription images processed in memory only; nothing stored or logged
- Clear medical disclaimer on all results
- OCR limitation notice explaining AI accuracy constraints
- Demo mode clearly labelled to prevent confusion with real results

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Browser (React + Vite)                  │
│                                                          │
│  UploadBox → imagePreprocess.js → api.js                 │
│     ↓              ↓                ↓                    │
│  File select   Canvas API      fetch POST                │
│  Drag-drop     Enhance/resize  base64 image              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│           Netlify Serverless Function (Node.js)          │
│                netlify/functions/analyze.js               │
│                                                          │
│  1. [Optional] Azure AI Vision Read OCR                  │
│     POST /computervision/imageanalysis:analyze           │
│     → Extracts raw printed + handwritten text            │
│                                                          │
│  2. Google Gemini Vision API (primary AI)                │
│     gemini-2.0-flash → gemini-1.5-flash → gemini-1.5-pro│
│     OR NVIDIA NIM (meta/llama-3.2-vision)                │
│     → Structured prescription JSON analysis              │
│                                                          │
│  3. Demo mode (no API keys configured)                   │
│     → Clearly-labelled synthetic example data            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  ResultView (React)                       │
│                                                          │
│  • Demo mode banner (if demo)                            │
│  • Azure OCR badge + raw text panel (if Azure used)      │
│  • Patient / Doctor cards                                │
│  • Medicine cards (name, dose, frequency, timing, etc.)  │
│  • Interactions, Precautions, Side Effects               │
│  • Unclear fields warning                                │
│  • Audio player (Web Speech API)                         │
│  • Copy + Download PDF                                   │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + JSX |
| Styling | Tailwind CSS v4 |
| Bundler | Vite 7 |
| AI Provider | Google Gemini API (gemini-2.0-flash) |
| AI Provider 2 | NVIDIA NIM (meta/llama-3.2-vision, optional) |
| OCR Layer | Microsoft Azure AI Vision Read API (optional) |
| Image Preprocessing | Browser Canvas API (built-in) |
| Backend | Netlify Serverless Functions |
| PDF Export | jsPDF |
| TTS | Web Speech API (browser built-in) |
| Deployment | Netlify |

---

## Getting Started (Windows)

### Prerequisites
- Node.js 18 or higher (`node --version`)
- A Google Gemini API key (free at https://aistudio.google.com/app/apikey)
- Optional: Azure subscription for Azure AI Vision OCR

### Installation

```powershell
# 1. Navigate to project directory
cd "c:\Users\ASUS\Desktop\medical prescription analyzer"

# 2. Install dependencies
npm install

# 3. Copy environment template
copy .env.example .env

# 4. Edit .env with your API keys (see Environment Variables section)
notepad .env

# 5. Start development server
npm run dev
```

Open your browser at: **http://127.0.0.1:5173**

> The Vite dev server includes a built-in middleware that proxies `/.netlify/functions/analyze` to the local serverless function handler, so you do NOT need Netlify CLI for local development.

---

## Environment Variables

Edit `.env` in the project root (never commit this file!):

```env
# Required: Primary AI Provider
# Get a free key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: NVIDIA NIM (secondary AI provider)
# Get at: https://developer.nvidia.com/nim
NVIDIA_API_KEY=

# Optional: Azure AI Vision (OCR enhancement layer)
# Get from Azure Portal > AI Services > Computer Vision > Keys and Endpoint
AZURE_CV_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_CV_KEY=your_azure_key_here
```

### What Happens Without Each Key

| Key | Without it |
|-----|-----------|
| `GEMINI_API_KEY` | Demo mode activates — synthetic example data shown |
| `NVIDIA_API_KEY` | Gemini is used (no NVIDIA fallback) |
| `AZURE_CV_ENDPOINT` + `AZURE_CV_KEY` | Azure OCR step is skipped; Gemini analyzes image directly |

---

## Azure AI Vision Setup (Optional OCR Enhancement)

Azure AI Vision Read API can extract both **printed and handwritten** text from images before Gemini analyzes it. This improves accuracy on handwritten prescriptions.

### Steps to Configure
1. Create a free Azure account at https://azure.microsoft.com/free/
2. In the Azure Portal, create a resource: **AI Services** or **Computer Vision**
3. Go to **Keys and Endpoint** in your resource
4. Copy the **Endpoint** (e.g., `https://myresource.cognitiveservices.azure.com/`)
5. Copy **Key 1** or **Key 2**
6. Add both to your `.env` file

### What Azure OCR Does
- Calls the **Azure Computer Vision Image Analysis v4 API** (`imageanalysis:analyze` with `features=read`)
- Extracts all text including handwritten content into structured line-by-line output
- This raw text is sent alongside the image to Gemini for richer analysis
- If Azure OCR fails or is not configured, the app falls back to image-only analysis (no error shown to user)
- The raw extracted text is shown in the results panel so you can verify OCR accuracy

### Handwriting Limitation Note
> Azure AI Vision OCR can read handwriting, but medical handwriting is often highly stylised and abbreviated. OCR accuracy on handwritten prescriptions varies significantly by image quality, lighting, and writing style. Always verify extracted medicine names and dosages with your doctor or pharmacist.

---

## Image Preprocessing

Client-side preprocessing runs in the browser before uploading to the AI:

| Technique | Default | Effect |
|-----------|---------|--------|
| Contrast enhancement | ON | Boosts text contrast using S-curve, +10 brightness lift |
| Unsharp mask (sharpening) | ON | Sharpens text edges using blur-subtract technique |
| Auto-resize | ON | Downscales images larger than 2048px to reduce upload size |
| Grayscale conversion | OFF | Converts to luminance-weighted grayscale (useful for colorful backgrounds) |

You can toggle each option in the upload panel. A before/after preview toggle is available.

---

## Project Structure

```
medical-prescription-analyzer/
├── netlify/
│   └── functions/
│       └── analyze.js           # Serverless backend: Azure OCR + Gemini/NVIDIA AI
├── samples/
│   ├── prescription_antibiotic.jpg
│   ├── prescription_cardiology.jpg
│   └── prescription_diabetes.jpg
├── src/
│   ├── components/
│   │   ├── AudioPlayer.jsx      # Web Speech API TTS player
│   │   ├── Disclaimer.jsx       # Medical disclaimer banner
│   │   ├── Footer.jsx
│   │   ├── Header.jsx
│   │   ├── Hero.jsx             # Landing hero section
│   │   ├── HowItWorks.jsx
│   │   ├── Loader.jsx
│   │   ├── MedicineCard.jsx     # Individual medicine detail card
│   │   ├── ResultView.jsx       # Analysis results + OCR text panel
│   │   └── UploadBox.jsx        # Upload + preprocessing controls
│   ├── lib/
│   │   ├── api.js               # Frontend fetch client
│   │   ├── imagePreprocess.js   # Canvas API preprocessing utilities
│   │   └── pdf.js               # jsPDF report generator
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env                         # Your secrets (gitignored)
├── .env.example                 # Safe template to commit
├── .gitignore
├── index.html
├── netlify.toml
├── package.json
└── vite.config.js               # Vite + Tailwind + local function proxy
```

---

## Testing Instructions

### Quick Test (No API Keys Needed)
```powershell
npm run dev
# Open http://127.0.0.1:5173
# Upload any of the sample images from /samples/
# You will see Demo Mode results (clearly labelled)
```

### Test With Real AI Analysis
```powershell
# Add GEMINI_API_KEY to .env, then:
npm run dev
# Upload samples/prescription_antibiotic.jpg
# Should return real structured prescription data
```

### Test Scenarios

| Scenario | Expected Behaviour |
|----------|-------------------|
| Valid prescription image | Structured results with medicines, dosages |
| Blurry/low-quality image | Results with more `unclear` fields |
| Non-prescription image | Error: "does not appear to be a legible prescription" |
| PDF upload | Analysis (no preview thumbnail) |
| File > 10 MB | Client-side validation error |
| Wrong file type (.docx etc.) | Client-side validation error |
| No API keys | Demo mode results with amber banner |
| Azure configured | Blue OCR badge + raw text panel in results |
| Rate limit exceeded | 429 error with retry message |

---

## Deployment (Netlify)

1. Push this repository to GitHub
2. Connect the repo to https://netlify.com
3. Set environment variables in Netlify dashboard:
   - `GEMINI_API_KEY` (required)
   - `NVIDIA_API_KEY` (optional)
   - `AZURE_CV_ENDPOINT` (optional)
   - `AZURE_CV_KEY` (optional)
4. Build settings (already in `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`

---

## Known Limitations

1. **Handwritten prescriptions**: OCR accuracy on doctor handwriting is inherently limited. Azure AI Vision improves this but cannot guarantee perfect extraction.
2. **PDF support**: PDFs are sent to Gemini directly. Multi-page PDFs may only have the first page analysed.
3. **File size**: Maximum 10 MB. Large high-res photos should be auto-resized by preprocessing.
4. **Rate limiting**: 10 requests per IP per minute (in-memory, resets on server restart).
5. **Gemini model availability**: Falls through `gemini-2.0-flash → gemini-1.5-flash → gemini-1.5-pro` on model errors.
6. **Azure OCR for PDFs**: Azure Image Analysis API v4 does not support PDFs — PDF uploads skip the Azure OCR step.
7. **No persistent storage**: Results are not saved anywhere. Download the PDF if you need a record.

---

## Medical Safety & Privacy

> **IMPORTANT DISCLAIMER**

This application is an **information extraction and assistance tool only**. It is NOT a medical diagnosis system.

- Do NOT change, start, or stop any medication based solely on AI output
- Always verify extracted medicine names, dosages, and instructions with a **qualified healthcare professional** or licensed pharmacist
- OCR and AI systems can make errors, especially with handwritten or unclear text
- Prescription images are processed in server memory only and are **never stored, logged, or retained**
- API keys are never exposed to the frontend or committed to Git
- No personal health information is logged by this application

---

## What Was Improved (vs Original Project)

| Area | Original | After Improvement |
|------|----------|------------------|
| Gemini model names | `gemini-3.5-flash`, `gemini-3.6-flash` (non-existent) | `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro` (correct) |
| Azure AI Vision OCR | Not present | Integrated as optional pre-processing step |
| Image preprocessing | Not present | Canvas API: contrast, grayscale, resize, sharpening |
| Demo mode | Returns 500 error when no keys | Clearly-labelled synthetic demo results |
| Preprocessing UI | Not present | Toggle controls + before/after preview |
| OCR raw text | Not shown | Expandable panel with copy button (when Azure used) |
| Error messages | Generic | API_KEY_INVALID, safety filter, model 404 all handled |
| .env.example | Only Gemini key | All 4 keys with setup instructions |
| README | Basic | Comprehensive architecture, Azure setup, testing guide |
| Safety filter detection | Not handled | Detected and shows user-friendly message |

---

## What Requires API Credentials

| Feature | Credential Needed |
|---------|------------------|
| Real prescription analysis | `GEMINI_API_KEY` |
| NVIDIA vision model | `NVIDIA_API_KEY` |
| Azure OCR pre-processing | `AZURE_CV_ENDPOINT` + `AZURE_CV_KEY` |
| Demo mode, preprocessing, audio, PDF | None |

---

## License

MIT License — free to use and modify.

---

## Disclaimer

This app is for **informational and educational purposes only** and does not constitute medical advice. Always consult a licensed healthcare professional before making any medical decision.

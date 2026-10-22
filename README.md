# 🏥 MedScript Analyzer

An AI-powered medical prescription analyzer web app that reads prescription images/PDFs and provides detailed medicine explanations with audio support.

![MedScript Analyzer](https://img.shields.io/badge/Powered%20By-Gemini%20AI-blue?style=for-the-badge&logo=google)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite)
![Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?style=for-the-badge&logo=netlify)

## ✨ Features

- 📄 **Upload Prescriptions** — Supports image (JPG, PNG) and PDF formats
- 🤖 **AI Analysis** — Powered by Google Gemini to extract and explain medicines
- 🔊 **Audio Explanations** — Listen to prescription details via text-to-speech
- 💊 **Medicine Cards** — Detailed cards with dosage, usage, and warnings
- 📥 **PDF Export** — Download analysis as a PDF report
- 🛡️ **Medical Disclaimer** — Built-in safety reminders

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) (for local serverless functions)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ChaitanyaXDev/Medical-Prescription-Analyzer.git
cd Medical-Prescription-Analyzer

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and add your Gemini API key

# 4. Start the development server (with Netlify functions)
npx netlify dev
```

The app will be available at `http://localhost:8888`.

## 🔧 Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ **Never commit your `.env` file.** It's already in `.gitignore`.

## 📁 Project Structure

```
medical-prescription-analyzer/
├── netlify/
│   └── functions/
│       └── analyze.js        # Serverless function — Gemini API call
├── src/
│   ├── components/
│   │   ├── AudioPlayer.jsx   # Text-to-speech audio player
│   │   ├── Disclaimer.jsx    # Medical disclaimer modal
│   │   ├── Footer.jsx        # App footer
│   │   ├── Header.jsx        # App header
│   │   ├── Hero.jsx          # Landing hero section
│   │   ├── HowItWorks.jsx    # Feature walkthrough
│   │   ├── Loader.jsx        # Loading animation
│   │   ├── MedicineCard.jsx  # Individual medicine detail card
│   │   ├── ResultView.jsx    # Analysis results view
│   │   └── UploadBox.jsx     # File upload component
│   ├── lib/
│   ├── App.jsx               # Root component
│   ├── index.css             # Global styles (Tailwind)
│   └── main.jsx              # Entry point
├── .env.example              # Environment variable template
├── .gitignore
├── index.html                # HTML entry point
├── netlify.toml              # Netlify deployment config
├── package.json
└── vite.config.js            # Vite + Tailwind config
```

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + JSX |
| Styling | Tailwind CSS v4 |
| Bundler | Vite 7 |
| AI Model | Google Gemini API |
| Backend | Netlify Serverless Functions |
| PDF Export | jsPDF |
| Deployment | Netlify |

## 🚢 Deployment (Netlify)

1. Push this repo to GitHub
2. Connect the repo to [Netlify](https://netlify.com)
3. Set the `GEMINI_API_KEY` environment variable in Netlify dashboard
4. Netlify auto-deploys on every push to `main`

Build settings (already in `netlify.toml`):
- **Build command:** `npm run build`
- **Publish directory:** `dist`

## 📜 License

MIT License — feel free to use and modify.

## ⚠️ Disclaimer

This app is for **informational purposes only** and does not constitute medical advice. Always consult a licensed healthcare professional.

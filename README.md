# 📱 BizPocket (PocketScan)

BizPocket is a modern Progressive Web Application (PWA) designed for scanning, organizing, and managing business documents with on-device OCR, AI-powered structuring, QR code detection, and secure Supabase cloud storage.

## 🚀 Key Features

- **Document Scanning**: Instant capture via device camera or file upload.
- **OCR Engine**: On-device Optical Character Recognition powered by Tesseract.js.
- **AI Text Structuring**: Groq LLM API parses unstructured OCR text into typed data (Business Cards, Invoices, Receipts).
- **QR Code Scanning**: Built-in QR scanner supporting LinkedIn profiles and contact details (html5-qrcode).
- **Password Vault**: Encrypted client-side credential storage with master password protection.
- **Cross-Platform PWA**: Installable on Android, iOS, and Desktop with offline caching service worker.
- **Supabase Backend**: Auth (Email + OAuth), PostgreSQL database with Row-Level Security (RLS), and file storage.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 7, TailwindCSS 4, Lucide Icons, React Router 7
- **OCR & Vision**: Tesseract.js, html5-qrcode
- **AI / LLM**: Groq Cloud API (`llama-3.3-70b-versatile` / `mixtral-8x7b-32768`)
- **Backend & Auth**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

Required keys:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous public key
- `VITE_GROQ_API_KEY`: Groq API key for AI text structuring

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## 📖 Complete Documentation
For full architectural diagrams, database schemas, API specs, and roadmap, see [`BIZPOCKET_PROJECT_DOCUMENTATION.md`](./BIZPOCKET_PROJECT_DOCUMENTATION.md).

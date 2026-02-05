# RedCard Frontend

Frontend application for **RedCardGenerator**, a multilingual "Know Your Rights" card generator.
This app provides the user interface for selecting languages, previewing card content, and downloading generated PDF cards from the backend API.

---

## Overview

The frontend is built with **Vite + React** and communicates with a separate FastAPI backend (`redcard-backend`) that handles:
- Translation loading
- Font selection and script detection
- PDF generation

This repository contains **only the frontend UI**.

---

## Features

- **Searchable Language Picker** - Filter languages by name or code with a custom dropdown
- **Card Preview** - View card metadata, source attribution, and raw JSON content
- **Copy to Clipboard** - One-click copy of card JSON data
- **PDF Download** - Generate PDFs with configurable layouts (4, 6, 8, or 12 cards per page)
- **Dark Mode** - Toggle between light and dark themes (persisted to localStorage)
- **Language Persistence** - Selected language is remembered across sessions
- **Error Recovery** - Error boundary catches crashes and provides a retry option
- **Font Warnings** - Alerts when required fonts aren't available for a language
- **RTL Support** - Indicates right-to-left languages
- **Source Attribution** - Displays translation source, verification status, and links

---

## Tech Stack

- **React 19**
- **Vite**
- **JavaScript (ES modules)**
- **Fetch API**
- **CSS Variables** (theming)

---

## Project Structure

```
redcard-frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── CardPreview.jsx      # Card data display with copy button
│   │   ├── ErrorBoundary.jsx    # Crash recovery wrapper
│   │   ├── FontWarning.jsx      # Missing font alerts
│   │   ├── LanguagePicker.jsx   # Searchable language dropdown
│   │   ├── LayoutPicker.jsx     # Cards per page selector
│   │   ├── LoadingSpinner.jsx   # Loading indicator
│   │   ├── PdfDownloadButton.jsx# PDF generation trigger
│   │   └── ThemeToggle.jsx      # Dark/light mode switch
│   ├── hooks/
│   │   ├── useCard.js
│   │   └── useLanguages.js
│   ├── api.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- The `redcard-backend` API running locally or accessible remotely

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE=http://localhost:8000
```

If not provided, defaults to `http://localhost:8000`.

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173` by default.

### Production Build

```bash
npm run build
npm run preview
```

---

## API Endpoints Used

| Endpoint | Description |
|----------|-------------|
| `GET /api/languages` | List available languages |
| `GET /api/card/{code}` | Get card data for a language |
| `GET /api/config` | Get app configuration |
| `GET /api/render/{code}?cards_per_page=N` | Generate PDF |

---

## License

MIT

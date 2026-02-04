# RedCard Frontend

Frontend application for **RedCardGenerator**, a multilingual “Know Your Rights” card generator.  
This app provides the user interface for selecting languages, previewing card content, and downloading generated PDF cards from the backend API.

---

## Overview

The frontend is built with **Vite + React** and communicates with a separate FastAPI backend (`redcard-backend`) that handles:
- Translation loading
- Font selection and script detection
- PDF generation

This repository contains **only the frontend UI**.

---

## Tech Stack

- **React**
- **Vite**
- **JavaScript (ES modules)**
- **Fetch API**
- **CSS**

---

## Project Structure
redcard-frontend/
├── public/
├── src/
│ ├── assets/ # Static assets
│ ├── components/ # UI components
│ ├── hooks/ # Custom hooks (API interaction)
│ │ ├── useLanguages.js
│ │ └── useCard.js
│ ├── api.js # Centralized API helpers
│ ├── App.jsx # Root component
│ ├── main.jsx # React entry point
│ └── index.css
├── .env.example # Example environment variables
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md

---

## Environment Variables

The frontend expects the backend API base URL to be provided via an environment variable.

Create a `.env` file (not committed) based on `.env.example`:

```env
VITE_API_BASE=http://localhost:8000

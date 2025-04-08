# BioVocab - High School Biology Vocabulary App

A mobile-first web application for learning biology vocabulary in multiple languages.

## Technical Stack

- **Frontend Framework:** Vue 3 + Vite (Mobile-first responsive design)
  - Lightweight, fast hot-reloading, suitable for educational interactive development
- **UI Component Library:** Quasar Framework (Vue-based cross-platform framework)
  - Built-in Material Design components, PWA support
- **Data Storage:** Google Sheets API + LocalStorage
  - Maintenance-free database, teachers can maintain vocabulary through Excel
- **Deployment Platform:** Vercel static hosting
  - Automatic SSL, global CDN, custom domain support
- **Authentication System:** WeChat scan login (using official JS-SDK)
  - High adoption rate among students in China, passwordless security

## Features

- User authentication (login/signup)
- Learning dashboard with progress tracking
- Multiple learning modules for biology topics
- Flashcard-based vocabulary learning
- Quiz system with instant feedback
- Daily goals and streak tracking

## Project Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Data Management

Teachers can update vocabulary lists by editing a Google Sheet. The app will fetch the latest data using the Google Sheets API.

## Deployment

The app is configured for deployment on Vercel with automatic CI/CD.

```bash
# Deploy to Vercel
vercel
```

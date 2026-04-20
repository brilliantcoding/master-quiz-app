# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (frontend only, proxies /api/* to port 3001)
npm run dev

# Backend Express server (NVIDIA API proxy + static file serving)
npm run server

# Run both concurrently
npm run dev:all

# Production build
npm run build

# Serve production build via Express
npm start

# Lint
npm run lint
```

There are no tests in this project.

## Environment Variables

Copy `.env` and fill in keys. Required for each AI provider:

- `NVIDIA_API_KEY` — used by the Express server (`server.js`) for the NVIDIA cascade. Set this (not `VITE_NVIDIA_API_KEY`) for production.
- `VITE_ANTHROPIC_API_KEY` — used client-side by `claude-haiku.js` (only needed when Free AI is disabled).
- Firebase vars (`VITE_FIREBASE_*`) — optional; falls back to `localStorage` if not set.

The Free AI toggle (NVIDIA) is on by default and stored in `localStorage`. The Claude Haiku path is available as a fallback in dev.

## Architecture

This is a single-page React app (Vite) with a thin Express backend.

### Data flow

1. **SetupScreen** collects grade (1–12), subject, difficulty, question count, and timer settings.
2. **App.jsx** calls `generateQuizQuestions` from `aiService.js`, which routes to either NVIDIA (via `/api/nvidia` proxy) or Claude Haiku (direct client call).
3. Questions are normalized by `formatQuestions` in `quizUtils.js` — this step converts `correctAnswer` text → `correctIndex` integer, which is the authoritative field used everywhere downstream.
4. **useQuiz** hook owns all quiz state (phase machine: `setup → loading → quiz → results`) and computes metrics.
5. **ResultsScreen** saves results via `firebase.js`, which writes to Firestore if configured and always writes a summary to `localStorage`.

### Key design decisions

- **`correctIndex` derivation**: AI models return `correctAnswer` as text. `formatQuestions` matches it against `options[]` to produce `correctIndex`. Do not trust any `correctIndex` field from the AI — always re-derive it from `correctAnswer` text matching.
- **NVIDIA cascade**: `server.js` tries four models in order and falls back to the next on rate-limit (429) or API error. A `truncated` finish reason returns HTTP 422.
- **Free AI toggle**: Stored in `localStorage` as `'free-ai-enabled'`. Only visible in the UI during `import.meta.env.DEV`. In production, NVIDIA is always used unless the toggle was previously set in the browser.
- **Firebase graceful degradation**: `firebase.js` checks `isConfigured` before any Firestore call; all functions fall back silently to `localStorage`.
- **Theme**: Stored in `localStorage` as `'quiz-app-theme'`; applied as `data-theme` attribute on `<html>`.

### File map

| Path | Role |
|---|---|
| `server.js` | Express backend — NVIDIA proxy + static file serving |
| `src/services/aiService.js` | Routes quiz generation to NVIDIA or Claude Haiku |
| `src/services/nvidia.js` | Thin fetch wrapper for `/api/nvidia` |
| `src/services/claude-haiku.js` | Direct Anthropic SDK call (client-side) |
| `src/services/quizUtils.js` | Prompt builder, JSON extractor, `formatQuestions` normalizer |
| `src/services/firebase.js` | Save/load quiz results (Firestore + localStorage fallback) |
| `src/hooks/useQuiz.js` | All quiz state, phase transitions, and metrics computation |
| `src/hooks/useTimer.js` | Countdown timer hook used by QuizScreen |
| `src/App.jsx` | Top-level phase router (setup/loading/quiz/results) |

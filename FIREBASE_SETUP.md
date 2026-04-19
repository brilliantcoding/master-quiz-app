# 🔥 Firebase Setup Guide — QuizMaster

This guide walks you through creating a **free** Firebase project and connecting it to the quiz app (takes ~5 minutes).

---

## Step 1: Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter a name like `quizmaster-app`
4. Disable Google Analytics (optional)
5. Click **"Create project"**

---

## Step 2: Enable Firestore Database

1. In your Firebase project, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (allows read/write for 30 days)
4. Select your region (e.g., `us-central1`)
5. Click **"Enable"**

---

## Step 3: Get Your Config Keys

1. Click the **gear icon ⚙️** → **"Project settings"**
2. Scroll to **"Your apps"** → Click **"Web"** (</> icon)
3. Register your app with a nickname like `quiz-web`
4. Copy the `firebaseConfig` object — it looks like:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Step 4: Enable Anonymous Authentication

1. In Firebase console, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Click **"Anonymous"** under Sign-in providers
4. Toggle it **ON**
5. Click **"Save"**

---

## Step 5: Update Your `.env` File

Open `/quiz-app/.env` and replace the placeholder values:

```env
VITE_GEMINI_API_KEY=AIzaSyD7HcxpiWG5sJU2A48yxNOjr03mD5LWE3E

VITE_FIREBASE_API_KEY=AIza...           ← from Step 3
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

After saving, restart the dev server:
```bash
npm run dev
```

---

## Step 6: Update Firestore Security Rules (Before Going Public)

Once you're ready to deploy publicly, update Firestore rules:

1. In Firebase console → **Firestore Database** → **Rules**
2. Replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /quizResults/{doc} {
      allow create: if true;
      allow read: if true;
      allow update, delete: if false;
    }
  }
}
```

3. Click **"Publish"**

---

## 🚀 Deployment to Vercel

1. Push your project to GitHub:
   ```bash
   cd quiz-app
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create quiz-app --public --push
   ```

2. Go to [vercel.com](https://vercel.com) → **"New Project"** → Import your GitHub repo

3. In Vercel's **Environment Variables**, add all your `.env` keys:
   - `VITE_GEMINI_API_KEY`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

4. Click **Deploy** → Your app is live at `https://quiz-app-xyz.vercel.app` 🎉

---

## ✅ Free Plan Limits Summary

| Service | Free Limit | Sufficient For |
|---|---|---|
| Gemini API | 1M tokens/day, 15 RPM | ~100s of quizzes/day |
| Firestore reads | 50,000/day | ~50,000 results/day |
| Firestore writes | 20,000/day | ~20,000 saves/day |
| Vercel | Unlimited deploys | ✅ Always free for personal |

> The app works **without Firebase** too — it falls back to localStorage automatically if the config is missing.

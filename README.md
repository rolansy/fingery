# Fingery – Minimalist Speed Typing Test

A modern, minimalist speed typing test inspired by Monkeytype. Built with FastAPI (backend), React (Vite, frontend), Firebase (auth & stats), and Docker Compose for deployment.

---

## Features
- Minimalist, beautiful UI with smooth animations
- Typing test for guests and signed-in users
- Google sign-in (Firebase Auth)
- Stats saved to Firebase for signed-in users
- FastAPI backend (Dockerized)
- Easy deployment with Docker Compose

---

## 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Authentication** (Google sign-in recommended).
3. Go to **Project Settings > Service Accounts** and generate a new private key. Download it as `firebase_admin.json` and place it in the project root.
4. In **Project Settings > General**, get your web app config for the frontend (`apiKey`, `authDomain`, etc.).
5. In **Firestore Database**, create a database in test mode (for development).

---

## 2. Backend (FastAPI)

- Edit `backend/app/firebase_admin.py` if you want to customize Firestore collections.
- The backend expects the service account JSON at `/run/secrets/firebase_admin.json` (handled by Docker Compose).

### Local Development

```sh
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## 3. Frontend (React + Vite)

- Edit `frontend/src/firebase.js` and paste your Firebase config.
- Change the backend URL in `frontend/src/App.jsx` if needed.

### Local Development

```sh
cd frontend
npm install
npm run dev
```

---

## 4. Docker Compose (Production/Deployment)

- Place your `firebase_admin.json` in the project root.
- Build and run everything:

```sh
docker-compose up --build
```

- (Optional) Uncomment the frontend service in `docker-compose.yml` and add a Dockerfile for the frontend if you want to serve it via Docker as well.

---

## 5. Customization
- Add more word lists, leaderboard, or other features as you wish!

---

## 6. Credits
- Inspired by [Monkeytype](https://monkeytype.com/)
- Built with FastAPI, React, Firebase, Framer Motion 
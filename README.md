# 🚀 Fingery

> **Minimalist Speed Typing Test** - Test your typing speed with style

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

A modern, minimalist typing speed test built with cutting-edge technologies for the best user experience.

## ✨ Features

### 🎯 Core Functionality
- **Real-time typing test** with instant feedback
- **WPM & Accuracy tracking** with detailed analytics
- **Guest mode** - no signup required to test
- **User accounts** with Google Sign-in
- **Progress tracking** - save and compare your results
- **Responsive design** - works on desktop, tablet, and mobile

### 🎨 User Experience
- **Minimalist UI** with smooth animations
- **Dark theme** optimized for long typing sessions
- **Real-time statistics** during typing
- **Beautiful charts** showing your performance over time
- **Installable PWA** - use it like a native app

### 🚀 Technical Features
- **FastAPI backend** with Python analytics
- **React frontend** with Vite for lightning-fast builds
- **Firebase integration** for auth and data storage
- **Docker deployment** for easy setup
- **Progressive Web App** support

## 🚀 Live Demo

<iframe src="https://fingery.vercel.app" width="100%" height="600" frameborder="0" style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);"></iframe>

> **Try it live at [fingery.vercel.app](https://fingery.vercel.app)**

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Lightning-fast build tool
- **Framer Motion** - Smooth animations
- **Recharts** - Beautiful data visualization
- **Firebase Auth** - Google Sign-in

### Backend
- **FastAPI** - High-performance Python API
- **Firebase Admin SDK** - Backend Firebase integration
- **Uvicorn** - ASGI server

### Infrastructure
- **Docker & Docker Compose** - Containerized deployment
- **Firebase Firestore** - NoSQL database
- **Firebase Authentication** - User management

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Python](https://www.python.org/) (v3.8 or higher)
- [Docker](https://www.docker.com/) (optional, for containerized deployment)
- [Firebase](https://firebase.google.com/) account

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/fingery.git
cd fingery
```

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Enable **Authentication** → **Google Sign-in**
3. Create a **Firestore Database** in test mode
4. Go to **Project Settings** → **Service Accounts** → **Generate new private key**
5. Download as `firebase_admin.json` and place in project root
6. Copy your web app config from **Project Settings** → **General**

### 3. Environment Configuration

#### Frontend Setup
```bash
cd frontend
npm install
```

Edit `src/firebase.js` with your Firebase config:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};
```

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

### 4. Run Locally

#### Development Mode
```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### Production Mode (Docker)
```bash
# Make sure firebase_admin.json is in project root
docker-compose up --build
```

Visit `http://localhost:5173` to start typing! 🎯

## 📊 Analytics & Features

### Typing Analytics
- **Words Per Minute (WPM)** - Real-time calculation
- **Accuracy** - Character-level precision tracking
- **Error Analysis** - Detailed breakdown of mistakes
- **Timeline Charts** - Visual performance over time
- **Progress Tracking** - Compare sessions over time

### User Experience
- **Guest Mode** - Try without signing up
- **Account Sync** - Save progress across devices
- **Responsive Design** - Perfect on any screen size
- **PWA Support** - Install as native app
- **Offline Capable** - Works without internet

## 🎨 Customization

### Adding Word Lists
Edit `backend/app/api.py` to add custom word lists:
```python
CUSTOM_WORDS = [
    "your", "custom", "word", "list", "here"
]
```

### Styling Changes
Modify `frontend/src/index.css` for custom themes and styling.

### Backend Analytics
Customize analytics calculations in `backend/app/api.py`:
```python
def calculate_analytics(typing_data):
    # Your custom analytics logic
    pass
```

## 🚀 Deployment

### Vercel (Frontend)
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables for Firebase config

### Railway/Render (Backend)
1. Connect your repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add `firebase_admin.json` as environment variable

### Docker Deployment
```bash
# Build and run
docker-compose up --build -d

# Scale if needed
docker-compose up --scale backend=3
```

## 🔧 Configuration

### Environment Variables
```bash
# Frontend (.env)
VITE_BACKEND_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your-api-key

# Backend
FIREBASE_ADMIN_PATH=/path/to/firebase_admin.json
```

### Firebase Collections
The app uses these Firestore collections:
- `users` - User profiles and settings
- `typing_sessions` - Individual test results
- `analytics` - Aggregated performance data

## 🤝 Contributing

We love contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Test on multiple devices/browsers

## 🐛 Troubleshooting

### Common Issues

**PWA Install Not Showing**
- Ensure you're on HTTPS (except localhost)
- Check that manifest.json is valid
- Clear browser cache and reload

**Firebase Connection Issues**
- Verify `firebase_admin.json` is in the correct location
- Check Firebase project settings and permissions
- Ensure Firestore rules allow read/write

**Analytics Not Loading**
- Check backend logs for errors
- Verify Firebase credentials
- Ensure network connectivity

## 📈 Performance

- **Frontend**: < 100ms initial load time
- **Backend**: < 50ms API response time
- **Analytics**: Real-time calculation during typing
- **PWA**: Offline-capable with service worker

## 🏆 Roadmap

- [ ] **Multiplayer Mode** - Race against friends
- [ ] **Custom Themes** - Light mode and color schemes
- [ ] **Leaderboards** - Global and friend rankings
- [ ] **Practice Modes** - Focus on specific skills
- [ ] **Export Data** - Download your progress
- [ ] **Keyboard Layouts** - Support for different layouts
- [ ] **Voice Commands** - Accessibility features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FastAPI** - Amazing Python web framework
- **React** - Powerful frontend library
- **Firebase** - Backend-as-a-Service platform
- **Framer Motion** - Beautiful animations

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/fingery/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/fingery/discussions)

---

<div align="center">

**Made with ❤️ for the typing community**

</div> 
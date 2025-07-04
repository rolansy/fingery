# 🔒 Security Guide

## ⚠️ CRITICAL: API Key Security

Your Firebase API key was exposed in the frontend code. This is a serious security vulnerability that needs immediate attention.

## 🚨 Immediate Actions Required

### 1. **Revoke the Exposed API Key**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to your project settings
3. Go to the "Service accounts" tab
4. **IMMEDIATELY regenerate your API key**
5. Update your environment variables with the new key

### 2. **Set Up Environment Variables**

1. **Copy the example file:**
   ```bash
   cp env.example .env
   ```

2. **Fill in your Firebase configuration:**
   ```env
   VITE_FIREBASE_API_KEY=your_new_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

3. **Never commit the .env file to version control**

### 3. **Verify Security**
- ✅ API key is no longer in source code
- ✅ .env file is in .gitignore
- ✅ New API key is generated and active
- ✅ Old API key is revoked

## 🔐 Best Practices

### Environment Variables
- Always use environment variables for sensitive data
- Never hardcode API keys, passwords, or secrets
- Use `.env.example` files to document required variables
- Keep `.env` files out of version control

### Firebase Security Rules
- Set up proper Firebase Security Rules
- Restrict access to authenticated users only
- Use Firebase Auth for user management
- Regularly review and update security rules

### Code Review
- Always review code for exposed secrets before committing
- Use automated tools to detect secrets in code
- Implement pre-commit hooks to catch security issues

## 🛠️ Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your actual Firebase values
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `project.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123456789:web:abc123` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Measurement ID | `G-ABC123DEF` |

## 🚨 Emergency Contacts

If you suspect your API key has been compromised:
1. **Immediately revoke the key** in Firebase Console
2. **Generate a new key**
3. **Update all environment variables**
4. **Review Firebase usage logs** for unauthorized access
5. **Consider rotating other credentials** if necessary

---

**Remember: Security is everyone's responsibility. Always protect your API keys and sensitive data!** 
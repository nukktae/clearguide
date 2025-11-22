# Firebase Authentication Setup Guide

## What I Need From You

To complete the Firebase Authentication integration, please provide the following:

### 1. Firebase Project Configuration

Go to [Firebase Console](https://console.firebase.google.com) and:

1. **Create a new project** (or select existing one)
   - Project name: `clearguide` (or your preferred name)
   - Enable Google Analytics (optional)

2. **Add a Web App**
   - Click the web icon `</>` or "Add app"
   - Register app nickname (e.g., "ClearGuide Web")
   - Copy the config values

3. **Enable Authentication**
   - Go to **Authentication** > **Get Started**
   - Enable these sign-in methods:
     - ✅ Email/Password
     - ✅ Google (for Google sign-in)
     - ✅ Kakao (if available - may need custom OAuth setup)
     - ✅ Naver (if available - may need custom OAuth setup)

### 2. Firebase Config Values

After creating the web app, you'll get a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**Please provide these 6 values:**
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

### 3. Update Your .env File

Once you have the values, update your `.env` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. OAuth Setup (For Kakao/Naver)

For Korean social logins (Kakao, Naver), you have two options:

**Option A: Use Firebase Custom OAuth** (Recommended)
- Requires OAuth client IDs from Kakao/Naver Developer Console
- More complex setup but fully integrated

**Option B: Use Firebase + Custom Implementation**
- Firebase handles email/password and Google
- Custom implementation for Kakao/Naver
- Simpler but requires separate handling

**Which approach do you prefer?**

## What's Already Done

✅ Firebase SDK installed  
✅ Firebase config structure created  
✅ Authentication utility functions created  
✅ Ready to integrate with login/signup pages  

## Next Steps After You Provide Config

Once you provide the Firebase config values, I will:

1. ✅ Update `.env` file with your values
2. ✅ Update login page to use Firebase Auth
3. ✅ Update signup page to use Firebase Auth
4. ✅ Update authentication middleware
5. ✅ Add social login handlers (Google, Kakao, Naver)
6. ✅ Update auth state management
7. ✅ Add error handling and user feedback

## Quick Start Checklist

- [ ] Create Firebase project
- [ ] Add web app to Firebase project
- [ ] Enable Email/Password authentication
- [ ] Enable Google authentication (optional)
- [ ] Copy Firebase config values
- [ ] Provide config values to update `.env`
- [ ] (Optional) Set up Kakao/Naver OAuth if needed

---

**Ready?** Just provide the 6 Firebase config values and I'll complete the integration!


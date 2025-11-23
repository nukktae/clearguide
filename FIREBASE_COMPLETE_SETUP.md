# Firebase Complete Setup Checklist ✅

## What You've Already Done ✅
- ✅ Firebase Authentication (Email/Password, Google, Kakao)
- ✅ Firestore Database
- ✅ Security Rules Created (`firestore.rules`)

## What You Still Need to Do

### 1. Deploy Firestore Security Rules 🔒

**Action Required:**
1. Go to Firebase Console → Firestore Database → Rules tab
2. Copy the contents from `firestore.rules` file
3. Paste into the Firebase Console Rules editor
4. Click "Publish" to deploy

**Why:** Without deploying the rules, your database will deny all access (current state: `allow read, write: if false`)

---

### 2. Create Firestore Indexes 📊

**Action Required:**
When you first query documents, Firebase will prompt you to create an index. Or create manually:

1. Go to Firebase Console → Firestore Database → Indexes tab
2. Click "Create Index"
3. Create this composite index:
   - **Collection ID:** `documents`
   - **Fields to index:**
     - `userId` (Ascending)
     - `uploadedAt` (Descending)
   - **Query scope:** Collection
   - Click "Create"

**Why:** Your queries filter by `userId` and order by `uploadedAt`, which requires a composite index.

---

### 3. Firebase Storage (CRITICAL for Vercel) 📁

**Why Critical:** 
- You're using Vercel (serverless), which doesn't persist files
- Current code saves files to `data/uploads/` which won't work in production
- Files will be lost on every deployment

**Action Required:**

1. **Enable Firebase Storage:**
   - Go to Firebase Console → Storage → Get Started
   - Choose "Start in production mode" (or test mode for development)
   - Select a location (same as Firestore)

2. **Add Storage Security Rules:**
   Create `storage.rules` file (I'll create this for you)

3. **Update Environment Variables:**
   Add to `.env`:
   ```
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   ```

4. **Migrate File Storage Code:**
   - Update `src/lib/storage/files.ts` to use Firebase Storage
   - Update API routes to use Firebase Storage URLs

**Storage Rules Needed:**
- Users can only upload files to their own folder (`users/{userId}/documents/{fileId}`)
- Users can only read their own files
- File size limits (10MB)
- File type restrictions (PDF, JPG, PNG)

---

### 4. Add Authentication to API Routes 🔐

**Current Issue:** Your API routes (`/app/api/documents`, `/app/api/upload`, etc.) don't verify authentication.

**Action Required:**
- Add Firebase token verification to all API routes
- Extract `userId` from the authenticated token
- Ensure users can only access their own data

**Files to Update:**
- `src/app/app/api/documents/route.ts`
- `src/app/app/api/documents/[id]/route.ts`
- `src/app/app/api/upload/route.ts`
- `src/app/app/api/files/[filename]/route.ts`

---

### 5. Update Document Storage to Use Firestore 🔄

**Current Issue:** Your API routes still use the old file-based storage (`src/lib/storage/documents.ts`).

**Action Required:**
- Update API routes to use `src/lib/firebase/firestore-documents.ts` instead
- Ensure `userId` is extracted from auth token and added to documents
- Remove dependency on file-based storage

---

## Priority Order

1. **HIGH PRIORITY (Blocks Production):**
   - ✅ Deploy Firestore Security Rules
   - ✅ Create Firestore Indexes
   - ✅ Set up Firebase Storage (files won't persist on Vercel)

2. **MEDIUM PRIORITY (Security):**
   - ✅ Add authentication to API routes
   - ✅ Migrate to Firestore document storage

3. **LOW PRIORITY (Optimization):**
   - Consider Firebase Analytics (already configured)
   - Consider Firebase App Check (for API protection)

---

## Quick Start Commands

After completing the setup:

```bash
# Test Firestore connection
npm run dev

# Test authentication flow
# 1. Sign up/login
# 2. Upload a document
# 3. Check Firebase Console → Firestore → documents collection
# 4. Verify userId matches your auth user ID
```

---

## Testing Checklist

After setup, verify:
- [ ] Can create account and login
- [ ] Can upload a document (saves to Firebase Storage)
- [ ] Document appears in Firestore `documents` collection
- [ ] Document has correct `userId` field
- [ ] Cannot access other users' documents
- [ ] Can view own documents in history
- [ ] Can delete own documents
- [ ] Files persist after Vercel deployment

---

## Need Help?

If you want me to:
1. Create Firebase Storage integration code
2. Add authentication to API routes
3. Migrate document storage to Firestore

Just let me know! 🚀


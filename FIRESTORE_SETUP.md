# Firebase Firestore Setup Guide

## What Has Been Done ✅

### 1. Firestore Initialization ✅
- ✅ Added Firestore to Firebase config (`src/lib/firebase/config.ts`)
- ✅ Exported `db` instance for use throughout the app

### 2. Firestore Utilities ✅
- ✅ Created generic Firestore helpers (`src/lib/firebase/firestore.ts`)
  - `getDocument()` - Get single document by ID
  - `getDocuments()` - Get multiple documents with queries
  - `createDocument()` - Create new document
  - `updateDocument()` - Update existing document
  - `deleteDocument()` - Delete document
  - `batchWrite()` - Batch operations
  - Query helpers (`where`, `orderBy`, `limit`)

### 3. Document Operations ✅
- ✅ Created document-specific Firestore operations (`src/lib/firebase/firestore-documents.ts`)
  - `getAllUserDocuments()` - Get all documents for a user
  - `getDocumentById()` - Get document by ID (with ownership check)
  - `saveDocument()` - Save new document
  - `updateDocumentById()` - Update document
  - `deleteDocumentById()` - Delete document
  - `getDocumentsByType()` - Filter by document type
  - `searchDocuments()` - Search by filename

## Firebase Console Setup

### 1. Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `clearguide-68ee6`
3. Go to **Firestore Database** (in left sidebar)
4. Click **Create database**
5. Choose **Start in test mode** (for development) or **Start in production mode** (for production)
6. Select a location (choose closest to your users, e.g., `asia-northeast3` for Korea)
7. Click **Enable**

### 2. Set Up Security Rules (Important!)

Go to **Firestore Database** > **Rules** and set up security rules:

**For Development (Test Mode):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

**For Production (Recommended):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Documents collection - users can only access their own documents
    match /documents/{documentId} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid);
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Create Indexes (If Needed)

If you use complex queries (e.g., filtering by multiple fields), Firestore may require composite indexes. Firebase Console will show you which indexes are needed when you run queries.

## Data Structure

### Documents Collection (`documents`)

```typescript
{
  id: string;                    // Document ID (auto-generated)
  userId: string;                // User ID (from Firebase Auth or Kakao)
  fileName: string;              // Original filename
  fileType: string;              // MIME type (e.g., "application/pdf")
  fileSize: number;              // File size in bytes
  filePath: string;              // Storage path (if using Firebase Storage)
  documentType: string;          // Type (e.g., "tax", "fine", "notice")
  uploadedAt: Timestamp;         // Upload timestamp
  createdAt: Timestamp;          // Creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
  rawText?: string;              // Extracted text
  parsedDocument?: {             // Parsed document data
    summary: string;
    risks: Array<...>;
    actions: Array<...>;
    // ... other parsed fields
  };
}
```

## Migration from File-Based Storage

Currently, your app uses file-based storage (`src/lib/storage/documents.ts`). To migrate to Firestore:

### Option 1: Gradual Migration
- Keep both systems running
- Write to both Firestore and files
- Gradually migrate reads to Firestore

### Option 2: Full Migration
- Replace all file-based operations with Firestore
- Migrate existing data to Firestore
- Remove file-based storage

## Usage Examples

### Get User's Documents
```typescript
import { getAllUserDocuments } from "@/src/lib/firebase/firestore-documents";

const userId = "user123";
const documents = await getAllUserDocuments(userId);
```

### Save New Document
```typescript
import { saveDocument } from "@/src/lib/firebase/firestore-documents";

const document: DocumentRecord = {
  id: "doc123",
  fileName: "tax-notice.pdf",
  fileType: "application/pdf",
  // ... other fields
};

const savedDoc = await saveDocument(document, userId);
```

### Query Documents
```typescript
import { getDocumentsByType } from "@/src/lib/firebase/firestore-documents";

const taxDocuments = await getDocumentsByType(userId, "tax");
```

## Next Steps

1. **Enable Firestore** in Firebase Console (if not already enabled)
2. **Set up Security Rules** (use production rules above)
3. **Decide on Migration Strategy**:
   - Start using Firestore for new documents
   - Keep file-based storage for existing documents
   - Or migrate everything to Firestore
4. **Update API Routes** to use Firestore instead of file storage
5. **Test** with sample data

## What I Need From You

**Nothing!** Firestore is already enabled by default when you create a Firebase project. Just:

1. ✅ Go to Firebase Console
2. ✅ Enable Firestore Database (if not already enabled)
3. ✅ Set up Security Rules (use the production rules above)
4. ✅ Let me know if you want to migrate existing data or start fresh

That's it! The code is ready to use Firestore. 🎉


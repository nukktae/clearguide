# ClearGuide - Technical Portfolio Analysis

## 🎯 Project Overview

**ClearGuide** (클리어가이드) is a comprehensive AI-powered web application designed to help Korean residents understand and manage public documents (세금고지서, 과태료, 주민센터 안내문 등). The platform uses advanced AI to extract, analyze, and provide actionable insights from government documents, making bureaucratic processes more accessible.

## 🔍 Problem Statement

**The Problem:** Many people struggle to understand public/government documents they receive, leading to:
- Confusion due to complex official terminology and legal language
- Mistakes and missed deadlines due to lack of understanding
- Increased call center load as citizens seek help understanding documents

**The Purpose:** Reduce confusion, prevent mistakes, and improve clarity.

**AI Solution:**
- Summarize documents in plain, easy-to-understand language
- Extract key fields and important data automatically
- Provide clear action items (what to do, where to go, by when)

**Goals:**
- Reduce citizen confusion
- Reduce civil complaints/call center load

**Social Impact:** Bridge information gaps and improve accessibility so all citizens can easily access public services.

---

## 🛠️ Technology Stack

### **Frontend Framework & Core**
- **Next.js 16.0.3** (App Router) - React framework with server-side rendering
- **React 19.2.0** - Latest React with concurrent features
- **TypeScript 5** - Full type safety across the codebase
- **Tailwind CSS v4** - Utility-first CSS framework with custom design system

### **UI Component Libraries**
- **Radix UI** - Accessible, unstyled component primitives
  - `@radix-ui/react-dialog` - Modal dialogs
  - `@radix-ui/react-tabs` - Tabbed interfaces
  - `@radix-ui/react-tooltip` - Tooltips
  - `@radix-ui/react-alert-dialog` - Alert dialogs
- **Lucide React** - Icon library (554+ icons)
- **Class Variance Authority (CVA)** - Component variant management
- **clsx & tailwind-merge** - Conditional class name utilities

### **Backend & API**
- **Next.js API Routes** - Serverless API endpoints
- **Firebase SDK 12.6.0** - Backend-as-a-Service
  - **Firebase Authentication** - Multi-provider auth (Email/Password, Google, Kakao)
  - **Cloud Firestore** - NoSQL document database
  - **Firebase Storage** - File storage (configured)
  - **Firebase Analytics** - User analytics

### **AI & Machine Learning**
- **OpenAI API (v6.9.1)** - AI-powered document analysis
  - **GPT-4o** - Primary model for document parsing, summarization, and chat
  - **GPT-4o-mini** - Cost-effective alternative for simpler tasks
  - **GPT-4 Vision API** - OCR and image text extraction

### **Document Processing**
- **pdf-lib 1.17.1** - PDF manipulation and text extraction
- **pdfjs-dist 5.4.394** - PDF.js for rendering PDFs in browser
- **Custom OCR Pipeline** - Multi-stage text extraction (PDF + Image)

### **Internationalization**
- **next-intl 4.5.5** - Internationalization framework
- **Supported Languages**: Korean (ko) - default, English (en)
- **Locale-based routing** - Dynamic language switching

### **State Management & Context**
- **React Context API** - Global state management
  - `AuthContext` - Authentication state
  - `PreferencesContext` - User preferences
- **localStorage** - Client-side persistence
- **Cookies** - Session management

### **Development Tools**
- **ESLint 9** - Code linting
- **PostCSS** - CSS processing
- **TypeScript Compiler** - Type checking

### **Utilities**
- **UUID 13.0.0** - Unique identifier generation
- **Custom utility libraries** - Calendar, text extraction, document parsing

---

## 🏗️ Architecture & Design Patterns

### **Application Architecture**
```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                    │
├─────────────────────────────────────────────────────────┤
│  Marketing Pages  │  App Pages  │  API Routes  │  Auth  │
├─────────────────────────────────────────────────────────┤
│  Components Layer (77+ reusable components)             │
├─────────────────────────────────────────────────────────┤
│  Context Providers (Auth, Preferences, i18n)            │
├─────────────────────────────────────────────────────────┤
│  Library Layer (Firebase, OpenAI, OCR, Parsing)         │
├─────────────────────────────────────────────────────────┤
│  External Services (Firebase, OpenAI API)               │
└─────────────────────────────────────────────────────────┘
```

### **Design Patterns Implemented**
1. **Component Composition** - Modular, reusable components
2. **Context Pattern** - Global state management
3. **Custom Hooks** - Reusable logic (`useAuth`, `usePreferences`)
4. **Server Components** - Next.js App Router SSR
5. **API Route Handlers** - RESTful API endpoints
6. **Middleware Pattern** - Route protection and authentication
7. **Provider Pattern** - Context providers for global state

### **File Structure**
```
src/
├── app/                    # Next.js App Router pages
│   ├── (marketing)/        # Public landing pages
│   ├── app/               # Protected application pages
│   │   ├── api/           # API routes (18 endpoints)
│   │   ├── account/       # User account management
│   │   ├── calendar/      # Calendar/deadline management
│   │   ├── document/      # Document detail views
│   │   └── history/       # Document history/storage
│   ├── api/               # Auth API routes
│   └── login/              # Authentication pages
├── components/             # React components (77 files)
│   ├── account/           # Account management UI
│   ├── app/               # Main app components
│   ├── auth/              # Authentication components
│   ├── calendar/          # Calendar components
│   ├── chat/              # Chatbot components
│   ├── common/            # Shared UI components
│   ├── document/          # Document viewer components
│   ├── layout/            # Layout components
│   ├── preferences/       # Settings components
│   ├── storage/           # Document storage UI
│   ├── summary/           # Document summary UI
│   └── upload/            # File upload components
├── contexts/              # React Context providers
├── lib/                   # Utility libraries
│   ├── auth/              # Authentication utilities
│   ├── firebase/          # Firebase integration (11 files)
│   ├── i18n/              # Internationalization
│   ├── ocr/               # OCR processing
│   ├── openai/            # OpenAI integration (5 files)
│   ├── parsing/           # Document parsing logic
│   ├── pdfjs/             # PDF.js utilities
│   ├── preferences/       # User preferences system
│   ├── storage/           # File storage utilities
│   └── utils/             # General utilities
└── middleware.ts          # Next.js middleware for auth
```

---

## ✨ Core Features & Implementations

### **1. Document Upload & Processing Pipeline**

#### **Multi-Format Support**
- **PDF Documents** - Full PDF parsing with pdf-lib and pdfjs-dist
- **Image Files** - JPG, PNG, JPEG support with GPT-4 Vision OCR
- **File Validation** - Type checking, size limits, error handling

#### **Processing Pipeline**
```
Upload → OCR Extraction → AI Analysis → Summary Generation → 
Checklist Creation → Risk Detection → Storage → Display
```

**Technical Implementation:**
- **Step 1: Upload** (`/app/api/upload`)
  - File validation and storage
  - UUID generation for document tracking
  - Firestore document creation
  
- **Step 2: OCR** (`/app/api/ocr`)
  - PDF text extraction using pdf-lib
  - Image OCR using GPT-4 Vision API
  - Text confidence scoring
  - Multi-page support
  
- **Step 3: AI Analysis** (`/app/api/parse`, `/app/api/summary`, `/app/api/checklist`, `/app/api/risks`)
  - Parallel API calls to OpenAI GPT-4o
  - Structured JSON response parsing
  - Error handling and retry logic

### **2. AI-Powered Document Analysis**

#### **OpenAI Integration**
- **Model**: GPT-4o (primary), GPT-4o-mini (fallback)
- **Temperature**: 0.3-0.7 (depending on task)
- **Max Tokens**: 1000-2000 per request
- **Structured Outputs**: JSON parsing with error handling

#### **Analysis Features**
1. **Document Summarization**
   - Document type identification
   - Key information extraction
   - Bullet-point summaries
   - Language: Korean (default) with English translation option

2. **Action Checklist Generation**
   - Step-by-step action items
   - Deadline extraction and formatting
   - Location and required documents identification
   - Priority scoring

3. **Risk Detection**
   - Penalty identification
   - Deadline warnings
   - Eligibility loss alerts
   - Severity classification (low, medium, high, critical)

4. **Entity Extraction**
   - Government agencies
   - Important dates
   - Amounts and fees
   - Reference numbers

### **3. Intelligent Chatbot System**

#### **Features**
- **Context-Aware Conversations** - Document-specific chat
- **Conversation History** - Persistent chat sessions
- **Multi-Document Support** - Switch between document contexts
- **Quick Actions** - Pre-defined action buttons
- **Floating UI** - Non-intrusive chat interface

#### **Technical Implementation**
- **API Endpoint**: `/app/api/chat`
- **Storage**: Firestore `conversations` and `messages` collections
- **Context Building**: 
  - Document text (OCR results)
  - Summary, checklist, risks
  - Conversation history (last 10 messages)
- **System Prompts**: Custom prompts for Korean document assistance
- **Response Streaming**: Real-time AI responses (configured)

### **4. Calendar & Deadline Management**

#### **Features**
- **Calendar View** - Month/week/day views
- **Deadline Tracking** - Automatic extraction from documents
- **Custom Events** - User-created calendar entries
- **Deadline Alerts** - Visual indicators for urgency
- **List View** - Alternative deadline display
- **Event Management** - Create, update, delete events

#### **Technical Implementation**
- **Data Source**: Firestore `calendar` collection
- **Deadline Extraction**: From document actions and risks
- **Status Calculation**: Overdue, upcoming, completed
- **UI Components**: Custom calendar grid, event dots, popovers

### **5. Document Storage & History**

#### **Features**
- **Document Library** - All uploaded documents
- **Search Functionality** - Full-text search across documents
- **Filtering** - By type (tax, community, penalty), file type, status
- **Sorting** - By date, name, relevance
- **View Modes** - List view and grid view
- **Document Metadata** - Upload date, file type, analysis status

#### **Technical Implementation**
- **Storage**: Firestore `documents` collection
- **Indexing**: Composite indexes for queries
- **Pagination**: Efficient document loading
- **Caching**: Client-side caching for performance

### **6. User Authentication & Authorization**

#### **Multi-Provider Authentication**
1. **Firebase Email/Password**
   - Email verification
   - Password reset functionality
   - Secure token management

2. **Google OAuth** (via Firebase)
   - One-click sign-in
   - Profile synchronization

3. **Kakao OAuth** (Custom Implementation)
   - REST API integration
   - Session management with HttpOnly cookies
   - Profile image and nickname support

#### **Security Features**
- **Middleware Protection** - Route-level authentication
- **Token Validation** - Firebase ID token verification
- **Session Management** - Secure cookie handling
- **CSRF Protection** - SameSite cookie attributes
- **XSS Prevention** - HttpOnly cookies

#### **Technical Implementation**
- **Middleware**: `middleware.ts` - Route protection
- **Auth Context**: Global authentication state
- **API Auth**: `requireAuth()` utility for API routes
- **Session Storage**: Cookies + localStorage

### **7. User Account Management**

#### **Account Settings**
- **Profile Management**
  - Name, email, phone editing
  - Profile photo upload/delete
  - Account creation date tracking
  - Login method display

- **Preferences**
  - Language selection (Korean/English)
  - Easy Korean mode toggle
  - Summary style (brief/detailed/ultra-simple)
  - Dark mode toggle
  - Font size adjustment (small/medium/large)

- **Notifications**
  - Deadline alerts
  - Calendar reminders
  - Analysis ready notifications
  - Weekly reports
  - Auto-sync deadlines

- **Security**
  - Two-factor authentication (UI ready)
  - Password management
  - Session management

- **Document Data**
  - Auto-delete settings (7/30 days/never)
  - Data export (planned)
  - Data deletion

#### **Technical Implementation**
- **Storage**: localStorage for preferences
- **API**: `/app/api/profile` for profile updates
- **Firebase**: User profile synchronization
- **State Management**: PreferencesContext with persistence

### **8. Internationalization (i18n)**

#### **Features**
- **Language Support**: Korean (default), English
- **Dynamic Switching** - Runtime language changes
- **Locale Persistence** - Cookie-based language preference
- **RTL Support** - Ready for right-to-left languages
- **Translation Coverage** - 200+ translation keys

#### **Technical Implementation**
- **Framework**: next-intl
- **Translation Files**: JSON-based (`ko.json`, `en.json`)
- **Routing**: Locale-based URL routing
- **Context**: NextIntlClientProvider

### **9. Responsive Design & UI/UX**

#### **Design System**
- **Color Palette**:
  - Primary Navy: `#1C2329`
  - Secondary Teal: `#2DB7A3`
  - Accent Amber: `#F2B84B`
  - Custom dark mode colors

- **Typography**:
  - Font: Noto Sans KR (Korean), System fonts (English)
  - Responsive font sizing
  - Accessibility-focused contrast ratios

- **Components**:
  - 77+ reusable components
  - Consistent spacing and sizing
  - Animation system (fade-in, slide-in)
  - Loading states and skeletons

#### **Responsive Breakpoints**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

#### **Accessibility Features**
- ARIA labels
- Keyboard navigation
- Focus indicators
- Screen reader support
- Color contrast compliance

### **10. Dark Mode**

#### **Implementation**
- **System Preference Detection** - Automatic dark mode
- **Manual Toggle** - User preference override
- **Persistent Storage** - localStorage persistence
- **Smooth Transitions** - CSS transitions for mode switching
- **Component Support** - All components support dark mode

---

## 🔌 API Endpoints

### **Authentication APIs**
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/kakao/login` - Kakao OAuth initiation
- `GET /api/auth/kakao/callback` - Kakao OAuth callback

### **Document APIs**
- `POST /app/api/upload` - Upload document file
- `POST /app/api/ocr` - Extract text from document (OCR)
- `POST /app/api/parse` - Parse document with AI
- `POST /app/api/summary` - Generate document summary
- `POST /app/api/checklist` - Generate action checklist
- `POST /app/api/risks` - Extract risk alerts
- `GET /app/api/documents` - List all user documents
- `GET /app/api/documents/[id]` - Get specific document
- `POST /app/api/documents` - Save document
- `DELETE /app/api/documents/[id]` - Delete document

### **Chat APIs**
- `POST /app/api/chat` - Send chat message
- `GET /app/api/chat` - Get conversation messages
- `GET /app/api/chat/conversations` - List conversations

### **Calendar APIs**
- `GET /app/api/calendar` - Get calendar events
- `POST /app/api/calendar` - Create calendar event
- `PUT /app/api/calendar/[id]` - Update calendar event
- `DELETE /app/api/calendar/[id]` - Delete calendar event

### **Profile APIs**
- `GET /app/api/profile` - Get user profile
- `PUT /app/api/profile` - Update user profile
- `POST /app/api/profile/photo` - Upload profile photo

### **File APIs**
- `GET /app/api/files/[filename]` - Get uploaded file

---

## 🗄️ Database Schema (Firestore)

### **Collections**

#### **documents**
```typescript
{
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  filePath: string;
  uploadedAt: Timestamp;
  parsed?: ParsedDocument;
}
```

#### **ocr_results**
```typescript
{
  id: string;
  userId: string;
  documentId: string;
  fileName: string;
  text: string;
  confidence?: number;
  pageCount?: number;
  createdAt: Timestamp;
}
```

#### **summaries**
```typescript
{
  id: string;
  userId: string;
  documentId: string;
  summary: DocumentSummary;
  createdAt: Timestamp;
}
```

#### **checklists**
```typescript
{
  id: string;
  userId: string;
  documentId: string;
  actions: ChecklistItem[];
  createdAt: Timestamp;
}
```

#### **risks**
```typescript
{
  id: string;
  userId: string;
  documentId: string;
  risks: RiskAlert[];
  createdAt: Timestamp;
}
```

#### **conversations**
```typescript
{
  id: string;
  userId: string;
  documentId?: string;
  documentName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### **messages**
```typescript
{
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Timestamp;
}
```

#### **calendar**
```typescript
{
  id: string;
  userId: string;
  title: string;
  deadline: string;
  type: "action" | "risk" | "custom";
  documentId?: string;
  description?: string;
  severity?: "low" | "medium" | "high" | "critical";
  createdAt: Timestamp;
}
```

---

## 🔒 Security Features

### **Authentication Security**
- Firebase ID token validation
- HttpOnly cookies for sessions
- Secure cookie flags (production)
- SameSite protection
- Token expiration handling

### **API Security**
- Route-level authentication middleware
- User ownership verification
- Input validation and sanitization
- Error handling without exposing sensitive data
- Rate limiting (configured)

### **Data Security**
- Firestore security rules
- User data isolation (userId-based queries)
- File access control
- Secure file upload validation

### **Frontend Security**
- XSS prevention
- CSRF protection
- Secure storage practices
- Content Security Policy (ready)

---

## ⚡ Performance Optimizations

### **Frontend**
- **Code Splitting** - Next.js automatic code splitting
- **Image Optimization** - Next.js Image component
- **Lazy Loading** - Component lazy loading
- **Memoization** - React.useMemo for expensive computations
- **Debouncing** - Search input debouncing

### **Backend**
- **Parallel API Calls** - Concurrent OpenAI requests
- **Caching** - Client-side caching for documents
- **Pagination** - Efficient data loading
- **Database Indexing** - Firestore composite indexes

### **API Optimization**
- **Request Batching** - Multiple operations in single request
- **Error Retry Logic** - Automatic retry for failed requests
- **Timeout Handling** - Request timeout management
- **Response Compression** - Gzip compression (Vercel)

---

## 🎨 UI/UX Highlights

### **User Experience**
- **Progressive Disclosure** - Information revealed as needed
- **Loading States** - Skeleton screens and spinners
- **Error Handling** - User-friendly error messages
- **Empty States** - Helpful empty state designs
- **Onboarding** - Smooth user onboarding flow

### **Visual Design**
- **Modern Aesthetic** - Clean, professional design
- **Consistent Spacing** - 8px grid system
- **Smooth Animations** - Fade-in, slide-in transitions
- **Visual Hierarchy** - Clear information architecture
- **Color Psychology** - Risk-based color coding

### **Component Library**
- **Reusable Components** - 77+ components
- **Consistent API** - Uniform component interfaces
- **Accessibility** - WCAG 2.1 compliance
- **Responsive** - Mobile-first design

---

## 📊 Technical Metrics & Statistics

### **Codebase**
- **Total Files**: 150+ files
- **Components**: 77 React components
- **API Routes**: 18 endpoints
- **Library Files**: 30+ utility modules
- **Lines of Code**: ~15,000+ LOC

### **Features**
- **Document Types Supported**: PDF, JPG, PNG, JPEG
- **Languages**: 2 (Korean, English)
- **Auth Providers**: 3 (Email, Google, Kakao)
- **AI Models**: 2 (GPT-4o, GPT-4o-mini)
- **Storage Collections**: 7 Firestore collections

### **Performance**
- **Initial Load**: Optimized with code splitting
- **API Response Time**: < 2s average
- **OCR Processing**: 5-15s depending on document size
- **AI Analysis**: 3-8s per document

---

## 🚀 Deployment & Infrastructure

### **Hosting**
- **Platform**: Vercel (serverless)
- **CDN**: Global CDN for static assets
- **Edge Functions**: Next.js Edge Runtime support

### **Environment Variables**
- Firebase configuration (6 variables)
- OpenAI API key
- Kakao OAuth credentials
- Next.js public variables

### **CI/CD**
- **Git Integration** - Automatic deployments
- **Preview Deployments** - Branch-based previews
- **Production Deployments** - Main branch auto-deploy

---

## 🔮 Future Enhancements (Planned/Ready)

### **Technical Improvements**
- Firebase Storage migration (from local files)
- Real-time document updates (Firestore listeners)
- Advanced OCR with Tesseract.js
- Document comparison feature
- Batch document processing
- Export functionality (PDF, CSV)

### **Feature Additions**
- Mobile app (React Native)
- Email notifications
- SMS alerts
- Document templates
- Government API integrations
- Multi-user collaboration

### **AI Enhancements**
- Fine-tuned models for Korean documents
- Multi-language OCR
- Document classification ML model
- Predictive deadline alerts
- Smart document suggestions

---

## 📝 Key Technical Achievements

1. **Multi-Provider Authentication** - Seamless integration of Firebase and Kakao OAuth
2. **Advanced OCR Pipeline** - Hybrid PDF + Image text extraction
3. **AI Document Analysis** - Multi-stage AI processing with structured outputs
4. **Real-time Chatbot** - Context-aware conversational AI
5. **Calendar Integration** - Automatic deadline extraction and management
6. **Internationalization** - Full i18n support with dynamic switching
7. **Dark Mode** - System-aware dark mode with persistence
8. **Responsive Design** - Mobile-first, accessible UI
9. **Performance Optimization** - Parallel processing, caching, code splitting
10. **Security** - Multi-layer security with authentication, authorization, and data protection

---

## 🎓 Technologies & Skills Demonstrated

### **Frontend**
- React 19 with Hooks and Context
- Next.js 16 App Router
- TypeScript (full type safety)
- Tailwind CSS v4
- Component architecture
- State management
- Responsive design
- Accessibility (WCAG)

### **Backend**
- Next.js API Routes
- Serverless architecture
- RESTful API design
- Authentication & authorization
- Database design (NoSQL)
- File handling

### **AI/ML**
- OpenAI API integration
- Prompt engineering
- Structured output parsing
- Vision API (OCR)
- Conversational AI
- Context management

### **DevOps**
- Vercel deployment
- Environment configuration
- CI/CD pipelines
- Error monitoring
- Performance optimization

### **Database**
- Firestore (NoSQL)
- Query optimization
- Security rules
- Data modeling
- Indexing strategies

### **Security**
- Authentication flows
- Session management
- API security
- Data protection
- XSS/CSRF prevention

---

## 📚 Documentation

- **README.md** - Project overview and setup
- **FIREBASE_SETUP.md** - Firebase configuration guide
- **FIRESTORE_SETUP.md** - Database setup instructions
- **KAKAO_LOGIN_IMPLEMENTATION.md** - Kakao OAuth implementation details
- **Postman Collection** - API documentation (`postman/civic-helper.postman_collection.json`)

---

## 🏆 Portfolio Highlights

This project demonstrates:

✅ **Full-Stack Development** - End-to-end application development  
✅ **Modern React** - Latest React 19 features and patterns  
✅ **Next.js Expertise** - App Router, API routes, middleware  
✅ **AI Integration** - OpenAI API with advanced prompt engineering  
✅ **Authentication Systems** - Multi-provider OAuth implementation  
✅ **Database Design** - Firestore schema and query optimization  
✅ **UI/UX Design** - Modern, accessible, responsive interfaces  
✅ **Internationalization** - Multi-language support  
✅ **Performance** - Optimization techniques and best practices  
✅ **Security** - Authentication, authorization, data protection  
✅ **TypeScript** - Full type safety across codebase  
✅ **Component Architecture** - Reusable, maintainable components  

---

**Project Status**: ✅ Production Ready  
**Last Updated**: 2024  
**License**: Private Project



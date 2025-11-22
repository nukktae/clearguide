<!-- e39f65d7-6eb7-4ef4-8022-b48d136c8791 b93f2532-d1d3-4633-9a87-f6a34d48fe21 -->
# Landing Header Implementation

## Overview

Create a modern, transparent header component with scroll effects, navigation links, and mobile menu that appears on all pages via root layout.

## Implementation Steps

### 1. Create LandingHeader Component

**File**: `src/components/layout/LandingHeader.tsx`

- Transparent background at top, becomes blurred white on scroll
- Height: 64px default, shrinks to ~56px on scroll
- Layout: Logo (left) | Nav (center, optional) | CTA buttons (right)
- Navigation items: 기능 소개, 가격, 보안/개인정보, 문의
- Right side: 로그인 (link) + 회원가입 (primary button)
- Scroll detection: Use `useEffect` + `window.addEventListener('scroll')`
- Shadow appears on scroll: `shadow-[0_1px_3px_rgba(0,0,0,0.1)]`
- Active nav highlight: Underline or background based on current pathname
- Mobile menu: Hamburger icon, slides in from right at `md` breakpoint

### 2. Create Navigation Pages (Placeholders)

**Files**:

- `src/app/features/page.tsx` - 기능 소개
- `src/app/pricing/page.tsx` - 가격
- `src/app/security/page.tsx` - 보안/개인정보
- `src/app/contact/page.tsx` - 문의

Each page should be a simple placeholder with the header already included.

### 3. Update Root Layout

**File**: `src/app/layout.tsx`

- Import and add `<LandingHeader />` before `{children}`
- Ensure it's outside NextIntlClientProvider but inside body

### 4. Mobile Menu Component

**File**: `src/components/layout/MobileMenu.tsx` (optional, can be inline)

- Slide-in menu from right
- Shows navigation links + auth buttons
- Close button/overlay
- Smooth animations

### 5. Scroll Detection Hook (Optional)

**File**: `src/lib/hooks/useScroll.ts` (optional utility)

- Custom hook for scroll position
- Returns `isScrolled` boolean
- Threshold: ~20px

## Technical Details

### Header States

- **Default**: `bg-transparent`, `h-16`, no shadow
- **Scrolled**: `bg-white/95 backdrop-blur-sm`, `h-14`, `shadow-[0_1px_3px_rgba(0,0,0,0.1)]`

### Navigation Spacing

- Gap between nav items: `gap-7` or `gap-8` (28-32px)

### Active State

- Use `usePathname()` from `next/navigation`
- Highlight active nav with `border-b-2 border-[#0A1A2F]` or background

### Mobile Menu

- Hamburger icon (Menu from lucide-react)
- Slide animation: `translate-x-full` → `translate-x-0`
- Overlay: `bg-black/20 backdrop-blur-sm`
- Breakpoint: `md:` (768px)

## Files to Create/Modify

**New Files:**

- `src/components/layout/LandingHeader.tsx`
- `src/app/features/page.tsx`
- `src/app/pricing/page.tsx`
- `src/app/security/page.tsx`
- `src/app/contact/page.tsx`
- `src/lib/hooks/useScroll.ts` (optional)

**Modified Files:**

- `src/app/layout.tsx` - Add LandingHeader component

## Styling Specifications

- Logo: FileText icon + "공공문서 AI 도우미" text
- Nav links: `text-[14px] text-[#6D6D6D] hover:text-[#0A1A2F]`
- Active nav: `text-[#0A1A2F] font-medium` + `border-b-2 border-[#0A1A2F]`
- 로그인 link: `text-[14px] text-[#6D6D6D] hover:text-[#0A1A2F]`
- 회원가입 button: Primary navy button (`bg-[#0A1A2F]`)
- Avatar: Circular, minimal, `w-8 h-8` with border
- Transition: `transition-all duration-300` for smooth scroll effects
- Backdrop blur on scroll: `backdrop-blur-sm bg-white/95`

### To-dos

- [x] Install and configure dependencies: next-intl, pdf-lib, openai, shadcn/ui components, Pretendard font
- [x] Create complete folder structure: src/app/app/, src/components/, src/lib/, postman/
- [x] Configure next-intl with Korean/English translations, update middleware and root layout
- [x] Define domain types: Document, Summary, ChecklistItem, RiskAlert, ParsedDocument in lib/parsing/types.ts
- [x] Create OpenAI client wrapper and prompt templates (summarize, extractActions, extractRisks)
- [x] Implement OCR client (pdf-lib for PDFs, mock for images) and document parser orchestration
- [x] Create API routes: /api/upload, /api/parse, /api/documents (GET/POST), /api/documents/[id]
- [x] Implement JSON file-based document storage in lib/storage/documents.ts
- [x] Build UI components: layout (AppShell, Header), upload (UploadCard, Dropzone), summary (SummaryCard, ActionChecklist, RiskAlertBox), common components
- [x] Create main app pages: app/page.tsx (upload), app/history/page.tsx, app/document/[id]/page.tsx
- [x] Configure Tailwind theme with brand colors, update globals.css, ensure accessibility compliance
- [x] Create Postman collection with sample requests for all API endpoints
- [x] Create PDFJSViewer component that renders PDFs as canvas using PDF.js
- [x] Create textExtractor utility to extract text with positions from PDF pages
- [x] Create textMatcher utility with fuzzy matching algorithm for Korean text, dates, amounts
- [x] Create PDFHighlightOverlay component to render highlights at exact text positions
- [x] Integrate highlighting system into PDFViewer component, replace iframe with PDF.js viewer
- [x] Handle edge cases: scanned PDFs, large files, performance optimization, mobile responsiveness
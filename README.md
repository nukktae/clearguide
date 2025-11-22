# 공공문서 AI 도우미 (Public Document AI Assistant)

A web-based AI assistant for Korean residents who receive public documents (세금고지서, 과태료, 주민센터 안내문 등) and need help understanding what they mean and what actions they must take.

## Features

- **Document Upload**: Upload PDFs or images of public documents
- **AI-Powered Analysis**: Get plain-language Korean summaries with optional English translation
- **Action Checklist**: Clear step-by-step guidance on what to do, by when, where, and what to bring
- **Risk Alerts**: Immediate visibility into penalties, benefit cancellations, eligibility loss, and deadlines
- **Document History**: Save and revisit past documents and their analyses

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **i18n**: next-intl (Korean/English)
- **AI**: OpenAI GPT-4o-mini
- **OCR**: pdf-lib (PDF text extraction), mock OCR for images
- **Storage**: JSON file-based storage (MVP)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

4. Add your OpenAI API key to `.env.local`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
  app/
    [locale]/
      (marketing)/        # Landing page
      app/                # Main application
        api/              # API routes
          upload/         # File upload endpoint
          parse/          # Document parsing endpoint
          documents/      # Document CRUD endpoints
        history/          # Document history page
        document/[id]/    # Document detail page
  components/
    layout/               # App shell, header
    upload/               # Upload components
    summary/              # Summary, actions, risks components
    common/               # Reusable UI components
  lib/
    openai/               # OpenAI client and prompts
    parsing/              # Document parsing logic
    ocr/                  # OCR client
    storage/              # Document storage
    i18n/                 # Internationalization config
    utils/                # Utility functions
```

## API Endpoints

All API endpoints are documented in the Postman collection: `postman/civic-helper.postman_collection.json`

- `POST /[locale]/app/api/upload` - Upload a document file
- `POST /[locale]/app/api/parse` - Parse document text with AI
- `GET /[locale]/app/api/documents` - List all documents
- `POST /[locale]/app/api/documents` - Save a document
- `GET /[locale]/app/api/documents/[id]` - Get a specific document

## Development

### Running Tests

```bash
npm run lint
```

### Building for Production

```bash
npm run build
npm start
```

## Notes

- OCR for images is currently mocked for MVP. In production, integrate with a real OCR service (Tesseract.js, Google Vision API, etc.)
- Document storage uses JSON files for MVP. Consider migrating to a database (Supabase, PostgreSQL) for production
- The application supports Korean (default) and English locales

## License

Private project

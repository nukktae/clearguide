# Mock Data Usage

This directory contains mock data for development and demo purposes.

## How to Enable Mock Data

### Method 1: URL Query Parameter
Add `?mock=true` to any page URL:
```
http://localhost:3000/app/history?mock=true
http://localhost:3000/app/calendar?mock=true
```

### Method 2: LocalStorage Flag
Open browser console and run:
```javascript
localStorage.setItem('clearguide_use_mock_data', 'true');
```
Then refresh the page.

To disable:
```javascript
localStorage.removeItem('clearguide_use_mock_data');
```

## Mock Data Contents

### Documents (보관함)
- 8 sample documents including:
  - Tax notices (세금고지서)
  - Penalty notices (과태료 통지)
  - Community center notices (주민센터 안내문)
  - Health checkup notices (건강검진 안내문)

### Calendar Events
- 9 calendar events with various deadlines
- Mix of actions and risks
- Different severity levels (low, medium, high, critical)
- Some overdue, some upcoming

## Files

- `mockData.ts` - Main mock data file with documents and calendar events
- `demoDocuments.ts` - Demo documents for document detail pages
- `sampleDocument.ts` - Sample document text for testing

## Usage in Code

Mock data is automatically used when:
1. API calls fail
2. No documents are found
3. Mock data flag is enabled (see above)

The pages that use mock data:
- `/app/history` - Document storage page
- `/app/calendar` - Calendar page
- `/app` - Main page (recent documents)


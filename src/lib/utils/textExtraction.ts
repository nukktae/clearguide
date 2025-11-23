/**
 * Utility functions to extract structured data from OCR text
 */

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  // Match various URL patterns:
  // - http:// or https:// URLs
  // - www. URLs
  // - Domain patterns like giro.or.kr, example.com
  const urlRegex = /(https?:\/\/[^\s\)]+|www\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(?:\/[^\s\)]*)?|[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?:\/[^\s\)]*)?)/g;
  const matches = text.match(urlRegex) || [];
  
  return matches
    .map(url => {
      // Clean up URL (remove trailing punctuation)
      url = url.replace(/[.,;:!?]+$/, '');
      
      // Add https:// if missing
      if (url.startsWith('www.')) {
        return `https://${url}`;
      }
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Check if it looks like a domain (has at least one dot)
        if (url.includes('.')) {
          return `https://${url}`;
        }
        // If it doesn't look like a domain, skip it
        return null;
      }
      return url;
    })
    .filter((url): url is string => url !== null) // Remove nulls
    .filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates
}

/**
 * Extract bank account information from text
 */
export interface BankAccountInfo {
  accountHolder?: string; // 예금주
  bankName?: string; // 은행명
  accountNumber?: string; // 계좌번호
  giroNumber?: string; // 지로번호
}

export function extractBankAccountInfo(text: string): BankAccountInfo {
  const info: BankAccountInfo = {};
  
  // Extract 지로번호 (Giro number)
  const giroMatch = text.match(/지로번호\s*[:\-]?\s*(\d+)/i) || 
                    text.match(/Giro\s*[:\-]?\s*(\d+)/i);
  if (giroMatch) {
    info.giroNumber = giroMatch[1];
  }
  
  // Extract 납부자번호 (Payer number)
  const payerMatch = text.match(/납부자번호[는은]?\s*[:\-]?\s*(\d+(?:[-\s]\d+)*)/i);
  if (payerMatch) {
    // This might be account number
    info.accountNumber = payerMatch[1].replace(/\s/g, '-');
  }
  
  // Extract 계좌번호 (Account number)
  const accountMatch = text.match(/계좌번호[는은]?\s*[:\-]?\s*(\d+(?:[-\s]\d+)*)/i) ||
                         text.match(/계좌[는은]?\s*[:\-]?\s*(\d+(?:[-\s]\d+)*)/i);
  if (accountMatch) {
    info.accountNumber = accountMatch[1].replace(/\s/g, '-');
  }
  
  // Extract 예금주 (Account holder)
  const holderMatch = text.match(/예금주[는은]?\s*[:\-]?\s*([가-힣\s]+)/i) ||
                      text.match(/예금주명[는은]?\s*[:\-]?\s*([가-힣\s]+)/i);
  if (holderMatch) {
    info.accountHolder = holderMatch[1].trim();
  }
  
  // Extract 은행명 (Bank name) - common Korean banks
  const bankPatterns = [
    /(국민은행|KB국민은행|KB)/i,
    /(신한은행|신한)/i,
    /(우리은행|우리)/i,
    /(하나은행|하나)/i,
    /(NH농협은행|농협|NH)/i,
    /(기업은행|IBK)/i,
    /(카카오뱅크|카카오)/i,
    /(토스뱅크|토스)/i,
    /(케이뱅크|K뱅크)/i,
    /(SC제일은행|SC)/i,
    /(씨티은행|씨티)/i,
    /(대구은행)/i,
    /(부산은행)/i,
    /(경남은행)/i,
    /(광주은행)/i,
    /(전북은행)/i,
    /(제주은행)/i,
  ];
  
  for (const pattern of bankPatterns) {
    const match = text.match(pattern);
    if (match) {
      info.bankName = match[1];
      break;
    }
  }
  
  // If no bank name found, try to extract from context
  if (!info.bankName) {
    const bankContextMatch = text.match(/([가-힣]+은행)/);
    if (bankContextMatch) {
      info.bankName = bankContextMatch[1];
    }
  }
  
  return info;
}

/**
 * Extract amount from text
 */
export function extractAmount(text: string): string | null {
  const amountMatch = text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/i) ||
                      text.match(/금액[는은]?\s*[:\-]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/i);
  if (amountMatch) {
    return amountMatch[1];
  }
  return null;
}


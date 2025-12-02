"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Chatbot } from "./Chatbot";

export function ChatbotWrapper() {
  const pathname = usePathname();
  const [documentContext, setDocumentContext] = React.useState<{
    documentId: string;
    documentName: string;
  } | null>(null);

  // Detect if we're on a document page and load document context
  React.useEffect(() => {
    const documentIdMatch = pathname?.match(/\/app\/document\/([^/]+)/);
    if (documentIdMatch) {
      const documentId = documentIdMatch[1];
      // Load document to get name
      fetch(`/app/api/documents/${documentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.document) {
            setDocumentContext({
              documentId: data.document.id,
              documentName: data.document.fileName,
            });
          }
        })
        .catch(() => {
          // Silently fail
        });
    } else {
      setDocumentContext(null);
    }
  }, [pathname]);

  const handleDocumentUploaded = React.useCallback((documentId: string, documentName: string) => {
    setDocumentContext({
      documentId,
      documentName,
    });
  }, []);

  return <Chatbot documentContext={documentContext} onDocumentUploaded={handleDocumentUploaded} />;
}


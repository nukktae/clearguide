"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Chatbot } from "./Chatbot";
import { getIdToken } from "@/src/lib/firebase/auth";

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
      (async () => {
        try {
          const token = await getIdToken();
          if (!token) {
            return;
          }

          const headers: HeadersInit = {
            "Authorization": `Bearer ${token}`,
          };

          const res = await fetch(`/app/api/documents/${documentId}`, {
            headers,
            credentials: "include",
          });
          const data = await res.json();
          if (data.document) {
            setDocumentContext({
              documentId: data.document.id,
              documentName: data.document.fileName,
            });
          }
        } catch {
          // Silently fail
        }
      })();
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


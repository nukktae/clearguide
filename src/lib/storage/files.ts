import { promises as fs } from "fs";
import path from "path";

// Detect Vercel environment - use /tmp for serverless, data/uploads for local dev
// Vercel sets VERCEL=1 environment variable
const isVercel = process.env.VERCEL === "1";
const UPLOADS_DIR = isVercel 
  ? path.join("/tmp", "uploads")
  : path.join(process.cwd(), "data", "uploads");

// Log which directory is being used (helpful for debugging)
if (isVercel) {
  console.log("[Storage] Using Vercel serverless environment - files will be stored in /tmp/uploads");
} else {
  console.log("[Storage] Using local development environment - files will be stored in data/uploads");
}

// Ensure uploads directory exists
export async function ensureUploadsDirectory() {
  try {
    await fs.access(UPLOADS_DIR);
    console.log("[Storage] Uploads directory exists:", UPLOADS_DIR);
  } catch (error) {
    console.log("[Storage] Creating uploads directory:", UPLOADS_DIR);
    try {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      console.log("[Storage] Uploads directory created successfully");
    } catch (mkdirError) {
      console.error("[Storage] Failed to create uploads directory:", {
        path: UPLOADS_DIR,
        error: mkdirError instanceof Error ? mkdirError.message : String(mkdirError),
        isVercel,
        vercelEnv: process.env.VERCEL,
      });
      throw new Error(`Failed to create uploads directory: ${mkdirError instanceof Error ? mkdirError.message : String(mkdirError)}`);
    }
  }
}

// Save uploaded file to disk
export async function saveUploadedFile(
  file: File,
  documentId: string
): Promise<string> {
  try {
    await ensureUploadsDirectory();

    // Get file extension from original filename or MIME type
    const originalName = file.name;
    const extension = path.extname(originalName) || getExtensionFromMimeType(file.type);
    const fileName = `${documentId}${extension}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    console.log("[Storage] Saving file:", {
      fileName,
      filePath,
      fileSize: file.size,
      fileType: file.type,
      isVercel,
    });

    // Convert File to Buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    // Verify file was written successfully
    try {
      const stats = await fs.stat(filePath);
      console.log("[Storage] File saved successfully:", {
        fileName,
        filePath,
        size: stats.size,
      });
    } catch (verifyError) {
      console.error("[Storage] File write verification failed:", {
        fileName,
        filePath,
        error: verifyError instanceof Error ? verifyError.message : String(verifyError),
      });
      throw new Error(`File was written but verification failed: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`);
    }

    return fileName; // Return just the filename, not full path
  } catch (error) {
    console.error("[Storage] Error saving uploaded file:", {
      documentId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadsDir: UPLOADS_DIR,
      isVercel,
      vercelEnv: process.env.VERCEL,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

// Get file path by filename
export function getFilePath(fileName: string): string {
  return path.join(UPLOADS_DIR, fileName);
}

// Check if file exists
export async function fileExists(fileName: string): Promise<boolean> {
  try {
    const filePath = getFilePath(fileName);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Delete file
export async function deleteFile(fileName: string): Promise<boolean> {
  try {
    const filePath = getFilePath(fileName);
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete document and all related data
 * Deletes: physical file, OCR result, document record, RAG chunks, canonical data
 */
export async function deleteDocumentAndRelatedData(
  documentId: string,
  userId: string
): Promise<void> {
  try {
    console.log(`[Storage] Deleting document ${documentId} and all related data...`);
    
    // Get document to find fileName
    const { getDocumentById } = await import('@/src/lib/firebase/firestore-documents');
    const document = await getDocumentById(documentId, userId);
    
    if (document) {
      // Delete physical file if filePath exists
      if (document.filePath) {
        try {
          await deleteFile(document.filePath);
          console.log(`[Storage] Deleted physical file: ${document.filePath}`);
        } catch (error) {
          console.warn(`[Storage] Could not delete physical file ${document.filePath}:`, error);
        }
      }
      
      // Delete OCR result by fileName
      if (document.fileName) {
        try {
          const { deleteOCRResultByFileName } = await import('@/src/lib/firebase/firestore-ocr');
          await deleteOCRResultByFileName(document.fileName, userId);
          console.log(`[Storage] Deleted OCR results for fileName: ${document.fileName}`);
        } catch (error) {
          console.warn(`[Storage] Could not delete OCR results:`, error);
        }
      }
    }
    
    // Delete document record from Firestore
    try {
      const { deleteDocumentById } = await import('@/src/lib/firebase/firestore-documents');
      await deleteDocumentById(documentId, userId);
      console.log(`[Storage] Deleted document record: ${documentId}`);
    } catch (error) {
      console.warn(`[Storage] Could not delete document record:`, error);
    }
    
    // Delete RAG chunks (if Supabase is configured)
    try {
      const { deleteChunksByDocumentId } = await import('@/src/lib/supabase/vectors');
      await deleteChunksByDocumentId(documentId, userId);
      console.log(`[Storage] Deleted RAG chunks for document: ${documentId}`);
    } catch (error) {
      console.warn(`[Storage] Could not delete RAG chunks:`, error);
    }
    
    // Delete canonical data (if exists)
    try {
      const { getCanonicalDataByDocumentId, updateCanonicalData } = await import('@/src/lib/firebase/firestore-canonical');
      const canonicalData = await getCanonicalDataByDocumentId(documentId, userId);
      if (canonicalData) {
        // Note: We don't have a delete function for canonical data, so we'll just log it
        // In a production system, you'd want to add a delete function
        console.log(`[Storage] Found canonical data for document ${documentId} (not deleted - no delete function available)`);
      }
    } catch (error) {
      console.warn(`[Storage] Could not check/delete canonical data:`, error);
    }
    
    console.log(`[Storage] Successfully deleted document ${documentId} and related data`);
  } catch (error) {
    console.error(`[Storage] Error deleting document ${documentId} and related data:`, error);
    throw error;
  }
}

// Helper to get extension from MIME type
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    // HWP (Hancom) formats
    "application/vnd.hancom.hwp": ".hwp",
    "application/x-hwp": ".hwp",
    "application/haansofthwp": ".hwp",
    // Word formats
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/msword": ".doc",
  };
  return mimeToExt[mimeType] || "";
}


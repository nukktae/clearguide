import { promises as fs } from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

// Ensure uploads directory exists
export async function ensureUploadsDirectory() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

// Save uploaded file to disk
export async function saveUploadedFile(
  file: File,
  documentId: string
): Promise<string> {
  await ensureUploadsDirectory();

  // Get file extension from original filename or MIME type
  const originalName = file.name;
  const extension = path.extname(originalName) || getExtensionFromMimeType(file.type);
  const fileName = `${documentId}${extension}`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  // Convert File to Buffer and save
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(filePath, buffer);

  return fileName; // Return just the filename, not full path
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

// Helper to get extension from MIME type
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
  };
  return mimeToExt[mimeType] || "";
}


import { DocumentRecord } from "@/src/lib/parsing/types";
import { promises as fs } from "fs";
import path from "path";

const STORAGE_FILE = path.join(process.cwd(), "data", "documents.json");

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(STORAGE_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read all documents
export async function getAllDocuments(): Promise<DocumentRecord[]> {
  await ensureDataDirectory();
  
  try {
    const fileContent = await fs.readFile(STORAGE_FILE, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    // File doesn't exist yet, return empty array
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

// Get a single document by ID
export async function getDocumentById(
  id: string
): Promise<DocumentRecord | null> {
  const documents = await getAllDocuments();
  return documents.find((doc) => doc.id === id) || null;
}

// Save a new document
export async function saveDocument(
  document: DocumentRecord
): Promise<DocumentRecord> {
  await ensureDataDirectory();
  
  const documents = await getAllDocuments();
  const existingIndex = documents.findIndex((doc) => doc.id === document.id);
  
  if (existingIndex >= 0) {
    // Update existing
    documents[existingIndex] = document;
  } else {
    // Add new
    documents.push(document);
  }
  
  await fs.writeFile(STORAGE_FILE, JSON.stringify(documents, null, 2));
  return document;
}

// Delete a document
export async function deleteDocument(id: string): Promise<boolean> {
  await ensureDataDirectory();
  
  const documents = await getAllDocuments();
  const filtered = documents.filter((doc) => doc.id !== id);
  
  if (filtered.length === documents.length) {
    return false; // Document not found
  }
  
  await fs.writeFile(STORAGE_FILE, JSON.stringify(filtered, null, 2));
  return true;
}


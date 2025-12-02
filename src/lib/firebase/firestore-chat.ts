/**
 * Firestore operations for chat conversations and messages
 */

import {
  Timestamp,
  where,
  orderBy,
} from "firebase/firestore";
import {
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./firestore";

// Helper to get the correct Timestamp based on environment
function getTimestamp(): Date | Timestamp {
  // On server side, use Date (will be converted to Admin Timestamp by createDocument)
  // On client side, use client SDK Timestamp
  if (typeof window === "undefined") {
    return new Date();
  }
  return Timestamp.now();
}

const CONVERSATIONS_COLLECTION_NAME = "chatConversations";
const MESSAGES_COLLECTION_NAME = "chatMessages";

/**
 * Chat message stored in Firestore
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Timestamp | Date;
}

/**
 * Chat conversation stored in Firestore
 */
export interface ChatConversation {
  id: string;
  userId: string;
  title?: string; // Auto-generated from first message or user-set
  documentId?: string; // Optional: if conversation is about a specific document
  documentName?: string; // Optional: document name for context
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  messageCount: number;
}

/**
 * Firestore chat message (with Timestamp)
 */
type FirestoreChatMessage = Omit<ChatMessage, "timestamp"> & {
  timestamp: Timestamp;
};

/**
 * Firestore chat conversation (with Timestamp)
 */
type FirestoreChatConversation = Omit<ChatConversation, "createdAt" | "updatedAt"> & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  documentId?: string,
  documentName?: string
): Promise<string> {
  try {
    const now = getTimestamp();
    // Build conversation object, only including defined fields
    const conversation: any = {
      userId,
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    
    // Only add optional fields if they're defined
    if (documentId !== undefined) {
      conversation.documentId = documentId;
    }
    if (documentName !== undefined) {
      conversation.documentName = documentName;
    }
    
    console.log("[Firestore Chat] Creating conversation:", {
      userId,
      hasDocumentId: !!documentId,
      hasDocumentName: !!documentName,
    });
    
    const conversationId = await createDocument<FirestoreChatConversation>(
      CONVERSATIONS_COLLECTION_NAME,
      conversation
    );
    
    console.log("[Firestore Chat] Conversation created successfully:", conversationId);
    return conversationId;
  } catch (error) {
    console.error("[Firestore Chat] Error creating conversation:", error);
    console.error("[Firestore Chat] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Get conversation by ID
 */
export async function getConversationById(
  conversationId: string,
  userId?: string
): Promise<ChatConversation | null> {
  try {
    const conversationDoc = await getDocument<FirestoreChatConversation>(
      CONVERSATIONS_COLLECTION_NAME,
      conversationId
    );
    
    if (!conversationDoc) {
      return null;
    }
    
    // If userId is provided, verify ownership
    if (userId && conversationDoc.userId !== userId) {
      return null;
    }
    
    // Convert Firestore Timestamp to Date
    let createdAt: Date;
    if (conversationDoc.createdAt) {
      if (typeof conversationDoc.createdAt.toDate === 'function') {
        createdAt = conversationDoc.createdAt.toDate();
      } else if (conversationDoc.createdAt instanceof Date) {
        createdAt = conversationDoc.createdAt;
      } else {
        createdAt = new Date();
      }
    } else {
      createdAt = new Date();
    }

    let updatedAt: Date;
    if (conversationDoc.updatedAt) {
      if (typeof conversationDoc.updatedAt.toDate === 'function') {
        updatedAt = conversationDoc.updatedAt.toDate();
      } else if (conversationDoc.updatedAt instanceof Date) {
        updatedAt = conversationDoc.updatedAt;
      } else {
        updatedAt = new Date();
      }
    } else {
      updatedAt = new Date();
    }
    
    return {
      id: conversationDoc.id,
      userId: conversationDoc.userId,
      title: conversationDoc.title,
      documentId: conversationDoc.documentId,
      documentName: conversationDoc.documentName,
      messageCount: conversationDoc.messageCount,
      createdAt,
      updatedAt,
    };
  } catch (error) {
    console.error("[Firestore Chat] Error getting conversation:", error);
    throw error;
  }
}

/**
 * Get all conversations for a user
 */
export async function getAllUserConversations(
  userId: string
): Promise<ChatConversation[]> {
  try {
    const constraints = [
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
    ];
    
    const conversations = await getDocuments<FirestoreChatConversation & { id: string }>(
      CONVERSATIONS_COLLECTION_NAME,
      constraints
    );
    
    return conversations.map((doc) => {
      // Convert Firestore Timestamp to Date
      let createdAt: Date;
      if (doc.createdAt) {
        if (typeof doc.createdAt.toDate === 'function') {
          createdAt = doc.createdAt.toDate();
        } else if (doc.createdAt instanceof Date) {
          createdAt = doc.createdAt;
        } else {
          createdAt = new Date();
        }
      } else {
        createdAt = new Date();
      }

      let updatedAt: Date;
      if (doc.updatedAt) {
        if (typeof doc.updatedAt.toDate === 'function') {
          updatedAt = doc.updatedAt.toDate();
        } else if (doc.updatedAt instanceof Date) {
          updatedAt = doc.updatedAt;
        } else {
          updatedAt = new Date();
        }
      } else {
        updatedAt = new Date();
      }

      return {
        id: doc.id,
        userId: doc.userId,
        title: doc.title,
        documentId: doc.documentId,
        documentName: doc.documentName,
        messageCount: doc.messageCount,
        createdAt,
        updatedAt,
      };
    });
  } catch (error) {
    console.error("[Firestore Chat] Error getting user conversations:", error);
    throw error;
  }
}

/**
 * Update conversation
 */
export async function updateConversation(
  conversationId: string,
  userId: string,
  updates: Partial<Pick<ChatConversation, "title" | "documentId" | "documentName">>
): Promise<void> {
  try {
    // Verify ownership first
    const existing = await getConversationById(conversationId, userId);
    if (!existing) {
      throw new Error("Conversation not found or access denied");
    }
    
    const updateNow = getTimestamp();
    await updateDocument<FirestoreChatConversation>(
      CONVERSATIONS_COLLECTION_NAME,
      conversationId,
      {
        ...updates,
        updatedAt: updateNow as Timestamp,
      } as any
    );
  } catch (error) {
    console.error("[Firestore Chat] Error updating conversation:", error);
    throw error;
  }
}

/**
 * Delete conversation
 */
export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    // Verify ownership first
    const existing = await getConversationById(conversationId, userId);
    if (!existing) {
      throw new Error("Conversation not found or access denied");
    }
    
    // Delete all messages in the conversation
    const messages = await getMessagesByConversationId(conversationId, userId);
    for (const message of messages) {
      await deleteDocument(MESSAGES_COLLECTION_NAME, message.id);
    }
    
    // Delete the conversation
    await deleteDocument(CONVERSATIONS_COLLECTION_NAME, conversationId);
  } catch (error) {
    console.error("[Firestore Chat] Error deleting conversation:", error);
    throw error;
  }
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<string> {
  try {
    const now = getTimestamp();
    const message: Omit<FirestoreChatMessage, "id"> = {
      conversationId,
      role,
      content,
      timestamp: now as Timestamp,
    };
    
    const messageId = await createDocument<FirestoreChatMessage>(
      MESSAGES_COLLECTION_NAME,
      message as any
    );
    
    // Update conversation message count and updatedAt
    const conversation = await getDocument<FirestoreChatConversation>(
      CONVERSATIONS_COLLECTION_NAME,
      conversationId
    );
    
    if (conversation) {
      const updateNow = getTimestamp();
      await updateDocument<FirestoreChatConversation>(
        CONVERSATIONS_COLLECTION_NAME,
        conversationId,
        {
          messageCount: (conversation.messageCount || 0) + 1,
          updatedAt: updateNow as Timestamp,
          // Auto-generate title from first user message if not set
          title: !conversation.title && role === "user" 
            ? content.slice(0, 50) + (content.length > 50 ? "..." : "")
            : conversation.title,
        } as any
      );
    }
    
    return messageId;
  } catch (error) {
    console.error("[Firestore Chat] Error adding message:", error);
    throw error;
  }
}

/**
 * Get all messages for a conversation
 */
export async function getMessagesByConversationId(
  conversationId: string,
  userId?: string
): Promise<ChatMessage[]> {
  try {
    // Verify conversation ownership if userId is provided
    if (userId) {
      const conversation = await getConversationById(conversationId, userId);
      if (!conversation) {
        return [];
      }
    }
    
    const constraints = [
      where("conversationId", "==", conversationId),
      orderBy("timestamp", "asc"),
    ];
    
    const messages = await getDocuments<FirestoreChatMessage & { id: string }>(
      MESSAGES_COLLECTION_NAME,
      constraints
    );
    
    return messages.map((doc) => {
      // Convert Firestore Timestamp to Date
      let timestamp: Date;
      if (doc.timestamp) {
        if (typeof doc.timestamp.toDate === 'function') {
          timestamp = doc.timestamp.toDate();
        } else if (doc.timestamp instanceof Date) {
          timestamp = doc.timestamp;
        } else {
          timestamp = new Date();
        }
      } else {
        timestamp = new Date();
      }

      return {
        id: doc.id,
        conversationId: doc.conversationId,
        role: doc.role,
        content: doc.content,
        timestamp,
      };
    });
  } catch (error) {
    console.error("[Firestore Chat] Error getting messages:", error);
    throw error;
  }
}


/**
 * Firestore operations for calendar events
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

const CALENDAR_COLLECTION_NAME = "calendarEvents";

/**
 * Calendar event stored in Firestore
 */
export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  deadline: string; // YYYY-MM-DD format
  urgency: "critical" | "high" | "medium" | "low" | "action";
  documentId?: string; // Optional: if linked to a document
  documentName?: string; // Optional: if linked to a document
  type?: "custom" | "action" | "risk"; // Type of event
  severity?: "low" | "medium" | "high" | "critical"; // For risk events
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * Calendar event data for creating/updating (without id and timestamps)
 */
type CalendarEventData = Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">;

/**
 * Firestore calendar event (with Timestamp)
 */
type FirestoreCalendarEvent = Omit<CalendarEvent, "createdAt" | "updatedAt"> & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/**
 * Save calendar event to Firestore
 */
export async function saveCalendarEvent(
  userId: string,
  eventData: Omit<CalendarEventData, "userId">
): Promise<string> {
  try {
    console.log("[Firestore Calendar] Saving calendar event for user:", userId);
    console.log("[Firestore Calendar] Event data:", eventData);
    
    const event: Omit<FirestoreCalendarEvent, "id"> = {
      userId,
      ...eventData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    console.log("[Firestore Calendar] Full event object:", event);
    
    const eventId = await createDocument<FirestoreCalendarEvent>(
      CALENDAR_COLLECTION_NAME,
      event as any
    );
    
    console.log("[Firestore Calendar] Event saved successfully:", eventId);
    return eventId;
  } catch (error) {
    console.error("[Firestore Calendar] Error saving calendar event:", error);
    console.error("[Firestore Calendar] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Get calendar event by ID
 */
export async function getCalendarEventById(
  eventId: string,
  userId?: string
): Promise<CalendarEvent | null> {
  try {
    const eventDoc = await getDocument<FirestoreCalendarEvent>(
      CALENDAR_COLLECTION_NAME,
      eventId
    );
    
    if (!eventDoc) {
      return null;
    }
    
    // If userId is provided, verify ownership
    if (userId && eventDoc.userId !== userId) {
      return null;
    }
    
    // Convert Firestore Timestamp to Date
    let createdAt: Date;
    if (eventDoc.createdAt) {
      if (typeof eventDoc.createdAt.toDate === 'function') {
        createdAt = eventDoc.createdAt.toDate();
      } else if (eventDoc.createdAt instanceof Date) {
        createdAt = eventDoc.createdAt;
      } else {
        createdAt = new Date();
      }
    } else {
      createdAt = new Date();
    }

    let updatedAt: Date;
    if (eventDoc.updatedAt) {
      if (typeof eventDoc.updatedAt.toDate === 'function') {
        updatedAt = eventDoc.updatedAt.toDate();
      } else if (eventDoc.updatedAt instanceof Date) {
        updatedAt = eventDoc.updatedAt;
      } else {
        updatedAt = new Date();
      }
    } else {
      updatedAt = new Date();
    }
    
    return {
      id: eventDoc.id,
      userId: eventDoc.userId,
      title: eventDoc.title,
      description: eventDoc.description,
      deadline: eventDoc.deadline,
      urgency: eventDoc.urgency,
      documentId: eventDoc.documentId,
      documentName: eventDoc.documentName,
      type: eventDoc.type,
      severity: eventDoc.severity,
      createdAt,
      updatedAt,
    };
  } catch (error) {
    console.error("[Firestore Calendar] Error getting calendar event:", error);
    throw error;
  }
}

/**
 * Get all calendar events for a user
 */
export async function getAllUserCalendarEvents(
  userId: string,
  options?: {
    startDate?: string; // YYYY-MM-DD format
    endDate?: string; // YYYY-MM-DD format
  }
): Promise<CalendarEvent[]> {
  try {
    console.log("[Firestore Calendar] Getting events for user:", userId);
    
    let events: (FirestoreCalendarEvent & { id: string })[];
    
    try {
      // Try with orderBy first (requires composite index)
    const constraints = [
      where("userId", "==", userId),
      orderBy("deadline", "asc"),
    ];
    
      events = await getDocuments<FirestoreCalendarEvent & { id: string }>(
        CALENDAR_COLLECTION_NAME,
        constraints
      );
    } catch (indexError) {
      // If index doesn't exist, query without orderBy and sort manually
      console.warn("[Firestore Calendar] Index missing, querying without orderBy:", indexError);
      
      const constraints = [
        where("userId", "==", userId),
      ];
      
      events = await getDocuments<FirestoreCalendarEvent & { id: string }>(
      CALENDAR_COLLECTION_NAME,
      constraints
    );
      
      // Sort manually by deadline
      events.sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
    }
    
    console.log("[Firestore Calendar] Found events:", events.length);
    
    let filteredEvents = events.map((doc) => {
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
        description: doc.description,
        deadline: doc.deadline,
        urgency: doc.urgency,
        documentId: doc.documentId,
        documentName: doc.documentName,
        type: doc.type,
        severity: doc.severity,
        createdAt,
        updatedAt,
      };
    });

    // Filter by date range if provided
    if (options?.startDate || options?.endDate) {
      filteredEvents = filteredEvents.filter((event) => {
        const eventDate = event.deadline;
        if (options.startDate && eventDate < options.startDate) {
          return false;
        }
        if (options.endDate && eventDate > options.endDate) {
          return false;
        }
        return true;
      });
    }
    
    return filteredEvents;
  } catch (error) {
    console.error("[Firestore Calendar] Error getting user calendar events:", error);
    throw error;
  }
}

/**
 * Update calendar event
 */
export async function updateCalendarEvent(
  eventId: string,
  userId: string,
  eventData: Partial<Omit<CalendarEventData, "userId">>
): Promise<void> {
  try {
    // Verify ownership first
    const existing = await getCalendarEventById(eventId, userId);
    if (!existing) {
      throw new Error("Calendar event not found or access denied");
    }
    
    await updateDocument<FirestoreCalendarEvent>(
      CALENDAR_COLLECTION_NAME,
      eventId,
      {
        ...eventData,
        updatedAt: Timestamp.now(),
      } as any
    );
  } catch (error) {
    console.error("[Firestore Calendar] Error updating calendar event:", error);
    throw error;
  }
}

/**
 * Delete calendar event
 */
export async function deleteCalendarEvent(
  eventId: string,
  userId: string
): Promise<void> {
  try {
    // Verify ownership first
    const existing = await getCalendarEventById(eventId, userId);
    if (!existing) {
      throw new Error("Calendar event not found or access denied");
    }
    
    await deleteDocument(CALENDAR_COLLECTION_NAME, eventId);
  } catch (error) {
    console.error("[Firestore Calendar] Error deleting calendar event:", error);
    throw error;
  }
}


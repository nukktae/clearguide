import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/auth/api-auth";
import {
  getAllUserConversations,
  createConversation,
  deleteConversation,
  updateConversation,
} from "@/src/lib/firebase/firestore-chat";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /app/api/chat/conversations
 * Get all conversations for the authenticated user
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 * 
 * Returns: {
 *   success: boolean
 *   conversations: ChatConversation[]
 *   count: number
 * }
 */
export async function GET(request: NextRequest) {
  console.log("[API Chat] ===== GET CONVERSATIONS REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API Chat] User authenticated:", userId);
    
    const conversations = await getAllUserConversations(userId);
    console.log("[API Chat] Conversations fetched:", { count: conversations.length });

    console.log("[API Chat] ===== GET CONVERSATIONS SUCCESS =====");
    return NextResponse.json({
      success: true,
      conversations,
      count: conversations.length,
    });
  } catch (error) {
    console.error("[API] Get conversations error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "대화 목록을 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /app/api/chat/conversations
 * Create a new conversation
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 *   Content-Type: application/json
 * 
 * Body:
 *   {
 *     "documentId": "uuid-of-document" (optional),
 *     "documentName": "document name" (optional)
 *   }
 * 
 * Returns: {
 *   success: boolean
 *   conversationId: string
 *   conversation: ChatConversation
 * }
 */
export async function POST(request: NextRequest) {
  console.log("[API Chat] ===== CREATE CONVERSATION REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API Chat] User authenticated:", userId);
    
    const body = await request.json();
    const { documentId, documentName } = body;

    const conversationId = await createConversation(userId, documentId, documentName);
    
    // Get the created conversation
    const { getConversationById } = await import("@/src/lib/firebase/firestore-chat");
    const conversation = await getConversationById(conversationId, userId);

    if (!conversation) {
      throw new Error("Failed to retrieve created conversation");
    }

    console.log("[API Chat] ===== CREATE CONVERSATION SUCCESS =====");
    return NextResponse.json({
      success: true,
      conversationId,
      conversation,
    });
  } catch (error) {
    console.error("[API] Create conversation error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "대화 생성 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /app/api/chat/conversations
 * Delete a conversation
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 *   Content-Type: application/json
 * 
 * Body:
 *   {
 *     "conversationId": "uuid-of-conversation"
 *   }
 * 
 * Returns: {
 *   success: boolean
 *   message: string
 * }
 */
export async function DELETE(request: NextRequest) {
  console.log("[API Chat] ===== DELETE CONVERSATION REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API Chat] User authenticated:", userId);
    
    const body = await request.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId가 필요합니다." },
        { status: 400 }
      );
    }

    await deleteConversation(conversationId, userId);

    console.log("[API Chat] ===== DELETE CONVERSATION SUCCESS =====");
    return NextResponse.json({
      success: true,
      message: "대화가 삭제되었습니다.",
    });
  } catch (error) {
    console.error("[API] Delete conversation error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // Handle not found errors
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "대화를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: "대화 삭제 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


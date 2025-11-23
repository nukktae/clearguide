import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/auth/api-auth";
import { openai } from "@/src/lib/openai/client";
import {
  createConversation,
  getConversationById,
  addMessage,
  getMessagesByConversationId,
} from "@/src/lib/firebase/firestore-chat";
import {
  createChatbotSystemPrompt,
  buildChatMessages,
  type ChatContext,
} from "@/src/lib/openai/prompts/chatbot";
import { getDocumentById } from "@/src/lib/firebase/firestore-documents";
import { getSummaryByDocumentId } from "@/src/lib/firebase/firestore-summary";
import { getChecklistByDocumentId } from "@/src/lib/firebase/firestore-checklist";
import { getRisksByDocumentId } from "@/src/lib/firebase/firestore-risks";
import { getOCRResultById } from "@/src/lib/firebase/firestore-ocr";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /app/api/chat
 * Send a message and get AI response
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 *   Content-Type: application/json
 * 
 * Body:
 *   {
 *     "message": "user message",
 *     "conversationId": "uuid-of-conversation" (optional, creates new if not provided),
 *     "documentId": "uuid-of-document" (optional, for document context)
 *   }
 * 
 * Returns: {
 *   success: boolean
 *   conversationId: string
 *   message: {
 *     id: string
 *     role: "assistant"
 *     content: string
 *     timestamp: Date
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  console.log("[API Chat] ===== SEND MESSAGE REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API Chat] User authenticated:", userId);
    
    const body = await request.json();
    const { message, conversationId, documentId } = body;

    // Validate required fields
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "메시지가 필요합니다." },
        { status: 400 }
      );
    }

    // Get or create conversation
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      // Create new conversation
      let documentName: string | undefined;
      if (documentId) {
        const document = await getDocumentById(documentId, userId);
        documentName = document?.fileName;
      }
      currentConversationId = await createConversation(userId, documentId, documentName);
      console.log("[API Chat] Created new conversation:", currentConversationId);
    } else {
      // Verify conversation ownership
      const conversation = await getConversationById(currentConversationId, userId);
      if (!conversation) {
        return NextResponse.json(
          { error: "대화를 찾을 수 없거나 접근 권한이 없습니다." },
          { status: 404 }
        );
      }
    }

    // Save user message
    await addMessage(currentConversationId, "user", message);
    console.log("[API Chat] User message saved");

    // Build context if documentId is provided
    let context: ChatContext | undefined;
    if (documentId) {
      console.log("[API Chat] Building document context...");
      const [document, summary, checklist, risks] = await Promise.all([
        getDocumentById(documentId, userId),
        getSummaryByDocumentId(documentId, userId),
        getChecklistByDocumentId(documentId, userId),
        getRisksByDocumentId(documentId, userId),
      ]);

      context = {
        documentId,
        documentName: document?.fileName,
      };

      // Get OCR text if available
      if (document?.fileName) {
        const { getOCRResultByFileName } = await import("@/src/lib/firebase/firestore-ocr");
        const ocrResult = await getOCRResultByFileName(document.fileName, userId);
        if (ocrResult) {
          context.documentText = ocrResult.text;
        }
      }

      if (summary) {
        context.summary = summary.summary;
      }

      if (checklist) {
        context.actions = checklist.actions.map((a) => ({
          title: a.title,
          description: a.description,
          deadline: a.deadline,
        }));
      }

      if (risks) {
        context.risks = risks.risks.map((r) => ({
          title: r.title,
          message: r.message,
          deadline: r.deadline,
          severity: r.severity,
        }));
      }
    }

    // Get conversation history
    const conversationHistory = await getMessagesByConversationId(currentConversationId, userId);
    const historyForAI = conversationHistory
      .slice(-10) // Last 10 messages
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    // Build system prompt and messages
    const systemPrompt = createChatbotSystemPrompt(context);
    const messages = buildChatMessages(systemPrompt, message, context, historyForAI);

    // Get AI response
    console.log("[API Chat] Calling OpenAI...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = response.choices[0]?.message?.content || "죄송합니다. 응답을 생성할 수 없습니다.";

    // Save AI response
    const messageId = await addMessage(currentConversationId, "assistant", aiResponse);
    console.log("[API Chat] AI response saved");

    console.log("[API Chat] ===== SEND MESSAGE SUCCESS =====");
    return NextResponse.json({
      success: true,
      conversationId: currentConversationId,
      message: {
        id: messageId,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("[API] Chat error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "메시지 전송 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /app/api/chat
 * Get conversation messages
 * 
 * Query params:
 *   conversationId (required) - The conversation ID
 * 
 * Headers:
 *   Authorization: Bearer <access-token> (required)
 * 
 * Returns: {
 *   success: boolean
 *   conversation: ChatConversation
 *   messages: ChatMessage[]
 * }
 */
export async function GET(request: NextRequest) {
  console.log("[API Chat] ===== GET CONVERSATION REQUEST START =====");
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log("[API Chat] User authenticated:", userId);
    
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId가 필요합니다." },
        { status: 400 }
      );
    }

    // Get conversation
    const conversation = await getConversationById(conversationId, userId);
    if (!conversation) {
      return NextResponse.json(
        { error: "대화를 찾을 수 없거나 접근 권한이 없습니다." },
        { status: 404 }
      );
    }

    // Get messages
    const messages = await getMessagesByConversationId(conversationId, userId);

    console.log("[API Chat] ===== GET CONVERSATION SUCCESS =====");
    return NextResponse.json({
      success: true,
      conversation,
      messages,
    });
  } catch (error) {
    console.error("[API] Get conversation error:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: "대화를 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


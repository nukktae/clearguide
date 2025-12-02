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
// RAG imports
import {
  buildRAGContext,
  shouldUseRAG,
  getAdaptiveOptions,
  buildRAGSystemPrompt,
  buildRAGUserPrompt,
  formatResponseWithCitations,
  generateRefusalResponse,
  postProcessResponse,
  validateResponse,
} from "@/src/lib/rag";
import { isSupabaseConfigured } from "@/src/lib/supabase/client";
import { hasChunks } from "@/src/lib/supabase/vectors";
// Rule-based validation imports
import {
  extractDeadlines,
  extractObligations,
  extractPenalties,
} from "@/src/lib/parsing/rules";
import {
  validateLLMResponse,
  validateLLMResponseHybrid,
  type RuleBasedData,
  type HybridData,
} from "@/src/lib/parsing/rule-validator";
import { getOCRResultByFileName } from "@/src/lib/firebase/firestore-ocr";
// Hybrid model imports
import { createNERClient } from "@/src/lib/ner/client";
import { extractRelations } from "@/src/lib/parsing/relation-extraction";
import { mergeNERAndRegex, addRelationsToMergedData } from "@/src/lib/parsing/hybrid-merger";
import { buildCanonicalOutput } from "@/src/lib/parsing/canonical-output";
// PII masking imports
import { maskAll } from "@/src/lib/privacy/masker";
import { getPrivacySettings } from "@/src/lib/firebase/firestore-privacy";
import { sanitizeLLMResponse } from "@/src/lib/privacy/response-sanitizer";
import { detectPII } from "@/src/lib/privacy/pii-rules";

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

    // Get user privacy settings
    const privacySettings = await getPrivacySettings(userId);
    console.log("[API Chat] Privacy settings:", {
      maskBeforeLLM: privacySettings.maskBeforeLLM,
      outgoingMasking: privacySettings.outgoingMasking,
      maskingMode: privacySettings.maskingMode,
    });

    // Build context if documentId is provided
    let context: ChatContext | undefined;
    let useRAG = false;
    let ragContext: string | null = null;
    let ragChunks: any[] = [];

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

      // Check if RAG is available and should be used
      const ragAvailable = isSupabaseConfigured() && await hasChunks(documentId, userId);
      const shouldUseRAGForQuery = shouldUseRAG(message);
      useRAG = ragAvailable && shouldUseRAGForQuery;

      console.log("[API Chat] RAG status:", { 
        ragAvailable, 
        shouldUseRAGForQuery, 
        useRAG 
      });

      if (useRAG) {
        // Use RAG: Retrieve relevant chunks instead of full document
        console.log("[API Chat] Using RAG retrieval...");
        const adaptiveOptions = getAdaptiveOptions(message);
        const ragResult = await buildRAGContext(message, documentId, userId, adaptiveOptions);
        
        ragContext = ragResult.context;
        ragChunks = ragResult.chunks;
        
        console.log("[API Chat] RAG retrieval result:", {
          hasRelevantContent: ragResult.hasRelevantContent,
          chunksRetrieved: ragResult.chunks.length,
        });

        // If no relevant content found, return refusal response
        if (!ragResult.hasRelevantContent) {
          console.log("[API Chat] No relevant content found, returning refusal");
          const refusal = generateRefusalResponse();
          
          // Save refusal response
          const messageId = await addMessage(currentConversationId, "assistant", refusal.answer);
          
          return NextResponse.json({
            success: true,
            conversationId: currentConversationId,
            message: {
              id: messageId,
              role: "assistant",
              content: refusal.answer,
              timestamp: new Date(),
            },
            ragUsed: true,
            ragChunks: 0,
          });
        }
      } else {
        // Fallback: Get full OCR text if RAG is not available
        if (document?.fileName) {
          const { getOCRResultByFileName } = await import("@/src/lib/firebase/firestore-ocr");
          const ocrResult = await getOCRResultByFileName(document.fileName, userId);
          if (ocrResult) {
            // OCR text is already masked (saved masked in OCR route)
            // But apply masking again if privacy settings require it
            let textToUse = ocrResult.text;
            if (privacySettings.maskBeforeLLM) {
              const maskedResult = maskAll(textToUse, {
                mode: privacySettings.maskingMode,
                preserveFormat: true,
              });
              textToUse = maskedResult.maskedText;
              console.log("[API Chat] Masked OCR text before adding to context:", {
                piiTypesFound: maskedResult.metadata.piiTypes,
                itemsMasked: maskedResult.metadata.maskedItems.length,
              });
            }
            context.documentText = textToUse;
          }
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
    let systemPrompt = createChatbotSystemPrompt(context);
    let userPrompt = message;

      if (useRAG && ragContext) {
        // Mask RAG context if privacy settings require it
        if (privacySettings.maskBeforeLLM) {
          const maskedRAGResult = maskAll(ragContext, {
            mode: privacySettings.maskingMode,
            preserveFormat: true,
          });
          ragContext = maskedRAGResult.maskedText;
          console.log("[API Chat] Masked RAG context:", {
            piiTypesFound: maskedRAGResult.metadata.piiTypes,
            itemsMasked: maskedRAGResult.metadata.maskedItems.length,
          });
        }
        
        // Enhance system prompt with RAG citation instructions
        systemPrompt = buildRAGSystemPrompt(systemPrompt, true);
        // Build user prompt with RAG context
        userPrompt = buildRAGUserPrompt(message, ragContext, ragChunks);
      }

    // Mask user message if privacy settings require it
    let finalUserMessage = message;
    if (privacySettings.maskBeforeLLM) {
      const maskedMessageResult = maskAll(message, {
        mode: privacySettings.maskingMode,
        preserveFormat: true,
      });
      finalUserMessage = maskedMessageResult.maskedText;
      if (maskedMessageResult.metadata.maskedItems.length > 0) {
        console.log("[API Chat] Masked PII in user message:", {
          piiTypesFound: maskedMessageResult.metadata.piiTypes,
          itemsMasked: maskedMessageResult.metadata.maskedItems.length,
        });
      }
    }

    // Check if PII detected but masking disabled
    const piiInMessage = detectPII(message);
    if (piiInMessage.length > 0 && !privacySettings.maskBeforeLLM) {
      console.warn("[API Chat] PII detected in user message but masking is disabled:", {
        piiTypes: [...new Set(piiInMessage.map(item => item.type))],
        itemsCount: piiInMessage.length,
      });
      // Add disclaimer to system prompt
      systemPrompt += "\n\n경고: 시스템이 개인정보(PII)를 감지했지만 마스킹이 비활성화되어 있습니다. 사용자에게 이 사실을 알려주세요.";
    }

    const messages = buildChatMessages(systemPrompt, finalUserMessage, useRAG ? undefined : context, historyForAI);

    // Get AI response
    console.log("[API Chat] Calling OpenAI...", { useRAG, ragChunksCount: ragChunks.length });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      temperature: useRAG ? 0.3 : 0.7, // Lower temperature for more precise RAG answers
      max_tokens: 1000,
    });

    let aiResponse = response.choices[0]?.message?.content || "죄송합니다. 응답을 생성할 수 없습니다.";

    // Sanitize LLM response to prevent PII leakage
    if (privacySettings.outgoingMasking) {
      aiResponse = sanitizeLLMResponse(aiResponse);
      console.log("[API Chat] Sanitized LLM response to prevent PII leakage");
    }

    // Post-process RAG response for citation formatting
    if (useRAG) {
      aiResponse = postProcessResponse(aiResponse, ragChunks);
      const formattedResponse = formatResponseWithCitations(aiResponse, ragChunks);
      aiResponse = formattedResponse.answer;
      
      // Strict hallucination prevention: Validate citations and refuse if missing
      const validation = validateResponse(aiResponse, ragChunks);
      if (!validation.isValid && ragChunks.length > 0) {
        console.warn("[API Chat] Response missing citations, converting to refusal:", validation.issues);
        const refusal = generateRefusalResponse();
        aiResponse = refusal.answer;
      }
      
      console.log("[API Chat] RAG response formatted:", {
        hasEvidence: formattedResponse.hasEvidence,
        citationsCount: formattedResponse.citations.length,
        validationPassed: validation.isValid,
      });
    }

    // Hybrid model validation: Validate LLM response against NER + regex + RE
    // Only validate if we have a document context
    if (documentId) {
      try {
        console.log("[API Chat] Running hybrid validation (NER + regex + RE)...");
        
        // Get document again if not already available (should be available from context building above)
        // document is DocumentRecord | null from getDocumentById
        const documentForValidation = document || await getDocumentById(documentId, userId);
        
        // Type guard: DocumentRecord extends Document which has fileName property
        if (documentForValidation && 'fileName' in documentForValidation) {
          const fileName = (documentForValidation as { fileName: string }).fileName;
          if (fileName) {
            // Get OCR text for hybrid extraction
            const ocrResult = await getOCRResultByFileName(fileName, userId);
            
            if (ocrResult && ocrResult.text) {
              // OCR text is already masked (saved masked in OCR route)
              // Use it directly for validation (masked text is fine for NER/regex extraction)
              const textForValidation = ocrResult.text;
              
              // Step 1: Run NER extraction
              let nerEntities: any[] = [];
              try {
                const nerClient = createNERClient();
                const nerResult = await nerClient.extractEntities(textForValidation);
                nerEntities = nerResult.entities;
                console.log("[API Chat] NER extraction results:", {
                  entitiesCount: nerEntities.length,
                  model: nerResult.model,
                });
              } catch (nerError) {
                console.warn("[API Chat] NER extraction failed, falling back to regex-only:", nerError);
                // Continue with regex-only validation
              }

              // Step 2: Run regex-based extraction
              const ruleBasedDeadlines = extractDeadlines(textForValidation);
              const ruleBasedObligations = extractObligations(textForValidation);
              const ruleBasedPenalties = extractPenalties(textForValidation);
              
              console.log("[API Chat] Regex extraction results:", {
                deadlines: ruleBasedDeadlines.length,
                obligations: ruleBasedObligations.length,
                penalties: ruleBasedPenalties.length,
              });

              // Step 3: Merge NER + regex
              const mergedData = mergeNERAndRegex(nerEntities, textForValidation);

              // Step 4: Extract relations
              const relations = extractRelations(textForValidation, mergedData.entities);
              const mergedDataWithRelations = addRelationsToMergedData(mergedData, relations.relations);
              
              console.log("[API Chat] Relation extraction results:", {
                relationsCount: relations.relations.length,
              });

              // Step 5: Build hybrid data for validation
              const hybridData: HybridData = {
                deadlines: ruleBasedDeadlines,
                obligations: ruleBasedObligations,
                penalties: ruleBasedPenalties,
                nerEntities: nerEntities,
                relations: relations.relations,
                mergedData: mergedDataWithRelations,
              };
              
              // Step 6: Validate LLM response against hybrid findings
              const hybridValidation = validateLLMResponseHybrid(aiResponse, hybridData);
              
              if (!hybridValidation.isValid) {
                console.warn("[API Chat] Hybrid validation failed:", hybridValidation.issues);
                
                // Return refusal message instead of LLM output
                const refusalMessage = `죄송합니다. 제공된 문서의 중요한 정보(기한, 의무, 과태료 등)와 일치하지 않는 내용이 포함되어 있어 답변을 제공할 수 없습니다.

다음과 같은 문제가 발견되었습니다:
${hybridValidation.issues.slice(0, 5).map((issue, idx) => `${idx + 1}. ${issue}`).join('\n')}
${hybridValidation.issues.length > 5 ? `\n... 및 ${hybridValidation.issues.length - 5}개의 추가 문제` : ''}

문서의 정확한 정보를 확인하여 다시 질문해 주세요.`;
                
                // Save refusal response
                const messageId = await addMessage(currentConversationId, "assistant", refusalMessage);
                
                return NextResponse.json({
                  success: true,
                  conversationId: currentConversationId,
                  message: {
                    id: messageId,
                    role: "assistant",
                    content: refusalMessage,
                    timestamp: new Date(),
                  },
                  ragUsed: useRAG,
                  ragChunks: ragChunks.length,
                  hybridValidationFailed: true,
                  validationIssues: hybridValidation.issues,
                });
              }
              
              console.log("[API Chat] Hybrid validation passed");
            } else {
              console.log("[API Chat] OCR text not available, skipping hybrid validation");
            }
          } else {
            console.log("[API Chat] Document fileName not available, skipping hybrid validation");
          }
        } else {
          console.log("[API Chat] Document not found, skipping hybrid validation");
        }
      } catch (error) {
        // Fail-safe: If validation fails, log but don't block response
        console.error("[API Chat] Error in hybrid validation:", error);
      }
    }

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
      ragUsed: useRAG,
      ragChunks: ragChunks.length,
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


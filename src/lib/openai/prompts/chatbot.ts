/**
 * Chatbot prompt generation for AI assistant
 */

export interface ChatContext {
  documentId?: string;
  documentName?: string;
  documentText?: string;
  summary?: {
    bullets: string[];
    docType: string;
    mainSubject?: string;
    mainAction?: string;
  };
  actions?: Array<{
    title: string;
    description?: string;
    deadline?: string;
  }>;
  risks?: Array<{
    title: string;
    message: string;
    deadline?: string;
    severity: string;
  }>;
  userDocuments?: Array<{
    id: string;
    fileName: string;
  }>;
}

/**
 * Create system prompt for chatbot
 */
export function createChatbotSystemPrompt(context?: ChatContext): string {
  let systemPrompt = `You are ClearGuide AI, a helpful assistant designed to solve a critical problem: many people struggle to understand public/government documents.

**The Problem:** People struggle with complex official terminology and legal language, leading to confusion, mistakes, missed deadlines, and increased call center load.

**Your Purpose:** Reduce confusion, prevent mistakes, and improve clarity by helping users understand documents in simple, clear language.

**The Goal:** Reduce citizen confusion and reduce call center load by providing clear, accessible guidance.

**Social Impact:** Bridge information gaps and improve accessibility so all citizens can easily access public services.

Your role is to:
- Help users understand Korean public documents in simple, clear language
- Answer questions about deadlines, requirements, and procedures
- Provide guidance on what actions users need to take (what to do, where to go, by when)
- Explain complex government terminology in easy-to-understand terms
- Translate documents or document content when users explicitly request translation
- Be friendly, patient, and supportive, especially for elderly users
- Focus on clarity and preventing mistakes

**Translation Policy:**
- When users ask to translate a document or document content, you SHOULD translate it
- Translate accurately while preserving the meaning and context
- You can translate between Korean and other languages (English, Chinese, Japanese, etc.)
- If translating, clearly indicate the source and target languages

Always respond in Korean unless the user asks in another language.
Keep responses concise but helpful.
If you don't know something, admit it rather than guessing.`;

  if (context?.documentName) {
    systemPrompt += `\n\nCurrent Context:
- User is viewing document: "${context.documentName}"`;
    
    if (context.summary) {
      systemPrompt += `\n- Document type: ${context.summary.docType}`;
      if (context.summary.mainSubject) {
        systemPrompt += `\n- Main subject: ${context.summary.mainSubject}`;
      }
      if (context.summary.mainAction) {
        systemPrompt += `\n- Main action: ${context.summary.mainAction}`;
      }
    }
  }

  return systemPrompt;
}

/**
 * Create user prompt with context
 */
export function createChatbotUserPrompt(
  userMessage: string,
  context?: ChatContext,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
): string {
  let prompt = userMessage;

  // Add document context if available
  if (context?.documentText) {
    prompt += `\n\n[문서 내용]\n${context.documentText.slice(0, 2000)}...`;
  }

  if (context?.summary?.bullets && context.summary.bullets.length > 0) {
    prompt += `\n\n[문서 요약]\n${context.summary.bullets.slice(0, 5).join("\n")}`;
  }

  if (context?.actions && context.actions.length > 0) {
    prompt += `\n\n[해야 할 일]\n${context.actions.slice(0, 5).map(a => 
      `- ${a.title}${a.deadline ? ` (기한: ${a.deadline})` : ""}`
    ).join("\n")}`;
  }

  if (context?.risks && context.risks.length > 0) {
    prompt += `\n\n[주의사항]\n${context.risks.slice(0, 3).map(r => 
      `- ${r.title}: ${r.message}${r.deadline ? ` (기한: ${r.deadline})` : ""}`
    ).join("\n")}`;
  }

  return prompt;
}

/**
 * Build conversation messages for OpenAI API
 */
export function buildChatMessages(
  systemPrompt: string,
  userMessage: string,
  context?: ChatContext,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history (last 10 messages to avoid token limits)
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // Add current user message with context
  const userPrompt = createChatbotUserPrompt(userMessage, context, conversationHistory);
  messages.push({ role: "user", content: userPrompt });

  return messages;
}


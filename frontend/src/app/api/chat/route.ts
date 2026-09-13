import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { LocalVectorStore } from "@/lib/knowledge/vectorStore";
import { auth } from "@/auth";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const vectorStore = new LocalVectorStore();

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, message, sessionId } = body;

    if (!projectId || !message) {
      return NextResponse.json(
        { error: "Missing projectId or message" },
        { status: 400 }
      );
    }

    // 1. Convert the user's message to an embedding
    const embedResponse = await ai.models.embedContent({
      model: "gemini-embedding-2",
      contents: message,
    });

    const queryEmbedding = embedResponse.embeddings?.[0]?.values;
    if (!queryEmbedding) {
      throw new Error("Failed to generate embedding for the query.");
    }

    // 2. Query the vector store for top relevant chunks
    let relevantChunks = await vectorStore.similaritySearch(
      projectId,
      queryEmbedding,
      6 // Request more in case some are ghosts
    );

    // 2.5 Get material titles
    const materialIds = [...new Set(relevantChunks.map(c => c.materialId))];
    const materials = await prisma.material.findMany({
      where: { id: { in: materialIds } }
    });
    const materialMap = new Map(materials.map(m => [m.id, m.title]));
    
    // Filter out any ghost chunks (materials that were deleted from DB but remained in vector store)
    const validMaterialIds = new Set(materials.map(m => m.id));
    relevantChunks = relevantChunks.filter(c => validMaterialIds.has(c.materialId)).slice(0, 3);

    // 3. Prepare the context string
    let contextStr = "No relevant context found in uploaded materials.";
    if (relevantChunks.length > 0) {
      contextStr = relevantChunks
        .map((chunk) => `[Source: ${materialMap.get(chunk.materialId)}]\n${chunk.text}`)
        .join("\n\n");
    }

    // 4. Construct the prompt for Gemini
    const systemPrompt = `You are a helpful AI Tutor. Your goal is to answer the user's questions based ONLY on the provided context materials.
    
CONTEXT MATERIALS:
${contextStr}

INSTRUCTIONS:
- If the answer is in the context, provide a clear, helpful response.
- ALWAYS cite the material when you provide information (e.g. "According to the uploaded material...").
- If the question cannot be answered using the context, politely state that you do not have enough information in the project's materials to answer the question, and refuse to guess.
- DO NOT use outside knowledge to answer specific factual questions that should be in the materials.
`;

    // 5. Call Groq to generate the response
    const generateResponse = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.2,
    });

    const aiMessageContent = generateResponse.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
    
    // Extract chunk references for citations
    const citations = relevantChunks.map(c => ({
      materialId: c.materialId,
      id: c.id
    }));

    // 6. Save to Database
    let currentSessionId = sessionId;
    
    // Create new session if none exists
    if (!currentSessionId) {
      const newSession = await prisma.chatSession.create({
        data: { projectId },
      });
      currentSessionId = newSession.id;
    }

    // Save user message
    await prisma.message.create({
      data: {
        sessionId: currentSessionId,
        role: "user",
        content: message,
      },
    });

    // Save AI response
    const aiDbMessage = await prisma.message.create({
      data: {
        sessionId: currentSessionId,
        role: "model",
        content: aiMessageContent,
        citations: JSON.stringify(citations),
      },
    });

    const { logAIUsage } = await import("@/lib/actions/activity");
    await logAIUsage({
      userId: session.user.id,
      action: "CHAT",
      modelUsed: "openai/gpt-oss-20b",
      isSuccess: true,
    });

    return NextResponse.json({
      sessionId: currentSessionId,
      message: {
        id: aiDbMessage.id,
        role: "model",
        content: aiMessageContent,
        citations: JSON.stringify(citations),
        createdAt: aiDbMessage.createdAt
      }
    });

  } catch (error: any) {
    console.error("Chat Error:", error);

    try {
      const session = await auth();
      if (session?.user?.id) {
        const { logAIUsage } = await import("@/lib/actions/activity");
        await logAIUsage({
          userId: session.user.id,
          action: "CHAT",
          modelUsed: "openai/gpt-oss-20b",
          isSuccess: false,
          errorMessage: error.message,
        });
      }
    } catch (e) {
      // Ignore inner error
    }

    return NextResponse.json(
      { error: "An error occurred while processing your message." },
      { status: 500 }
    );
  }
}

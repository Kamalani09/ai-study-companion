import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get all material IDs for the project
    const materials = await prisma.material.findMany({
      where: { projectId, status: "COMPLETED" },
      select: { id: true, title: true }
    });

    if (materials.length === 0) {
      return NextResponse.json({ error: "No completed materials found in this project to generate a quiz from." }, { status: 400 });
    }

    const { LocalVectorStore } = require("@/lib/knowledge/vectorStore");
    const vectorStore = new LocalVectorStore();
    const allChunks = await vectorStore.getChunksByProjectId(projectId);

    // Filter chunks to ONLY include those belonging to active completed materials
    // This handles any ghost chunks from materials deleted before vector cleanup was implemented
    const activeMaterialIds = new Set(materials.map(m => m.id));
    const validChunks = allChunks.filter((chunk: any) => activeMaterialIds.has(chunk.materialId));

    if (validChunks.length === 0) {
      return NextResponse.json({ error: "No content found in materials." }, { status: 400 });
    }

    // Fallback in-memory shuffle for simplicity since this is a prototype
    const shuffled = validChunks.sort(() => 0.5 - Math.random());
    const selectedChunks = shuffled.slice(0, 5);

    const contextText = selectedChunks.map((c: any, i: number) => `[Chunk ${i+1}]\n${c.text}`).join("\n\n");

    const systemPrompt = `You are an expert AI tutor. Based on the provided context material, generate a 5-question quiz.
Generate a mix of question types: exactly 3 multiple-choice questions (MULTIPLE_CHOICE) and 2 open-ended questions (OPEN_ENDED).
For each question, also identify the core "concept" being tested (in 1-3 words).

Output your response STRICTLY as a JSON array of objects with this structure:
[
  {
    "type": "MULTIPLE_CHOICE", // or "OPEN_ENDED"
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"], // Provide options for MULTIPLE_CHOICE, use [] for OPEN_ENDED
    "answer": "The exact string of the correct option for MULTIPLE_CHOICE, or the ideal grading rubric/answer for OPEN_ENDED",
    "explanation": "Why this answer is correct",
    "concept": "Core concept name"
  }
]
Do not wrap it in markdown block quotes. Just valid JSON.`;

    const generateResponse = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b", // Updated model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `CONTEXT MATERIAL:\n${contextText}` }
      ],
      temperature: 0.3,
    });

    const responseContent = generateResponse.choices[0]?.message?.content || "[]";
    
    // Parse JSON
    let quizData;
    try {
      const jsonStr = responseContent.replace(/```json/gi, "").replace(/```/g, "").trim();
      quizData = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse LLM response as JSON:", responseContent);
      throw new Error("Failed to generate a valid quiz. Please try again.");
    }

    if (!Array.isArray(quizData) || quizData.length === 0) {
      throw new Error("Empty quiz generated.");
    }

    // Save to database
    const quiz = await prisma.quiz.create({
      data: {
        projectId,
        title: `Quiz - ${new Date().toLocaleDateString()}`,
        questions: {
          create: quizData.map((q: any) => ({
            type: q.type === "OPEN_ENDED" ? "OPEN_ENDED" : "MULTIPLE_CHOICE",
            question: q.question,
            options: JSON.stringify(q.options || []),
            answer: q.answer,
            explanation: q.explanation,
            concept: q.concept || "General"
          }))
        }
      }
    });

    const { logAIUsage } = await import("@/lib/actions/activity");
    await logAIUsage({
      userId: session.user.id,
      action: "GENERATE_QUIZ",
      modelUsed: "openai/gpt-oss-20b",
      isSuccess: true,
    });

    return NextResponse.json({ success: true, quizId: quiz.id });

  } catch (error: any) {
    console.error("Quiz Generation Error:", error);
    
    try {
      const session = await auth();
      if (session?.user?.id) {
        const { logAIUsage } = await import("@/lib/actions/activity");
        await logAIUsage({
          userId: session.user.id,
          action: "GENERATE_QUIZ",
          modelUsed: "openai/gpt-oss-20b",
          isSuccess: false,
          errorMessage: error.message,
        });
      }
    } catch (e) {
      // Ignore inner error
    }

    return NextResponse.json(
      { error: error.message || "An error occurred while generating the quiz." },
      { status: 500 }
    );
  }
}

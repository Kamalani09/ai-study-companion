import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId, answers } = await req.json();
    if (!quizId || !answers) {
      return NextResponse.json({ error: "Missing quizId or answers" }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true, project: true },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Verify ownership
    if (quiz.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let score = 0;
    const total = quiz.questions.length;

    const openEndedQuestions = quiz.questions.filter(q => q.type === "OPEN_ENDED");
    let openEndedEvaluations: Record<string, { isCorrect: boolean, explanation: string }> = {};

    if (openEndedQuestions.length > 0) {
      const Groq = (await import("groq-sdk")).default;
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });
      
      const evaluationPrompt = `You are an expert AI grader. Evaluate the following user answers to open-ended questions based on the provided rubric/ideal answer.
      
For each question, determine if the user's answer is fundamentally correct and demonstrates understanding of the concept. It does not need to be perfect, just correct in essence.

Output STRICTLY as a JSON array of objects, one for each question, in the exact same order:
[
  {
    "questionId": "id-here",
    "isCorrect": true, // or false
    "explanation": "Brief feedback to the user on why their answer is correct or incorrect, and how to improve."
  }
]
Do not include markdown blocks. Just valid JSON.`;

      const userAnswersContent = openEndedQuestions.map(q => `Question ID: ${q.id}\nQuestion: ${q.question}\nIdeal Answer / Rubric: ${q.answer}\nUser Answer: ${answers[q.id]}`).join("\n\n---\n\n");

      try {
        const evalResponse = await groq.chat.completions.create({
          model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: evaluationPrompt },
            { role: "user", content: userAnswersContent }
          ],
          temperature: 0.1,
        });

        const responseContent = evalResponse.choices[0]?.message?.content || "[]";
        const jsonStr = responseContent.replace(/```json/gi, "").replace(/```/g, "").trim();
        const evalData = JSON.parse(jsonStr);
        
        for (const item of evalData) {
          openEndedEvaluations[item.questionId] = item;
        }
      } catch (e) {
        console.error("Failed to parse or run LLM evaluation:", e);
        for (const q of openEndedQuestions) {
          openEndedEvaluations[q.id] = { isCorrect: false, explanation: "Failed to evaluate answer automatically due to server error." };
        }
      }
    }
    
    // For concept tracking: concept name -> { correct, total }
    const conceptUpdates: Record<string, { correct: number, total: number }> = {};

    const results = quiz.questions.map((q) => {
      const userAnswer = answers[q.id];
      let isCorrect = false;
      let explanation = q.explanation;
      
      if (q.type === "OPEN_ENDED") {
        const evaluation = openEndedEvaluations[q.id];
        if (evaluation) {
          isCorrect = evaluation.isCorrect;
          explanation = evaluation.explanation;
        }
      } else {
        isCorrect = userAnswer === q.answer;
      }

      if (isCorrect) score += 1;

      if (!conceptUpdates[q.concept]) {
        conceptUpdates[q.concept] = { correct: 0, total: 0 };
      }
      conceptUpdates[q.concept].total += 1;
      if (isCorrect) {
        conceptUpdates[q.concept].correct += 1;
      }

      return {
        questionId: q.id,
        type: q.type,
        isCorrect,
        correctAnswer: q.answer,
        userAnswer,
        explanation,
        concept: q.concept,
      };
    });

    // Save Attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        score,
        total,
      },
    });

    // Update Concept Mastery
    for (const [concept, stats] of Object.entries(conceptUpdates)) {
      const existing = await prisma.conceptMastery.findUnique({
        where: {
          projectId_concept: {
            projectId: quiz.projectId,
            concept: concept,
          }
        }
      });

      // Calculate a simple mastery level shift
      // If they got it right, boost it. If wrong, penalize slightly.
      // We'll use a very simple moving average for the prototype.
      const currentMastery = existing ? existing.masteryLevel : 50; // default start at 50%
      const attemptScore = (stats.correct / stats.total) * 100;
      
      const newMastery = Math.round((currentMastery + attemptScore) / 2);

      await prisma.conceptMastery.upsert({
        where: {
          projectId_concept: {
            projectId: quiz.projectId,
            concept: concept,
          }
        },
        update: {
          masteryLevel: newMastery,
          attemptsCount: { increment: 1 },
        },
        create: {
          projectId: quiz.projectId,
          concept: concept,
          masteryLevel: newMastery,
          attemptsCount: 1,
        }
      });
    }

    const { logActivity } = await import("@/lib/actions/activity");
    await logActivity({
      userId: session.user.id,
      type: "QUIZ_COMPLETED",
      details: `Scored ${score}/${total} on quiz ${quiz.title}`,
    });

    return NextResponse.json({
      success: true,
      score,
      total,
      results,
    });

  } catch (error) {
    console.error("Quiz Submit Error:", error);
    return NextResponse.json(
      { error: "An error occurred while submitting the quiz." },
      { status: 500 }
    );
  }
}

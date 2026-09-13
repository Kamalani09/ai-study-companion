import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { QuizClient } from "./quiz-client";

export default async function QuizPage({
  params,
}: {
  params: { projectId: string; quizId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { projectId, quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: {
      id: quizId,
    },
    include: {
      questions: true,
      project: true,
    },
  });

  if (!quiz || quiz.projectId !== projectId) {
    notFound();
  }

  if (quiz.project.userId !== session.user.id) {
    notFound();
  }

  // Format questions to remove correctAnswer and explanation for the client
  const clientQuestions = quiz.questions.map((q) => {
    let options: string[] = [];
    try {
      options = JSON.parse(q.options);
    } catch (e) {
      console.error("Failed to parse options for question", q.id);
    }
    return {
      id: q.id,
      type: q.type,
      question: q.question,
      options,
    };
  });

  return (
    <div className="py-6">
      <QuizClient 
        quizId={quiz.id} 
        projectId={quiz.projectId} 
        questions={clientQuestions} 
        title={quiz.title} 
      />
    </div>
  );
}

"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function deleteQuiz(quizId: string, projectId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify ownership
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
  });

  if (!project) {
    throw new Error("Unauthorized");
  }

  await prisma.quiz.delete({
    where: {
      id: quizId,
    },
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
}

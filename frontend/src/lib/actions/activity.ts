"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getRecentActivity(limit = 10) {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return await prisma.activity.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function logActivity({
  userId,
  type,
  details,
}: {
  userId: string;
  type: string;
  details?: string;
}) {
  try {
    await prisma.activity.create({
      data: {
        userId,
        type,
        details,
      },
    });
  } catch (error) {
    console.error("Failed to log activity", error);
  }
}

export async function logAIUsage({
  userId,
  action,
  modelUsed,
  promptTokens,
  compTokens,
  latencyMs,
  isSuccess = true,
  errorMessage,
}: {
  userId: string;
  action: string;
  modelUsed: string;
  promptTokens?: number;
  compTokens?: number;
  latencyMs?: number;
  isSuccess?: boolean;
  errorMessage?: string;
}) {
  try {
    await prisma.aILog.create({
      data: {
        userId,
        action,
        modelUsed,
        promptTokens,
        compTokens,
        latencyMs,
        isSuccess,
        errorMessage,
      },
    });
  } catch (error) {
    console.error("Failed to log AI usage", error);
  }
}

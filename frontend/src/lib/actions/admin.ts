"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getGlobalMetrics() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Fetch counts
  const totalUsers = await prisma.user.count();
  const totalSpaces = await prisma.space.count();
  const totalProjects = await prisma.project.count();
  const totalMaterials = await prisma.material.count();

  return {
    totalUsers,
    totalSpaces,
    totalProjects,
    totalMaterials,
  };
}

export async function getAILogs(limit = 50) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const logs = await prisma.aILog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Calculate some aggregate metrics based on the fetched logs (or all logs)
  const allLogs = await prisma.aILog.findMany({
    select: {
      promptTokens: true,
      compTokens: true,
      latencyMs: true,
      isSuccess: true,
    }
  });

  const totalLogs = allLogs.length;
  const successfulLogs = allLogs.filter(l => l.isSuccess).length;
  const successRate = totalLogs > 0 ? Math.round((successfulLogs / totalLogs) * 100) : 100;
  
  const totalTokens = allLogs.reduce((acc, log) => acc + (log.promptTokens || 0) + (log.compTokens || 0), 0);
  
  const latencies = allLogs.map(l => l.latencyMs || 0).filter(l => l > 0);
  const avgLatency = latencies.length > 0 
    ? Math.round(latencies.reduce((acc, val) => acc + val, 0) / latencies.length) 
    : 0;

  return {
    logs,
    aggregates: {
      successRate,
      totalTokens,
      avgLatency,
      totalCalls: totalLogs
    }
  };
}

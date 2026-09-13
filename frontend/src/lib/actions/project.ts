"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProject(spaceId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Authorize space ownership at query level
  const space = await prisma.space.findUnique({
    where: {
      id: spaceId,
      userId: session.user.id,
    }
  });

  if (!space) {
    throw new Error("Space not found or unauthorized");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const learningGoal = formData.get("learningGoal") as string;

  if (!name || name.trim() === "") {
    throw new Error("Project name is required");
  }

  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        learningGoal,
        spaceId,
        userId: session.user.id, // Ensure isolation
      },
    });

    await prisma.activity.create({
      data: {
        type: "PROJECT_CREATED",
        details: JSON.stringify({ projectId: project.id, spaceId, name: project.name }),
        userId: session.user.id,
      },
    });

    revalidatePath(`/spaces/${spaceId}`);
    return { success: true, project };
  } catch (error) {
    console.error("Failed to create project:", error);
    return { error: "Failed to create project" };
  }
}

export async function getProjects(spaceId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Authorization handled directly in the query
  return await prisma.project.findMany({
    where: {
      spaceId,
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function getProjectDetails(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
      userId: session.user.id,
    }
  });

  if (!project) {
    throw new Error("Project not found or unauthorized");
  }

  return project;
}

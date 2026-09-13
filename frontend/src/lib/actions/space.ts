"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSpace(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name || name.trim() === "") {
    throw new Error("Space name is required");
  }

  try {
    const space = await prisma.space.create({
      data: {
        name,
        description,
        userId: session.user.id,
      },
    });

    await prisma.activity.create({
      data: {
        type: "SPACE_CREATED",
        details: JSON.stringify({ spaceId: space.id, name: space.name }),
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, space };
  } catch (error) {
    console.error("Failed to create space:", error);
    return { error: "Failed to create space" };
  }
}

export async function getSpaces() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return await prisma.space.findMany({
    where: {
      userId: session.user.id, // Strictly isolated to current user
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      _count: {
        select: { projects: true }
      }
    }
  });
}

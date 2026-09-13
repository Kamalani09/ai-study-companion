"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { processMaterial } from "../knowledge/processor";
import { after } from "next/server";

export async function uploadMaterial(projectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  // Ensure user owns this project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
  });

  if (!project) {
    throw new Error("Project not found or unauthorized");
  }

  // Generate unique filename
  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const newFileName = `${timestamp}-${safeFileName}`;

  // Save to public/uploads
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, newFileName);
  const arrayBuffer = await file.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

  // Create material record
  const material = await prisma.material.create({
    data: {
      title: file.name,
      fileName: newFileName,
      fileUrl: `/uploads/${newFileName}`,
      status: "PENDING",
      projectId: project.id,
    },
  });


  // Fire and forget the processing safely
  after(async () => {
    try {
      await processMaterial(material.id);
    } catch (e) {
      console.error("Background processing error:", e);
    }
  });

  // Revalidate project page
  revalidatePath(`/dashboard/projects/${projectId}`);

  const { logActivity } = await import("@/lib/actions/activity");
  await logActivity({
    userId: session.user.id,
    type: "MATERIAL_UPLOADED",
    details: `Uploaded ${file.name}`,
  });

  return { success: true, materialId: material.id };
}

export async function deleteMaterial(materialId: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Ensure user owns this project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
  });

  if (!project) {
    throw new Error("Project not found or unauthorized");
  }

  const material = await prisma.material.findUnique({
    where: { id: materialId, projectId: project.id },
  });

  if (!material) {
    throw new Error("Material not found");
  }

  // Delete the file if it exists
  const filePath = path.join(process.cwd(), "public", "uploads", material.fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete chunks from vector store
  const { LocalVectorStore } = await import("../knowledge/vectorStore");
  const vectorStore = new LocalVectorStore();
  await vectorStore.deleteDocumentsByMaterialId(materialId);

  // Delete from DB (cascade should handle chunks if configured, otherwise we'd need to delete chunks from vector store)
  await prisma.material.delete({
    where: { id: materialId },
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
}

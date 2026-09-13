import { expect, test, describe, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import fs from "fs";
import path from "path";

// Mock auth
import * as authModule from "../src/auth";
import { uploadMaterial } from "../src/lib/actions/material";

// We'll mock processMaterial to avoid actually calling Gemini during tests
import * as processorModule from "../src/lib/knowledge/processor";

describe("Material Upload and Processing", () => {
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    // Create test user and project
    const user = await prisma.user.create({
      data: { name: "Test User", email: "test-material@example.com" },
    });
    userId = user.id;

    const space = await prisma.space.create({
      data: { name: "Test Space", userId: user.id },
    });

    const project = await prisma.project.create({
      data: { name: "Test Project", spaceId: space.id, userId: user.id },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.user.delete({ where: { id: userId } });
    const dataDir = path.join(process.cwd(), "data");
    if (fs.existsSync(dataDir)) {
      fs.rmSync(dataDir, { recursive: true, force: true });
    }
  });

  test("uploadMaterial creates record and triggers processing", async () => {
    // Mock the session
    const mockAuth = async () => ({ user: { id: userId } });
    (authModule as any).auth = mockAuth;

    // Mock processing so it doesn't really call Gemini
    let processedId = "";
    (processorModule as any).processMaterial = async (id: string) => {
      processedId = id;
      return { success: true };
    };

    // Create a mock PDF File
    const file = new File(["dummy pdf content"], "test.pdf", { type: "application/pdf" });
    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadMaterial(projectId, formData);
    
    expect(res.success).toBe(true);
    expect(res.materialId).toBeDefined();

    // Verify DB
    const material = await prisma.material.findUnique({
      where: { id: res.materialId }
    });

    expect(material).not.toBeNull();
    expect(material?.title).toBe("test.pdf");
    expect(material?.status).toBe("PENDING"); // Starts as PENDING before background job updates it
    expect(material?.projectId).toBe(projectId);

    // Verify background job was called
    // Wait a tick for the async catch to run
    await new Promise(r => setTimeout(r, 100));
    expect(processedId).toBe(res.materialId);
  });
});

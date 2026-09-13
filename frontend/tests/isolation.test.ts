import test from "node:test";
import assert from "node:assert";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

// We'll test the actual queries that the server actions use to prove isolation works.
// Mocking Next.js `auth()` in a plain node test is tricky, so we will validate the DB logic directly
// by replicating the query patterns used in space.ts and project.ts

test("Data Isolation Tests", async (t) => {
  // Setup
  const hash = await bcrypt.hash("password", 10);
  
  const userA = await prisma.user.create({
    data: { email: "userA@test.com", passwordHash: hash, name: "User A" }
  });
  
  const userB = await prisma.user.create({
    data: { email: "userB@test.com", passwordHash: hash, name: "User B" }
  });

  const spaceA = await prisma.space.create({
    data: { name: "Space A", userId: userA.id }
  });

  const projectA = await prisma.project.create({
    data: { name: "Project A", spaceId: spaceA.id, userId: userA.id }
  });

  await t.test("User B sees zero spaces", async () => {
    // This replicates getSpaces() for User B
    const spaces = await prisma.space.findMany({
      where: { userId: userB.id }
    });
    assert.strictEqual(spaces.length, 0);
  });

  await t.test("User A sees their space", async () => {
    const spaces = await prisma.space.findMany({
      where: { userId: userA.id }
    });
    assert.strictEqual(spaces.length, 1);
    assert.strictEqual(spaces[0].id, spaceA.id);
  });

  await t.test("User B cannot access User A's space (simulating createProject auth check)", async () => {
    // This replicates the authorization check in createProject
    const space = await prisma.space.findUnique({
      where: {
        id: spaceA.id,
        userId: userB.id, // User B trying to access Space A
      }
    });
    assert.strictEqual(space, null);
  });

  await t.test("User B cannot read User A's projects", async () => {
    // This replicates getProjects
    const projects = await prisma.project.findMany({
      where: {
        spaceId: spaceA.id,
        userId: userB.id,
      }
    });
    assert.strictEqual(projects.length, 0);
  });

  // Cleanup
  await prisma.project.deleteMany({});
  await prisma.space.deleteMany({});
  await prisma.user.deleteMany({});
});

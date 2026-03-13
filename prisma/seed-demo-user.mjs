import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_EMAIL =
  process.env.DEMO_USER_EMAIL ??
  process.env.NEXT_PUBLIC_DEMO_USER_EMAIL ??
  "demo@notably.app";
const DEMO_PASSWORD =
  process.env.DEMO_USER_PASSWORD ??
  process.env.NEXT_PUBLIC_DEMO_USER_PASSWORD ??
  "DemoPass123!";
const DEMO_NAME = process.env.DEMO_USER_NAME ?? "Notably Demo";
const DEMO_WORKSPACE_NAME = process.env.DEMO_WORKSPACE_NAME ?? "Demo Workspace";
const DEMO_NOTE_TITLE = process.env.DEMO_NOTE_TITLE ?? "Untitled demo note";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: {
      email: DEMO_EMAIL.toLowerCase().trim(),
    },
    update: {
      name: DEMO_NAME,
      passwordHash,
    },
    create: {
      email: DEMO_EMAIL.toLowerCase().trim(),
      name: DEMO_NAME,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  let workspace = await prisma.workspace.findFirst({
    where: {
      createdById: user.id,
      name: DEMO_WORKSPACE_NAME,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: DEMO_WORKSPACE_NAME,
        createdById: user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    update: {
      role: "OWNER",
    },
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: "OWNER",
    },
  });

  let note = await prisma.note.findFirst({
    where: {
      workspaceId: workspace.id,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      title: true,
      roomId: true,
    },
  });

  if (!note) {
    note = await prisma.note.create({
      data: {
        title: DEMO_NOTE_TITLE,
        workspaceId: workspace.id,
        createdById: user.id,
        roomId: `note-${randomUUID()}`,
      },
      select: {
        id: true,
        title: true,
        roomId: true,
      },
    });
  }

  await prisma.notePermission.upsert({
    where: {
      noteId_userId: {
        noteId: note.id,
        userId: user.id,
      },
    },
    update: {
      role: "OWNER",
    },
    create: {
      noteId: note.id,
      userId: user.id,
      role: "OWNER",
    },
  });

  console.log("Demo data ready:");
  console.log(`- User: ${user.email} (${user.name ?? "No name"})`);
  console.log(`- Password: ${DEMO_PASSWORD}`);
  console.log(`- Workspace: ${workspace.name}`);
  console.log(`- Note: ${note.title}`);
}

main()
  .catch((error) => {
    console.error("Failed to seed demo data.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import type { NotePermissionRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type NoteAccess = {
  noteId: string;
  roomId: string;
  title: string;
  workspaceId: string;
  workspaceName: string;
  viewerCanMessage: boolean;
  role: NotePermissionRole;
};

export async function getNoteAccessForUser(
  noteId: string,
  userId: string,
): Promise<NoteAccess | null> {
  const note = await prisma.note.findUnique({
    where: {
      id: noteId,
    },
    select: {
      id: true,
      roomId: true,
      title: true,
      workspaceId: true,
      viewerCanMessage: true,
      workspace: {
        select: {
          id: true,
          name: true,
          members: {
            where: {
              userId,
            },
            select: {
              id: true,
            },
          },
        },
      },
      permissions: {
        where: {
          userId,
        },
        select: {
          role: true,
        },
      },
    },
  });

  if (!note) {
    return null;
  }

  if (note.workspace.members.length === 0) {
    return null;
  }

  const permission = note.permissions[0];

  if (!permission) {
    return null;
  }

  return {
    noteId: note.id,
    roomId: note.roomId,
    title: note.title,
    workspaceId: note.workspace.id,
    workspaceName: note.workspace.name,
    viewerCanMessage: note.viewerCanMessage,
    role: permission.role,
  };
}

export async function getNoteByRoomAccessForUser(
  roomId: string,
  userId: string,
): Promise<NoteAccess | null> {
  const note = await prisma.note.findUnique({
    where: {
      roomId,
    },
    select: {
      id: true,
      roomId: true,
      title: true,
      workspaceId: true,
      viewerCanMessage: true,
      workspace: {
        select: {
          id: true,
          name: true,
          members: {
            where: {
              userId,
            },
            select: {
              id: true,
            },
          },
        },
      },
      permissions: {
        where: {
          userId,
        },
        select: {
          role: true,
        },
      },
    },
  });

  if (!note || note.workspace.members.length === 0) {
    return null;
  }

  const permission = note.permissions[0];

  if (!permission) {
    return null;
  }

  return {
    noteId: note.id,
    roomId: note.roomId,
    title: note.title,
    workspaceId: note.workspace.id,
    workspaceName: note.workspace.name,
    viewerCanMessage: note.viewerCanMessage,
    role: permission.role,
  };
}

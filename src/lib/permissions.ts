import type { NotePermissionRole } from "@prisma/client";

export function canViewNote(role: NotePermissionRole): boolean {
  return role === "OWNER" || role === "EDITOR" || role === "VIEWER";
}

export function canEditNote(role: NotePermissionRole): boolean {
  return role === "OWNER" || role === "EDITOR";
}

export function canManageNote(role: NotePermissionRole): boolean {
  return role === "OWNER";
}

export function roleLabel(role: NotePermissionRole): string {
  if (role === "OWNER") {
    return "Owner";
  }
  if (role === "EDITOR") {
    return "Editor";
  }
  return "Viewer";
}

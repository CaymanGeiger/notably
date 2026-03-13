import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { LiveNoteEditor } from "@/components/live-note-editor";
import { NoteChatPanel } from "@/components/note-chat-panel";
import { NoteRoomProvider } from "@/components/note-room-provider";
import { NoteSettings } from "@/components/note-settings";
import { PermissionManager } from "@/components/permission-manager";
import { SignOutButton } from "@/components/signout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getNoteAccessForUser } from "@/lib/note-access";
import { canEditNote, canManageNote, roleLabel } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { resolveThemeMode, themePreferenceCookieName } from "@/lib/theme";

type NotePageProps = {
  params: Promise<{
    noteId: string;
  }>;
};

export default async function NotePage({ params }: NotePageProps) {
  const cookieStore = await cookies();
  const initialTheme = resolveThemeMode(cookieStore.get(themePreferenceCookieName)?.value);
  const { noteId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect("/signin");
  }

  const access = await getNoteAccessForUser(noteId, user.id);

  if (!access) {
    notFound();
  }

  const note = await prisma.note.findUnique({
    where: {
      id: noteId,
    },
    select: {
      id: true,
      title: true,
      roomId: true,
      viewerCanMessage: true,
      workspace: {
        select: {
          id: true,
          name: true,
          members: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      permissions: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        take: 300,
        select: {
          id: true,
          body: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!note) {
    notFound();
  }

  const canEdit = canEditNote(access.role);
  const canManage = canManageNote(access.role);
  const canMessage = access.role !== "VIEWER" || note.viewerCanMessage;

  return (
    <main className="app-shell note-shell">
      <header className="page-header note-header reveal">
        <div className="stack compact">
          <Link className="template-back-link" href="/workspaces">
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Workspaces</span>
          </Link>
          <h1>{note.title}</h1>
          <div className="inline-row">
            <span className="status-chip">{note.workspace.name}</span>
            <span className="status-chip">{roleLabel(access.role)}</span>
            <span className="status-chip">
              {note.viewerCanMessage ? "Viewer Chat On" : "Viewer Chat Off"}
            </span>
          </div>
        </div>
        <div className="note-header-actions">
          <ThemeToggle initialTheme={initialTheme} />
          <SignOutButton />
        </div>
      </header>

      <section className="note-layout reveal">
        <NoteRoomProvider roomId={note.roomId}>
          <div className="note-main stack">
            <LiveNoteEditor noteId={note.id} canEdit={canEdit} />
            <NoteChatPanel
              noteId={note.id}
              canMessage={canMessage}
              initialMessages={note.messages.map((message) => ({
                ...message,
                createdAt: message.createdAt.toISOString(),
              }))}
            />
          </div>
        </NoteRoomProvider>

        <aside className="note-aside stack">
          <NoteSettings
            noteId={note.id}
            initialTitle={note.title}
            initialViewerCanMessage={note.viewerCanMessage}
            canEdit={canEdit}
            canManage={canManage}
          />

          {canManage ? (
            <PermissionManager
              noteId={note.id}
              members={note.workspace.members.map((member) => member.user)}
              initialPermissions={note.permissions}
              currentUserId={user.id}
            />
          ) : null}
        </aside>
      </section>
    </main>
  );
}

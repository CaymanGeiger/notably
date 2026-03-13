"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type WorkspaceOption = {
  id: string;
  name: string;
};

type DashboardControlsProps = {
  workspaces: WorkspaceOption[];
};

export function DashboardControls({ workspaces }: DashboardControlsProps) {
  const router = useRouter();

  const [workspaceName, setWorkspaceName] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaces[0]?.id ?? "");

  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  async function onCreateWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setWorkspaceError(null);
    setIsCreatingWorkspace(true);

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: workspaceName,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setWorkspaceError(payload?.error ?? "Failed to create workspace");
        return;
      }

      const payload = (await response.json()) as {
        workspace: {
          id: string;
        };
      };

      setWorkspaceName("");
      setSelectedWorkspaceId(payload.workspace.id);
      router.refresh();
    } finally {
      setIsCreatingWorkspace(false);
    }
  }

  async function onCreateNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setNoteError(null);

    if (!selectedWorkspaceId) {
      setNoteError("Create or select a workspace first");
      return;
    }

    setIsCreatingNote(true);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: selectedWorkspaceId,
          title: noteTitle.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setNoteError(payload?.error ?? "Failed to create note");
        return;
      }

      const payload = (await response.json()) as {
        note: {
          id: string;
        };
      };

      setNoteTitle("");
      router.push(`/notes/${payload.note.id}`);
      router.refresh();
    } finally {
      setIsCreatingNote(false);
    }
  }

  return (
    <section className="dashboard-controls reveal">
      <form className="panel stack" onSubmit={onCreateWorkspace}>
        <div className="stack compact">
          <p className="eyebrow">Create</p>
          <h2>New Workspace</h2>
          <p className="muted-text">Start a team space and manage who can collaborate on notes.</p>
        </div>

        <label className="field">
          Workspace Name
          <input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder="Product Team"
          />
        </label>
        {workspaceError ? <p className="error-text">{workspaceError}</p> : null}
        <button className="primary-btn" type="submit" disabled={isCreatingWorkspace}>
          {isCreatingWorkspace ? "Creating..." : "Create Workspace"}
        </button>
      </form>

      <form className="panel stack" onSubmit={onCreateNote}>
        <div className="stack compact">
          <p className="eyebrow">Compose</p>
          <h2>New Note</h2>
          <p className="muted-text">Create a note room and begin realtime collaboration instantly.</p>
        </div>

        <label className="field">
          Workspace
          <select
            value={selectedWorkspaceId}
            onChange={(event) => setSelectedWorkspaceId(event.target.value)}
            disabled={workspaces.length === 0}
          >
            {workspaces.length === 0 ? <option value="">No workspaces yet</option> : null}
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Note Title
          <input
            type="text"
            maxLength={120}
            value={noteTitle}
            onChange={(event) => setNoteTitle(event.target.value)}
            placeholder="Sprint Planning"
          />
        </label>

        {noteError ? <p className="error-text">{noteError}</p> : null}

        <button className="primary-btn" type="submit" disabled={isCreatingNote}>
          {isCreatingNote ? "Creating..." : "Create Note"}
        </button>
      </form>
    </section>
  );
}

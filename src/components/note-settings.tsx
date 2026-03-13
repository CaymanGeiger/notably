"use client";

import { FormEvent, useState } from "react";

type NoteSettingsProps = {
  noteId: string;
  initialTitle: string;
  initialViewerCanMessage: boolean;
  canEdit: boolean;
  canManage: boolean;
};

export function NoteSettings({
  noteId,
  initialTitle,
  initialViewerCanMessage,
  canEdit,
  canManage,
}: NoteSettingsProps) {
  const [title, setTitle] = useState(initialTitle);
  const [viewerCanMessage, setViewerCanMessage] = useState(initialViewerCanMessage);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit && !canManage) {
      return;
    }

    setMessage(null);
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(canEdit
            ? {
                title,
              }
            : {}),
          ...(canManage
            ? {
                viewerCanMessage,
              }
            : {}),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(payload?.error ?? "Unable to update note settings");
        return;
      }

      setMessage("Saved");
      window.setTimeout(() => setMessage(null), 1200);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="panel stack" onSubmit={onSubmit}>
      <h2>Note Settings</h2>

      <label className="field">
        Title
        <input
          type="text"
          value={title}
          disabled={!canEdit || isSaving}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={viewerCanMessage}
          disabled={!canManage || isSaving}
          onChange={(event) => setViewerCanMessage(event.target.checked)}
        />
        Allow viewers to post in chat
      </label>

      {message ? <p className="muted-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <button
        type="submit"
        className="primary-btn"
        disabled={isSaving || (!canEdit && !canManage)}
      >
        {isSaving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}

"use client";

import { FocusEvent, useEffect, useMemo, useRef, useState } from "react";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useMyPresence, useOthers, useRoom, useSelf } from "@liveblocks/react/suspense";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import type { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";

import {
  decodeBase64ToYDocState,
  encodeYDocStateToBase64,
  noteContentFragmentName,
} from "@/lib/ydoc-state";
import { defaultThemeMode, resolveThemeMode } from "@/lib/theme";

type LiveNoteEditorProps = {
  noteId: string;
  canEdit: boolean;
};

type AutosaveStatus = "saving" | "saved" | "error";

function getThemeMode(): "light" | "dark" {
  if (typeof document === "undefined") {
    return defaultThemeMode;
  }

  return resolveThemeMode(document.documentElement.getAttribute("data-theme"));
}

function pickColor(value: string): string {
  const palette = [
    "#4f79c3",
    "#de7b5f",
    "#6ea166",
    "#8f6ac3",
    "#d29553",
    "#59a6b2",
    "#c05d8d",
  ];

  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return palette[Math.abs(hash) % palette.length];
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read file"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function LiveNoteEditor({ noteId, canEdit }: LiveNoteEditorProps) {
  const room = useRoom();
  const self = useSelf((me) => ({
    id: me.id,
    info: me.info as { name?: string; email?: string } | undefined,
  }));

  const userName = self.info?.name ?? self.info?.email ?? "Collaborator";
  const userIdForColor = self.id ?? userName;
  const userColor = useMemo(() => pickColor(userIdForColor), [userIdForColor]);

  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("saved");
  const [autosaveError, setAutosaveError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(getThemeMode);
  const autosaveTimerRef = useRef<number | null>(null);
  const saveInFlightRef = useRef(false);
  const pendingEncodedStateRef = useRef<string | null>(null);
  const lastSavedEncodedStateRef = useRef<string | null>(null);

  const [, updateMyPresence] = useMyPresence();
  const others = useOthers();

  const activeEditors = useMemo(() => {
    return others
      .filter(
        (other) =>
          Boolean((other.presence as { isEditing?: boolean } | undefined)?.isEditing),
      )
      .map((other) => {
        const info = other.info as { name?: string; email?: string } | undefined;
        return info?.name ?? info?.email ?? "Collaborator";
      });
  }, [others]);

  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const yDoc = useMemo(() => new Y.Doc(), []);
  const yProvider = useMemo(() => new LiveblocksYjsProvider(room, yDoc), [room, yDoc]);
  const collaborationProvider = useMemo(
    () =>
      ({
        awareness: yProvider.awareness as unknown as Awareness,
      }) as {
        awareness?: Awareness;
      },
    [yProvider.awareness],
  );

  useEffect(() => {
    return () => {
      yProvider.destroy();
      yDoc.destroy();
    };
  }, [yDoc, yProvider]);

  useEffect(() => {
    function syncTheme() {
      setTheme(getThemeMode());
    }

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const editor = useCreateBlockNote(
    {
      defaultStyles: true,
      trailingBlock: true,
      tables: {
        splitCells: true,
        headers: true,
        cellBackgroundColor: true,
        cellTextColor: true,
      },
      uploadFile: fileToDataUrl,
      collaboration: {
        provider: collaborationProvider,
        fragment: yDoc.getXmlFragment(noteContentFragmentName),
        user: {
          name: userName,
          color: userColor,
        },
        showCursorLabels: "activity",
      },
    },
    [collaborationProvider, yDoc, userColor, userName],
  );

  useEffect(() => {
    let ignore = false;

    async function hydrateFromDatabase() {
      try {
        const response = await fetch(`/api/notes/${noteId}/content`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          note?: {
            contentYdocState?: string | null;
          };
        };

        const encoded = payload.note?.contentYdocState;

        if (!encoded || ignore) {
          return;
        }

        Y.applyUpdate(yDoc, decodeBase64ToYDocState(encoded), "db-hydrate");
        lastSavedEncodedStateRef.current = encoded;
      } catch {
        // Keep editor usable even if initial DB hydration fails.
      }
    }

    void hydrateFromDatabase();

    return () => {
      ignore = true;
    };
  }, [noteId, yDoc]);

  useEffect(() => {
    let ignore = false;

    function clearAutosaveTimer() {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    }

    async function flushAutosave() {
      if (ignore || !canEdit || saveInFlightRef.current) {
        return;
      }

      const encodedState = pendingEncodedStateRef.current;

      if (!encodedState || encodedState === lastSavedEncodedStateRef.current) {
        if (!ignore) {
          setAutosaveStatus("saved");
        }
        return;
      }

      saveInFlightRef.current = true;
      pendingEncodedStateRef.current = null;
      setAutosaveStatus("saving");
      setAutosaveError(null);

      try {
        const response = await fetch(`/api/notes/${noteId}/content`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ydocState: encodedState,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error ?? "Autosave failed");
        }

        lastSavedEncodedStateRef.current = encodedState;
        if (!ignore && !pendingEncodedStateRef.current) {
          setAutosaveStatus("saved");
        }
      } catch (error) {
        pendingEncodedStateRef.current = encodedState;
        if (!ignore) {
          setAutosaveStatus("error");
          setAutosaveError(error instanceof Error ? error.message : "Autosave failed");
        }
      } finally {
        saveInFlightRef.current = false;
      }

      if (
        !ignore &&
        pendingEncodedStateRef.current &&
        pendingEncodedStateRef.current !== lastSavedEncodedStateRef.current
      ) {
        void flushAutosave();
      }
    }

    function scheduleAutosave() {
      clearAutosaveTimer();
      autosaveTimerRef.current = window.setTimeout(() => {
        autosaveTimerRef.current = null;
        void flushAutosave();
      }, 450);
    }

    function onYDocUpdate(_update: Uint8Array, origin: unknown) {
      if (!canEdit || origin === "backend" || origin === "db-hydrate") {
        return;
      }

      pendingEncodedStateRef.current = encodeYDocStateToBase64(yDoc);
      setAutosaveStatus("saving");
      setAutosaveError(null);
      scheduleAutosave();
    }

    yDoc.on("update", onYDocUpdate);

    return () => {
      ignore = true;
      clearAutosaveTimer();
      yDoc.off("update", onYDocUpdate);
    };
  }, [canEdit, noteId, yDoc]);

  function markEditing() {
    if (!canEdit) {
      return;
    }

    updateMyPresence({ isEditing: true });
  }

  function clearEditing(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget as Node | null;
    const hasFocusInside = nextTarget ? editorContainerRef.current?.contains(nextTarget) : false;

    if (!hasFocusInside) {
      updateMyPresence({ isEditing: false });
    }
  }

  return (
    <section className="panel stack grow">
      <div className="panel-header">
        <h2>Editor</h2>
        <div className="inline-row">
          <span
            className={`status-chip autosave-indicator ${
              canEdit ? `autosave-indicator--${autosaveStatus}` : "autosave-indicator--readonly"
            }`}
            aria-live="polite"
          >
            {canEdit ? (
              autosaveStatus === "saving" ? (
                <>
                  <span className="autosave-spinner" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="autosave-spinner-svg">
                      <circle className="autosave-spinner-track" cx="12" cy="12" r="9" />
                      <circle className="autosave-spinner-path" cx="12" cy="12" r="9" />
                    </svg>
                  </span>
                  <span>Autosaving...</span>
                </>
              ) : autosaveStatus === "error" ? (
                <>
                  <span className="autosave-error-dot" aria-hidden="true" />
                  <span>Autosave failed</span>
                </>
              ) : (
                <>
                  <span className="autosave-check" aria-hidden="true">
                    <svg viewBox="0 0 20 20" className="autosave-check-svg">
                      <circle className="autosave-check-ring" cx="10" cy="10" r="8" />
                      <path className="autosave-check-path" d="M6.3 10.3l2.2 2.2 5.2-5.2" />
                    </svg>
                  </span>
                  <span>All changes saved</span>
                </>
              )
            ) : (
              <span>Read-only (viewer)</span>
            )}
          </span>
        </div>
      </div>

      <div
        ref={editorContainerRef}
        className="note-blocknote-shell"
        onFocus={markEditing}
        onBlur={clearEditing}
      >
        <BlockNoteView
          editor={editor}
          editable={canEdit}
          theme={theme}
          formattingToolbar
          linkToolbar
          slashMenu
          sideMenu
          filePanel
          tableHandles
          emojiPicker
        />
      </div>

      {activeEditors.length > 0 ? (
        <p className="muted-text">Currently editing: {activeEditors.join(", ")}</p>
      ) : (
        <p className="muted-text">No collaborators actively editing right now.</p>
      )}

      {canEdit && autosaveError ? <p className="error-text">{autosaveError}</p> : null}

    </section>
  );
}

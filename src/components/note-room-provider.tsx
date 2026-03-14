"use client";

import { ReactNode } from "react";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";

type NoteRoomProviderProps = {
  roomId: string;
  children: ReactNode;
};

export function NoteRoomProvider({ roomId, children }: NoteRoomProviderProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{ isEditing: false }}>
        <ClientSideSuspense
          fallback={
            <div className="note-main stack note-room-loading">
              <section
                className="panel stack grow note-room-loading-panel"
                role="status"
                aria-live="polite"
              >
                <div className="panel-header">
                  <h2>Editor</h2>
                </div>

                <div className="note-room-loading-editor-shell">
                  <div className="note-room-loading-status">
                    <span className="note-room-loading-orb" aria-hidden="true">
                      <span className="note-room-loading-orb-core" />
                    </span>
                    <div className="note-room-loading-copy">
                      <strong>Preparing editor</strong>
                      <p>Syncing collaborators and note content.</p>
                    </div>
                  </div>
                </div>

                <p className="muted-text">No collaborators actively editing right now.</p>
              </section>

              <section className="panel stack note-room-loading-chat">
                <div className="panel-header">
                  <h2>Discussion</h2>
                  <span className="status-chip">Loading</span>
                </div>

                <div className="chat-scroll note-room-loading-chat-scroll">
                  <p className="muted-text">Preparing discussion history.</p>
                </div>

                <div className="stack" aria-hidden="true">
                  <label className="field">
                    Message
                    <textarea disabled placeholder="Share context about this note..." />
                  </label>
                  <button type="button" className="primary-btn" disabled>
                    Send
                  </button>
                </div>
              </section>
            </div>
          }
        >
          {() => children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

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
        <ClientSideSuspense fallback={<div className="panel">Connecting to room...</div>}>
          {() => children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

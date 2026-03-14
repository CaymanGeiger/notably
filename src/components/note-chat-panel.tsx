"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { useRoom } from "@liveblocks/react/suspense";

type NoteMessage = {
  id: string;
  body: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type NoteChatPanelProps = {
  noteId: string;
  canMessage: boolean;
  initialMessages: NoteMessage[];
};

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NoteChatPanel({
  noteId,
  canMessage,
  initialMessages,
}: NoteChatPanelProps) {
  const room = useRoom();

  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    const response = await fetch(`/api/notes/${noteId}/messages`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as {
      messages: NoteMessage[];
    };

    setMessages(payload.messages);
  }, [noteId]);

  useEffect(() => {
    const unsubscribe = room.subscribe("event", ({ event }) => {
      const payload = event as { type?: string };
      if (payload.type === "chat:refresh") {
        void loadMessages();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadMessages, room]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canMessage) {
      return;
    }

    setError(null);

    const trimmed = body.trim();
    if (!trimmed) {
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(`/api/notes/${noteId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: trimmed,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(payload?.error ?? "Unable to send message");
        return;
      }

      const payload = (await response.json()) as {
        message: NoteMessage;
      };

      setMessages((current) => [...current, payload.message]);
      setBody("");
      room.broadcastEvent({ type: "chat:refresh" });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="panel stack">
      <div className="panel-header">
        <h2>Discussion</h2>
        <span className="status-chip">{messages.length} messages</span>
      </div>

      <div className="chat-scroll">
        {messages.length === 0 ? (
          <p className="muted-text">No discussion yet.</p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className="chat-message">
              <div className="chat-meta">
                <strong>{message.user.name ?? message.user.email}</strong>
                <span>{formatTimestamp(message.createdAt)}</span>
              </div>
              <p>{message.body}</p>
            </article>
          ))
        )}
      </div>

      <form className="stack" onSubmit={sendMessage}>
        <label className="field">
          Message
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={!canMessage || isSending}
            placeholder={
              canMessage ? "Share context about this note..." : "Messaging disabled"
            }
            maxLength={4000}
          />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit" className="primary-btn" disabled={!canMessage || isSending}>
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}

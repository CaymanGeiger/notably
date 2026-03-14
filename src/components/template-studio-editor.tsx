"use client";

import type { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { blocksToYDoc, yDocToBlocks } from "@blocknote/core/yjs";
import { useCallback, useEffect, useRef } from "react";
import * as Y from "yjs";

import {
  decodeBase64ToYDocState,
  encodeYDocStateToBase64,
  noteContentFragmentName,
} from "@/lib/ydoc-state";

type TemplateStudioEditorProps = {
  activeTemplateId: string;
  encodedState: string | null;
  theme: "light" | "dark";
  onEncodedStateChange: (nextEncodedState: string) => void;
};

const templateEditorPlaceholders = {
  emptyDocument: "Start with a section, heading, or list",
  heading: "Section title",
  quote: "Callout section",
  bulletListItem: "List item",
  numberedListItem: "Step",
  checkListItem: "Checklist item",
  toggleListItem: "Collapsible section",
} as const;

function emptyTemplateBlocks(): PartialBlock[] {
  return [{ type: "paragraph" }];
}

function getEditorStateKey(activeTemplateId: string, encodedState: string | null): string {
  return `${activeTemplateId}::${encodedState ?? ""}`;
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

function getBlocksFromEncodedState(
  editor: BlockNoteEditor,
  encodedState: string | null,
): PartialBlock[] {
  if (!encodedState) {
    return emptyTemplateBlocks();
  }

  const yDoc = new Y.Doc();

  try {
    Y.applyUpdate(yDoc, decodeBase64ToYDocState(encodedState));
    const blocks = yDocToBlocks(editor, yDoc, noteContentFragmentName);
    return blocks.length > 0 ? blocks : emptyTemplateBlocks();
  } catch {
    return emptyTemplateBlocks();
  } finally {
    yDoc.destroy();
  }
}

function serializeEditorDocument(editor: BlockNoteEditor): string {
  const yDoc = blocksToYDoc(editor, editor.document, noteContentFragmentName);

  try {
    return encodeYDocStateToBase64(yDoc);
  } finally {
    yDoc.destroy();
  }
}

export function TemplateStudioEditor({
  activeTemplateId,
  encodedState,
  theme,
  onEncodedStateChange,
}: TemplateStudioEditorProps) {
  const editor = useCreateBlockNote(
    {
      defaultStyles: true,
      trailingBlock: true,
      placeholders: templateEditorPlaceholders,
      tables: {
        splitCells: true,
        headers: true,
        cellBackgroundColor: true,
        cellTextColor: true,
      },
      uploadFile: fileToDataUrl,
    },
    [],
  );

  const isHydratingEditorRef = useRef(false);
  const lastAppliedStateKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const nextStateKey = getEditorStateKey(activeTemplateId, encodedState);

    if (nextStateKey === lastAppliedStateKeyRef.current) {
      return;
    }

    isHydratingEditorRef.current = true;
    editor.replaceBlocks(editor.document, getBlocksFromEncodedState(editor, encodedState));
    lastAppliedStateKeyRef.current = nextStateKey;

    queueMicrotask(() => {
      isHydratingEditorRef.current = false;
    });
  }, [activeTemplateId, editor, encodedState]);

  const handleEditorChange = useCallback(() => {
    if (isHydratingEditorRef.current) {
      return;
    }

    const nextEncodedState = serializeEditorDocument(editor);
    lastAppliedStateKeyRef.current = getEditorStateKey(activeTemplateId, nextEncodedState);
    onEncodedStateChange(nextEncodedState);
  }, [activeTemplateId, editor, onEncodedStateChange]);

  return (
    <div className="note-blocknote-shell template-blocknote-shell">
      <BlockNoteView
        editor={editor}
        editable
        theme={theme}
        autoFocus={false}
        formattingToolbar
        linkToolbar
        slashMenu
        sideMenu
        filePanel
        tableHandles
        emojiPicker
        onChange={handleEditorChange}
      />
    </div>
  );
}

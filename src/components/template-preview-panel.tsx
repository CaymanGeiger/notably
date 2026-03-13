"use client";

import type { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { yDocToBlocks } from "@blocknote/core/yjs";
import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";

import { decodeBase64ToYDocState, noteContentFragmentName } from "@/lib/ydoc-state";

type TemplatePreviewPanelProps = {
  contentYdocState: string | null;
};

function emptyTemplateBlocks(): PartialBlock[] {
  return [{ type: "paragraph" }];
}

function getThemeMode(): "light" | "dark" {
  if (typeof document === "undefined") {
    return "dark";
  }

  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
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

export function TemplatePreviewPanel({ contentYdocState }: TemplatePreviewPanelProps) {
  const editor = useCreateBlockNote(
    {
      defaultStyles: true,
      trailingBlock: false,
    },
    [],
  );

  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const lastAppliedStateRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (contentYdocState === lastAppliedStateRef.current) {
      return;
    }

    editor.replaceBlocks(editor.document, getBlocksFromEncodedState(editor, contentYdocState));
    lastAppliedStateRef.current = contentYdocState;
  }, [contentYdocState, editor]);

  return (
    <div className="workspace-template-preview-shell">
      <BlockNoteView
        editor={editor}
        editable={false}
        theme={theme}
        formattingToolbar={false}
        linkToolbar={false}
        slashMenu={false}
        sideMenu={false}
        filePanel={false}
        tableHandles={false}
        emojiPicker={false}
      />
    </div>
  );
}

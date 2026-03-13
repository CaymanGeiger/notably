"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  LoaderCircle,
  Plus,
  Sparkles,
} from "lucide-react";

import { SignOutButton } from "@/components/signout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ThemeMode } from "@/lib/theme";

type TemplateWorkspace = {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
  noteCount: number;
  templateCount: number;
};

type TemplateAuthor = {
  id: string;
  name: string | null;
  email: string;
};

type TemplateItem = {
  id: string;
  name: string;
  description: string | null;
  contentYdocState: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: TemplateAuthor;
};

type TemplateStudioClientProps = {
  initialTheme: ThemeMode;
  userDisplayName: string;
  selectedWorkspaceId: string;
  workspaces: TemplateWorkspace[];
  templates: TemplateItem[];
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

const autosaveDelayMs = 650;
const TemplateStudioEditor = dynamic(
  () => import("@/components/template-studio-editor").then((mod) => mod.TemplateStudioEditor),
  {
    ssr: false,
    loading: () => (
      <div className="note-blocknote-shell template-blocknote-shell template-blocknote-shell-loading">
        <div className="template-editor-loading" aria-hidden="true">
          <span className="template-editor-loading-line template-editor-loading-line-title" />
          <span className="template-editor-loading-line" />
          <span className="template-editor-loading-line template-editor-loading-line-short" />
        </div>
      </div>
    ),
  },
);

function templateDelayStyle(delayMs: number): CSSProperties {
  return {
    "--template-delay": `${delayMs}ms`,
  } as CSSProperties;
}

function getThemeMode(): "light" | "dark" {
  if (typeof document === "undefined") {
    return "dark";
  }

  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function resolveAuthorLabel(author: TemplateAuthor): string {
  return author.name?.trim() || author.email.split("@")[0] || author.email;
}

function getSaveLabel(status: SaveStatus): string {
  if (status === "saving") {
    return "Saving template";
  }

  if (status === "error") {
    return "Save failed";
  }

  if (status === "saved") {
    return "All changes saved";
  }

  return "Ready to edit";
}

export function TemplateStudioClient({
  initialTheme,
  userDisplayName,
  selectedWorkspaceId,
  workspaces,
  templates,
}: TemplateStudioClientProps) {
  const router = useRouter();

  const [theme, setTheme] = useState<"light" | "dark">(initialTheme);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [workspaceItems, setWorkspaceItems] = useState(workspaces);
  const [templateItems, setTemplateItems] = useState(templates);
  const [activeTemplateId, setActiveTemplateId] = useState(templates[0]?.id ?? "");
  const [draftName, setDraftName] = useState(templates[0]?.name ?? "Untitled template");
  const [draftDescription, setDraftDescription] = useState(templates[0]?.description ?? "");
  const [draftContentYdocState, setDraftContentYdocState] = useState<string | null>(
    templates[0]?.contentYdocState ?? null,
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(templates[0] ? "saved" : "idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [useError, setUseError] = useState<string | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isUsingTemplate, setIsUsingTemplate] = useState(false);

  const isHydratingTemplateRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const saveInFlightRef = useRef(false);
  const queuedSaveRef = useRef(false);
  const lastSavedSnapshotRef = useRef<string | null>(null);

  const selectedWorkspace = useMemo(() => {
    return workspaceItems.find((workspace) => workspace.id === selectedWorkspaceId) ?? null;
  }, [selectedWorkspaceId, workspaceItems]);

  const activeTemplate = useMemo(() => {
    return templateItems.find((template) => template.id === activeTemplateId) ?? null;
  }, [activeTemplateId, templateItems]);

  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const buildPayload = useCallback(() => {
    if (!activeTemplateId) {
      return null;
    }

    const name = draftName.trim() || "Untitled template";
    const description = draftDescription.trim();

    return {
      name,
      description: description || null,
      contentYdocState: draftContentYdocState,
    };
  }, [activeTemplateId, draftContentYdocState, draftDescription, draftName]);

  const flushAutosave = useCallback(async (): Promise<boolean> => {
    clearSaveTimer();

    if (!activeTemplateId || isHydratingTemplateRef.current) {
      return true;
    }

    const payload = buildPayload();

    if (!payload) {
      return true;
    }

    const snapshot = JSON.stringify(payload);

    if (snapshot === lastSavedSnapshotRef.current) {
      setSaveStatus("saved");
      setSaveError(null);
      return true;
    }

    if (saveInFlightRef.current) {
      queuedSaveRef.current = true;
      return true;
    }

    saveInFlightRef.current = true;
    setSaveStatus("saving");
    setSaveError(null);

    try {
      const response = await fetch(`/api/templates/${activeTemplateId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(result?.error ?? "Could not save template");
      }

      const result = (await response.json()) as {
        template: TemplateItem;
      };

      setTemplateItems((current) =>
        current.map((template) =>
          template.id === result.template.id ? result.template : template,
        ),
      );
      lastSavedSnapshotRef.current = snapshot;
      setSaveStatus("saved");
      setSaveError(null);
      return true;
    } catch (error) {
      setSaveStatus("error");
      setSaveError(error instanceof Error ? error.message : "Could not save template");
      return false;
    } finally {
      saveInFlightRef.current = false;

      if (queuedSaveRef.current) {
        queuedSaveRef.current = false;
        window.setTimeout(() => {
          void flushAutosave();
        }, 0);
      }
    }
  }, [activeTemplateId, buildPayload, clearSaveTimer]);

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
    setWorkspaceItems(workspaces);
  }, [workspaces]);

  useEffect(() => {
    setTemplateItems(templates);
    setActiveTemplateId(templates[0]?.id ?? "");
    setCreateError(null);
    setUseError(null);
    setSaveError(null);
  }, [selectedWorkspaceId, templates]);

  useEffect(() => {
    isHydratingTemplateRef.current = true;

    if (activeTemplate) {
      setDraftName(activeTemplate.name);
      setDraftDescription(activeTemplate.description ?? "");
      setDraftContentYdocState(activeTemplate.contentYdocState ?? null);
    } else {
      setDraftName("Untitled template");
      setDraftDescription("");
      setDraftContentYdocState(null);
    }

    const nextPayload = activeTemplate
      ? {
          name: activeTemplate.name,
          description: activeTemplate.description ?? null,
          contentYdocState: activeTemplate.contentYdocState ?? null,
        }
      : null;

    lastSavedSnapshotRef.current = nextPayload ? JSON.stringify(nextPayload) : null;
    setSaveStatus(activeTemplate ? "saved" : "idle");
    setSaveError(null);
    setUseError(null);

    queueMicrotask(() => {
      isHydratingTemplateRef.current = false;
    });
  }, [activeTemplate]);

  useEffect(() => {
    if (!activeTemplateId || isHydratingTemplateRef.current) {
      return;
    }

    const payload = buildPayload();

    if (!payload) {
      return;
    }

    if (JSON.stringify(payload) === lastSavedSnapshotRef.current) {
      return;
    }

    setSaveStatus((current) => (current === "error" ? current : "saving"));
    clearSaveTimer();
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void flushAutosave();
    }, autosaveDelayMs);

    return () => {
      clearSaveTimer();
    };
  }, [
    activeTemplateId,
    buildPayload,
    clearSaveTimer,
    draftContentYdocState,
    draftDescription,
    draftName,
    flushAutosave,
  ]);

  useEffect(() => {
    return () => {
      clearSaveTimer();
    };
  }, [clearSaveTimer]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void flushAutosave();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flushAutosave]);

  const handleEditorChange = useCallback((nextEncodedState: string) => {
    setDraftContentYdocState(nextEncodedState);
  }, []);

  async function handleWorkspaceChange(nextWorkspaceId: string) {
    if (!nextWorkspaceId || nextWorkspaceId === selectedWorkspaceId) {
      return;
    }

    const saved = await flushAutosave();

    if (!saved && activeTemplateId) {
      return;
    }

    router.push(`/templates?workspaceId=${nextWorkspaceId}`);
  }

  async function handleSelectTemplate(nextTemplateId: string) {
    if (nextTemplateId === activeTemplateId) {
      return;
    }

    const saved = await flushAutosave();

    if (!saved && activeTemplateId) {
      return;
    }

    setActiveTemplateId(nextTemplateId);
  }

  async function handleCreateTemplate() {
    if (!selectedWorkspaceId) {
      setCreateError("Create a workspace before making templates");
      return;
    }

    const saved = await flushAutosave();

    if (!saved && activeTemplateId) {
      return;
    }

    setCreateError(null);
    setIsCreatingTemplate(true);

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: selectedWorkspaceId,
        }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setCreateError(result?.error ?? "Could not create template");
        return;
      }

      const result = (await response.json()) as {
        template: TemplateItem;
      };

      setTemplateItems((current) => [result.template, ...current]);
      setWorkspaceItems((current) =>
        current.map((workspace) =>
          workspace.id === selectedWorkspaceId
            ? {
                ...workspace,
                templateCount: workspace.templateCount + 1,
              }
            : workspace,
        ),
      );
      setActiveTemplateId(result.template.id);
    } finally {
      setIsCreatingTemplate(false);
    }
  }

  async function handleUseTemplate() {
    if (!selectedWorkspace || !activeTemplateId) {
      return;
    }

    const saved = await flushAutosave();

    if (!saved) {
      return;
    }

    setUseError(null);
    setIsUsingTemplate(true);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: selectedWorkspace.id,
          templateId: activeTemplateId,
          title: draftName.trim() || "Untitled note",
        }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setUseError(result?.error ?? "Could not create doc from template");
        return;
      }

      const result = (await response.json()) as {
        note: {
          id: string;
        };
      };

      router.push(`/notes/${result.note.id}`);
      router.refresh();
    } finally {
      setIsUsingTemplate(false);
    }
  }

  return (
    <main className={`template-shell ${isSidebarCollapsed ? "is-sidebar-collapsed" : ""}`}>
      <button
        type="button"
        className="template-shell-toggle"
        onClick={() => setIsSidebarCollapsed((current) => !current)}
        aria-label={isSidebarCollapsed ? "Open templates sidebar" : "Close templates sidebar"}
        aria-pressed={isSidebarCollapsed}
      >
        {isSidebarCollapsed ? (
          <ChevronRight size={18} aria-hidden="true" />
        ) : (
          <ChevronLeft size={18} aria-hidden="true" />
        )}
      </button>

      <div className="template-sidebar-slot">
        <aside className="template-sidebar">
          <div className="template-sidebar-head">
            <Link href="/workspaces" className="template-back-link">
              <ArrowLeft size={15} aria-hidden="true" />
              <span>Workspaces</span>
            </Link>

            <div className="template-sidebar-copy">
              <p className="workspace-label">Templates</p>
              <h1>Template studio</h1>
              <p>
                Build reusable starting points for docs so new work begins with structure,
                not cleanup.
              </p>
            </div>
          </div>

          <label className="template-workspace-field">
            Workspace
            <select
              value={selectedWorkspaceId}
              onChange={(event) => {
                void handleWorkspaceChange(event.target.value);
              }}
              disabled={workspaces.length === 0}
            >
              {workspaces.length === 0 ? <option value="">No workspaces yet</option> : null}
              {workspaceItems.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="workspace-action-btn primary template-create-btn"
            onClick={handleCreateTemplate}
            disabled={!selectedWorkspaceId || isCreatingTemplate}
          >
            {isCreatingTemplate ? (
              <>
                <LoaderCircle className="template-spinner" size={16} aria-hidden="true" />
                <span>Creating</span>
              </>
            ) : (
              <>
                <Plus size={16} aria-hidden="true" />
                <span>New template</span>
              </>
            )}
          </button>

          {createError ? <p className="workspace-error">{createError}</p> : null}

          <div className="template-list" aria-label="Workspace templates">
            {templateItems.length === 0 ? (
              <div className="template-list-empty">
                <LayoutTemplate size={18} aria-hidden="true" />
                <div>
                  <strong>No templates yet</strong>
                  <p>Create one, then use it whenever you spin up a new doc.</p>
                </div>
              </div>
            ) : (
              templateItems.map((template, index) => {
                const isActive = template.id === activeTemplateId;

                return (
                  <button
                    key={template.id}
                    type="button"
                    className={`template-list-card ${isActive ? "active" : ""}`}
                    style={templateDelayStyle(130 + Math.min(index, 7) * 48)}
                    onClick={() => {
                      void handleSelectTemplate(template.id);
                    }}
                  >
                    <span className="template-list-card-mark">
                      {template.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="template-list-card-copy">
                      <strong>{template.name}</strong>
                      <p>{template.description || "Reusable template"}</p>
                      <span>
                        Updated {formatTimestamp(template.updatedAt)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="template-sidebar-footer">
            <strong>{userDisplayName}</strong>
            <p>
              {selectedWorkspace
                ? `${selectedWorkspace.templateCount} templates · ${selectedWorkspace.noteCount} docs`
                : "Select a workspace to start"}
            </p>
          </div>
        </aside>
      </div>

      <section className="template-main">
        <header className="template-topbar">
          <div className="template-topbar-copy">
            <p className="template-kicker">
              {selectedWorkspace ? selectedWorkspace.name : "Template studio"}
            </p>
            <h2>{activeTemplate ? draftName.trim() || "Untitled template" : "Create your first template"}</h2>
            <p>
              {activeTemplate
                ? "Everything below is copied into a new doc when someone uses this template."
                : "Create a template for meeting notes, project plans, or any repeatable doc format."}
            </p>
          </div>

          <div className="template-top-actions">
            <button
              type="button"
              className="workspace-action-btn ghost"
              onClick={() => {
                void flushAutosave();
              }}
              disabled={!activeTemplate || saveStatus === "saving"}
            >
              Save now
            </button>
            <button
              type="button"
              className="workspace-action-btn primary"
              onClick={handleUseTemplate}
              disabled={!activeTemplate || isUsingTemplate}
            >
              {isUsingTemplate ? (
                <>
                  <LoaderCircle className="template-spinner" size={16} aria-hidden="true" />
                  <span>Creating doc</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} aria-hidden="true" />
                  <span>Use template</span>
                </>
              )}
            </button>
            <ThemeToggle initialTheme={initialTheme} />
            <SignOutButton className="workspace-signout" />
          </div>
        </header>

        {activeTemplate ? (
          <div className="template-editor-surface">
            <div className="template-meta-row">
              <div className={`template-save-chip is-${saveStatus}`}>
                <span className="template-save-dot" aria-hidden="true" />
                <span>{getSaveLabel(saveStatus)}</span>
              </div>

              <div className="template-meta-copy">
                <span>Created by {resolveAuthorLabel(activeTemplate.createdBy)}</span>
                <span>Updated {formatTimestamp(activeTemplate.updatedAt)}</span>
              </div>
            </div>

            {saveError ? <p className="workspace-error">{saveError}</p> : null}
            {useError ? <p className="workspace-error">{useError}</p> : null}

            <details className="template-details-accordion" open>
              <summary className="template-details-summary">
                <div className="template-details-summary-copy">
                  <p className="workspace-label">Template details</p>
                  <span>Name, label, and context for this template.</span>
                </div>
                <ChevronDown
                  className="template-details-chevron"
                  size={17}
                  aria-hidden="true"
                />
              </summary>

              <div className="template-details-panel">
                <div className="template-form-grid">
                  <label className="template-field">
                    Template name
                    <input
                      type="text"
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      maxLength={120}
                      placeholder="Weekly team update"
                    />
                  </label>

                  <label className="template-field">
                    Short description
                    <textarea
                      value={draftDescription}
                      onChange={(event) => setDraftDescription(event.target.value)}
                      maxLength={240}
                      placeholder="Outline sections and starter prompts for recurring updates."
                    />
                  </label>
                </div>
              </div>
            </details>

            <section className="template-editor-panel">
              <div className="template-editor-panel-head">
                <h3>Editor</h3>
              </div>

              <TemplateStudioEditor
                activeTemplateId={activeTemplateId}
                encodedState={draftContentYdocState}
                theme={theme}
                onEncodedStateChange={handleEditorChange}
              />
            </section>
          </div>
        ) : (
          <section className="template-empty-stage">
            <LayoutTemplate size={22} aria-hidden="true" />
            <h3>No template selected</h3>
            <p>Start with a blank template, then use it any time you create a new document.</p>
            <button
              type="button"
              className="workspace-action-btn primary"
              onClick={handleCreateTemplate}
              disabled={!selectedWorkspaceId || isCreatingTemplate}
            >
              {isCreatingTemplate ? "Creating..." : "Create template"}
            </button>
          </section>
        )}
      </section>
    </main>
  );
}

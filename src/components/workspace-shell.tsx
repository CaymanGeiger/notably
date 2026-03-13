"use client";

import dynamic from "next/dynamic";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";

import { SignOutButton } from "@/components/signout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ThemeMode } from "@/lib/theme";

const TemplatePreviewPanel = dynamic(
  () => import("@/components/template-preview-panel").then((mod) => mod.TemplatePreviewPanel),
  {
    ssr: false,
    loading: () => (
      <div className="workspace-template-preview-shell workspace-template-preview-shell-loading">
        <span className="workspace-template-preview-line workspace-template-preview-line-title" />
        <span className="workspace-template-preview-line" />
        <span className="workspace-template-preview-line workspace-template-preview-line-short" />
      </div>
    ),
  },
);

type WorkspaceItem = {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
  noteCount: number;
  memberCount: number;
};

type NoteItem = {
  id: string;
  title: string;
  workspaceId: string;
  workspaceName: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  archivedAt: string | null;
  updatedAt: string;
};

type TemplateAuthor = {
  id: string;
  name: string | null;
  email: string;
};

type TemplateItem = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  contentYdocState: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: TemplateAuthor;
};

type WorkspaceShellProps = {
  initialTheme: ThemeMode;
  userDisplayName: string;
  workspaces: WorkspaceItem[];
  notes: NoteItem[];
  templates: TemplateItem[];
};

const filters = [
  "All docs",
  "Owned by me",
  "Can edit",
  "View only",
  "Archived",
] as const;

const modalExitDurationMs = 220;

type WorkspaceModalKind =
  | "createDoc"
  | "createWorkspace"
  | "inviteMember"
  | "templatePreview"
  | "archiveNote";

function workspaceDelayStyle(delayMs: number): CSSProperties {
  return {
    "--workspace-delay": `${delayMs}ms`,
  } as CSSProperties;
}

function roleLabel(role: NoteItem["role"]): string {
  if (role === "OWNER") {
    return "Owner";
  }
  if (role === "EDITOR") {
    return "Editor";
  }
  return "Viewer";
}

function formatUpdatedTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function resolveTemplateAuthorLabel(author: TemplateAuthor): string {
  return author.name?.trim() || author.email.split("@")[0] || author.email;
}

export function WorkspaceShell({
  initialTheme,
  userDisplayName,
  workspaces,
  notes,
  templates,
}: WorkspaceShellProps) {
  const router = useRouter();
  const [workspaceItems, setWorkspaceItems] = useState(workspaces);
  const [noteItems, setNoteItems] = useState(notes);

  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All docs");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"updated-desc" | "title-asc" | "title-desc">(
    "updated-desc",
  );

  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [showArchiveNote, setShowArchiveNote] = useState(false);
  const [closingModal, setClosingModal] = useState<WorkspaceModalKind | null>(null);

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaces[0]?.id ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [previewTemplateId, setPreviewTemplateId] = useState("");
  const [archiveNoteId, setArchiveNoteId] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const [docError, setDocError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isInvitingMember, setIsInvitingMember] = useState(false);
  const [isArchivingNote, setIsArchivingNote] = useState(false);
  const modalCloseTimerRef = useRef<number | null>(null);
  const templateMenuRef = useRef<HTMLDivElement | null>(null);

  function clearScheduledModalClose() {
    if (modalCloseTimerRef.current !== null) {
      window.clearTimeout(modalCloseTimerRef.current);
      modalCloseTimerRef.current = null;
    }
  }

  function scheduleModalClose(kind: WorkspaceModalKind, onComplete: () => void) {
    clearScheduledModalClose();
    setClosingModal(kind);
    modalCloseTimerRef.current = window.setTimeout(() => {
      onComplete();
      setClosingModal((current) => (current === kind ? null : current));
      modalCloseTimerRef.current = null;
    }, modalExitDurationMs);
  }

  useEffect(() => {
    setWorkspaceItems(workspaces);
  }, [workspaces]);

  useEffect(() => {
    setNoteItems(notes);
  }, [notes]);

  useEffect(() => {
    if (!selectedWorkspaceId && workspaceItems[0]) {
      setSelectedWorkspaceId(workspaceItems[0].id);
    }
  }, [selectedWorkspaceId, workspaceItems]);

  useEffect(() => {
    return () => {
      clearScheduledModalClose();
    };
  }, []);

  const handleCreateDocEscape = useEffectEvent(() => {
    if (isCreatingDoc) {
      return;
    }

    if (showTemplatePreview) {
      return;
    }

    if (showTemplateMenu) {
      setShowTemplateMenu(false);
      return;
    }

    scheduleModalClose("createDoc", () => {
      setShowCreateDoc(false);
      setShowTemplateMenu(false);
      setSelectedTemplateId("");
      setDocError(null);
    });
  });

  const handleCreateWorkspaceEscape = useEffectEvent(() => {
    if (isCreatingWorkspace) {
      return;
    }

    scheduleModalClose("createWorkspace", () => {
      setShowCreateWorkspace(false);
      setWorkspaceError(null);
    });
  });

  const handleInviteMemberEscape = useEffectEvent(() => {
    if (isInvitingMember) {
      return;
    }

    scheduleModalClose("inviteMember", () => {
      setShowInviteMember(false);
      setInviteError(null);
    });
  });

  const handleTemplatePreviewEscape = useEffectEvent(() => {
    scheduleModalClose("templatePreview", () => {
      setShowTemplatePreview(false);
      setPreviewTemplateId("");
    });
  });

  const handleArchiveNoteEscape = useEffectEvent(() => {
    if (isArchivingNote) {
      return;
    }

    scheduleModalClose("archiveNote", () => {
      setShowArchiveNote(false);
      setArchiveNoteId("");
      setArchiveError(null);
    });
  });

  useEffect(() => {
    if (!showCreateDoc) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleCreateDocEscape();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showCreateDoc]);

  useEffect(() => {
    if (!showCreateWorkspace) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleCreateWorkspaceEscape();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showCreateWorkspace]);

  useEffect(() => {
    if (!showInviteMember) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleInviteMemberEscape();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showInviteMember]);

  useEffect(() => {
    if (!showTemplatePreview) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleTemplatePreviewEscape();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showTemplatePreview]);

  useEffect(() => {
    if (!showArchiveNote) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleArchiveNoteEscape();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showArchiveNote]);

  const selectedWorkspace = useMemo(() => {
    return workspaceItems.find((workspace) => workspace.id === selectedWorkspaceId) ?? null;
  }, [selectedWorkspaceId, workspaceItems]);

  const availableTemplates = useMemo(() => {
    if (!selectedWorkspaceId) {
      return [];
    }

    return templates.filter((template) => template.workspaceId === selectedWorkspaceId);
  }, [selectedWorkspaceId, templates]);

  const selectedTemplate = useMemo(() => {
    return availableTemplates.find((template) => template.id === selectedTemplateId) ?? null;
  }, [availableTemplates, selectedTemplateId]);

  const previewTemplate = useMemo(() => {
    return availableTemplates.find((template) => template.id === previewTemplateId) ?? null;
  }, [availableTemplates, previewTemplateId]);

  useEffect(() => {
    setInviteNotice(null);
  }, [selectedWorkspaceId]);

  const archiveCandidateNote = useMemo(() => {
    return noteItems.find((note) => note.id === archiveNoteId) ?? null;
  }, [archiveNoteId, noteItems]);

  useEffect(() => {
    if (selectedTemplateId && !availableTemplates.some((template) => template.id === selectedTemplateId)) {
      setSelectedTemplateId("");
    }

    if (previewTemplateId && !availableTemplates.some((template) => template.id === previewTemplateId)) {
      setShowTemplatePreview(false);
      setPreviewTemplateId("");
    }

    setShowTemplateMenu(false);
  }, [availableTemplates, previewTemplateId, selectedTemplateId]);

  useEffect(() => {
    if (!showCreateDoc || !showTemplateMenu) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (!templateMenuRef.current?.contains(event.target)) {
        setShowTemplateMenu(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showCreateDoc, showTemplateMenu]);

  const workspaceNotes = useMemo(() => {
    if (!selectedWorkspaceId) {
      return [];
    }

    return noteItems.filter((note) => note.workspaceId === selectedWorkspaceId);
  }, [noteItems, selectedWorkspaceId]);

  const activeWorkspaceNotes = useMemo(() => {
    return workspaceNotes.filter((note) => !note.archivedAt);
  }, [workspaceNotes]);

  const archivedWorkspaceNotes = useMemo(() => {
    return workspaceNotes.filter((note) => Boolean(note.archivedAt));
  }, [workspaceNotes]);

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    let candidateNotes = activeFilter === "Archived" ? archivedWorkspaceNotes : activeWorkspaceNotes;
    if (activeFilter === "Owned by me") {
      candidateNotes = candidateNotes.filter((note) => note.role === "OWNER");
    } else if (activeFilter === "Can edit") {
      candidateNotes = candidateNotes.filter((note) => note.role === "OWNER" || note.role === "EDITOR");
    } else if (activeFilter === "View only") {
      candidateNotes = candidateNotes.filter((note) => note.role === "VIEWER");
    }

    if (query) {
      candidateNotes = candidateNotes.filter((note) => {
        return note.title.toLowerCase().includes(query);
      });
    }

    if (sortBy === "title-asc") {
      return [...candidateNotes].sort((left, right) => left.title.localeCompare(right.title));
    }

    if (sortBy === "title-desc") {
      return [...candidateNotes].sort((left, right) => right.title.localeCompare(left.title));
    }

    return [...candidateNotes].sort((left, right) => {
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
  }, [activeFilter, activeWorkspaceNotes, archivedWorkspaceNotes, search, sortBy]);

  const totalNotesForActiveFilter =
    activeFilter === "Archived" ? archivedWorkspaceNotes.length : activeWorkspaceNotes.length;

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
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
        setWorkspaceError(payload?.error ?? "Could not create workspace");
        return;
      }

      setWorkspaceName("");
      clearScheduledModalClose();
      setClosingModal(null);
      setShowCreateWorkspace(false);
      router.refresh();
    } finally {
      setIsCreatingWorkspace(false);
    }
  }

  async function createDoc(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedWorkspaceId) {
      setDocError("Select a workspace first");
      return;
    }

    const normalizedTitle = docTitle.trim();
    const resolvedTitle = normalizedTitle || selectedTemplate?.name || undefined;

    if (!resolvedTitle) {
      setDocError("Enter a doc name");
      return;
    }

    setDocError(null);
    setIsCreatingDoc(true);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: selectedWorkspaceId,
          title: resolvedTitle,
          templateId: selectedTemplateId || undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setDocError(payload?.error ?? "Could not create doc");
        return;
      }

      const payload = (await response.json()) as {
        note: {
          id: string;
        };
      };

      setDocTitle("");
      setSelectedTemplateId("");
      setPreviewTemplateId("");
      setShowTemplatePreview(false);
      setShowTemplateMenu(false);
      clearScheduledModalClose();
      setClosingModal(null);
      setShowCreateDoc(false);
      router.push(`/notes/${payload.note.id}`);
      router.refresh();
    } finally {
      setIsCreatingDoc(false);
    }
  }

  async function inviteTeamMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedWorkspace) {
      setInviteError("Select a workspace first");
      return;
    }

    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setInviteError("Enter an email address");
      return;
    }

    setInviteError(null);
    setInviteNotice(null);
    setIsInvitingMember(true);

    try {
      const response = await fetch(`/api/workspaces/${selectedWorkspace.id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setInviteError(payload?.error ?? "Could not send invite");
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      setInviteEmail("");
      clearScheduledModalClose();
      setClosingModal(null);
      setShowInviteMember(false);
      setInviteNotice(payload?.message ?? "Invite sent.");
      router.refresh();
    } finally {
      setIsInvitingMember(false);
    }
  }

  async function archiveNote() {
    if (!archiveCandidateNote) {
      setArchiveError("Note not found");
      return;
    }

    setArchiveError(null);
    setIsArchivingNote(true);

    try {
      const response = await fetch(`/api/notes/${archiveCandidateNote.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          archived: true,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setArchiveError(payload?.error ?? "Could not archive note");
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { note?: { archivedAt?: string | null; updatedAt?: string } }
        | null;

      setNoteItems((current) =>
        current.map((note) =>
          note.id === archiveCandidateNote.id
            ? {
                ...note,
                archivedAt: payload?.note?.archivedAt ?? new Date().toISOString(),
                updatedAt: payload?.note?.updatedAt ?? note.updatedAt,
              }
            : note,
        ),
      );
      setWorkspaceItems((current) =>
        current.map((workspace) =>
          workspace.id === archiveCandidateNote.workspaceId
            ? {
                ...workspace,
                noteCount: Math.max(0, workspace.noteCount - (archiveCandidateNote.archivedAt ? 0 : 1)),
              }
            : workspace,
        ),
      );

      clearScheduledModalClose();
      setClosingModal(null);
      setShowArchiveNote(false);
      setArchiveNoteId("");
      router.refresh();
    } finally {
      setIsArchivingNote(false);
    }
  }

  function openCreateDocModal() {
    clearScheduledModalClose();
    setClosingModal(null);
    setDocTitle("");
    setDocError(null);
    setSelectedTemplateId("");
    setPreviewTemplateId("");
    setShowTemplatePreview(false);
    setShowTemplateMenu(false);
    setShowCreateDoc(true);
  }

  function closeCreateDocModal() {
    if (isCreatingDoc) {
      return;
    }

    scheduleModalClose("createDoc", () => {
      setShowCreateDoc(false);
      setShowTemplateMenu(false);
      setSelectedTemplateId("");
      setDocError(null);
    });
  }

  function openInviteMemberModal() {
    if (!selectedWorkspace) {
      return;
    }

    clearScheduledModalClose();
    setClosingModal(null);
    setInviteError(null);
    setInviteNotice(null);
    setShowInviteMember(true);
  }

  function openCreateWorkspaceModal() {
    clearScheduledModalClose();
    setClosingModal(null);
    setWorkspaceError(null);
    setShowCreateWorkspace(true);
  }

  function closeCreateWorkspaceModal() {
    if (isCreatingWorkspace) {
      return;
    }

    scheduleModalClose("createWorkspace", () => {
      setShowCreateWorkspace(false);
      setWorkspaceError(null);
    });
  }

  function closeInviteMemberModal() {
    if (isInvitingMember) {
      return;
    }

    scheduleModalClose("inviteMember", () => {
      setShowInviteMember(false);
      setInviteError(null);
    });
  }

  function goToTemplatesPage() {
    if (!selectedWorkspaceId) {
      return;
    }

    router.push(`/templates?workspaceId=${selectedWorkspaceId}`);
  }

  function toggleTemplateMenu() {
    setShowTemplateMenu((current) => !current);
  }

  function selectTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    setDocError(null);
    setShowTemplateMenu(false);
  }

  function openTemplatePreview(templateId: string) {
    if (!templateId) {
      return;
    }

    clearScheduledModalClose();
    setClosingModal(null);
    setShowTemplateMenu(false);
    setPreviewTemplateId(templateId);
    setShowTemplatePreview(true);
  }

  function closeTemplatePreview() {
    scheduleModalClose("templatePreview", () => {
      setShowTemplatePreview(false);
      setPreviewTemplateId("");
    });
  }

  function openArchiveNoteModal(noteId: string) {
    clearScheduledModalClose();
    setClosingModal(null);
    setArchiveError(null);
    setArchiveNoteId(noteId);
    setShowArchiveNote(true);
  }

  function closeArchiveNoteModal() {
    if (isArchivingNote) {
      return;
    }

    scheduleModalClose("archiveNote", () => {
      setShowArchiveNote(false);
      setArchiveNoteId("");
      setArchiveError(null);
    });
  }

  function usePreviewedTemplate() {
    if (!previewTemplateId) {
      return;
    }

    setSelectedTemplateId(previewTemplateId);
    setDocError(null);
    closeTemplatePreview();
  }

  return (
    <main className="workspace-shell">
      <aside className="workspace-sidebar">
        <div className="workspace-brand">
          <Link href="/" className="workspace-home-link">
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Home</span>
          </Link>
        </div>

        <div className="workspace-mobile-actions">
          <div className="workspace-mobile-account">{userDisplayName}</div>
          <button
            type="button"
            className="workspace-action-btn ghost"
            onClick={goToTemplatesPage}
            disabled={!selectedWorkspaceId}
          >
            View templates
          </button>
          <ThemeToggle initialTheme={initialTheme} />
          <SignOutButton className="workspace-signout" />
        </div>

        <section className="workspace-section stack compact">
          <div className="workspace-section-header">
            <p className="workspace-label">Workspaces</p>
            <span>{workspaceItems.length}</span>
          </div>

          <div className="workspace-list">
            {workspaceItems.length === 0 ? (
              <p className="workspace-empty-copy">No workspaces yet.</p>
            ) : (
              workspaceItems.map((workspace, index) => {
                const isSelected = workspace.id === selectedWorkspaceId;

                return (
                  <div
                    key={workspace.id}
                    className={`workspace-list-entry ${isSelected ? "active" : ""}`}
                    style={workspaceDelayStyle(170 + Math.min(index, 5) * 55)}
                  >
                    <button
                      type="button"
                      className={`workspace-item ${isSelected ? "active" : ""}`}
                      onClick={() => setSelectedWorkspaceId(workspace.id)}
                    >
                      <span className="workspace-item-badge">{workspace.name.charAt(0).toUpperCase()}</span>
                      <div className="workspace-item-details">
                        <strong>{workspace.name}</strong>
                        <p>
                          {workspace.noteCount} docs · {workspace.memberCount} members
                        </p>
                      </div>
                    </button>

                    {isSelected ? (
                      <div className="workspace-item-subactions">
                        <button
                          type="button"
                          className="workspace-team-action-btn"
                          onClick={openInviteMemberModal}
                          disabled={workspace.role !== "OWNER"}
                          title={
                            workspace.role === "OWNER"
                              ? "Invite a new team member"
                              : "Only workspace owners can invite members"
                          }
                        >
                          Add team member
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            className="workspace-link-btn"
            onClick={openCreateWorkspaceModal}
          >
            + Create workspace
          </button>

          {inviteNotice ? <p className="workspace-success">{inviteNotice}</p> : null}
        </section>

        <div className="workspace-footer-user">{userDisplayName}</div>
      </aside>

      <section className="workspace-main">
        <header className="workspace-topbar">
          <div className="workspace-search-wrap">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={selectedWorkspace ? `Search ${selectedWorkspace.name}` : "Search docs"}
              aria-label="Search docs"
            />
          </div>
          <div className="workspace-top-actions">
            <button
              type="button"
              className="workspace-action-btn ghost"
              onClick={goToTemplatesPage}
              disabled={!selectedWorkspaceId}
            >
              View templates
            </button>
            <ThemeToggle initialTheme={initialTheme} />
            <SignOutButton className="workspace-signout" />
          </div>
        </header>

        <div className="workspace-content">
          <div className="workspace-heading-row">
            <div>
              <p className="workspace-kicker">
                {selectedWorkspace ? selectedWorkspace.name : `${userDisplayName}'s Workspaces`}
              </p>
              <h1>All docs</h1>
            </div>
            <div className="workspace-heading-actions">
              <button
                type="button"
                className="workspace-action-btn primary workspace-create-doc-btn"
                onClick={openCreateDocModal}
                disabled={!selectedWorkspace}
              >
                <span className="workspace-create-doc-plus" aria-hidden="true">+</span>
                <span>Create doc</span>
              </button>
            </div>
          </div>

          <div className="workspace-filter-row">
            {filters.map((filter, index) => (
              <button
                type="button"
                key={filter}
                className={`workspace-filter-pill ${activeFilter === filter ? "active" : ""}`}
                onClick={() => setActiveFilter(filter)}
                style={workspaceDelayStyle(280 + index * 45)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="workspace-list-header">
            <span>
              {filteredNotes.length} of {totalNotesForActiveFilter}{" "}
              {activeFilter === "Archived" ? "archived docs" : "docs"}
            </span>
            <label className="workspace-sort-wrap">
              Sort
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as "updated-desc" | "title-asc" | "title-desc")
                }
              >
                <option value="updated-desc">Last updated</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
              </select>
            </label>
          </div>

          <div className="workspace-doc-list">
            {filteredNotes.length === 0 ? (
              <article className="workspace-empty-state" style={workspaceDelayStyle(360)}>
                <p>
                  {activeFilter === "Archived"
                    ? search.trim()
                      ? "No archived docs match this search."
                      : "No archived docs yet."
                    : search.trim()
                      ? "No docs match this search."
                      : "No docs yet. Use “Create doc” to start."}
                </p>
              </article>
            ) : (
              filteredNotes.map((note, index) => {
                const canArchiveNote = !note.archivedAt && note.role !== "VIEWER";

                return (
                  <article
                    className={`workspace-doc-row ${note.archivedAt ? "is-archived" : ""}`}
                    key={note.id}
                    style={workspaceDelayStyle(360 + Math.min(index, 7) * 42)}
                  >
                    <Link className="workspace-doc-link" href={`/notes/${note.id}`}>
                      <span className="workspace-doc-icon">C</span>
                      <div>
                        <strong>{note.title}</strong>
                        <p>
                          {note.workspaceName} · {roleLabel(note.role)}
                        </p>
                      </div>
                      <time>{formatUpdatedTime(note.updatedAt)}</time>
                    </Link>

                    {canArchiveNote ? (
                      <button
                        type="button"
                        className="workspace-doc-archive-btn"
                        onClick={() => openArchiveNoteModal(note.id)}
                        aria-label={`Archive ${note.title}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    ) : note.archivedAt ? (
                      <span className="workspace-doc-status">Archived</span>
                    ) : (
                      <span className="workspace-doc-action-spacer" aria-hidden="true" />
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {showCreateDoc || closingModal === "createDoc" ? (
        <div
          className={`workspace-modal-backdrop ${closingModal === "createDoc" ? "is-closing" : ""}`}
          role="presentation"
          onClick={closeCreateDocModal}
        >
          <div
            className={`workspace-modal ${closingModal === "createDoc" ? "is-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-doc-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="workspace-modal-header">
              <h2 id="create-doc-title">Create doc</h2>
              <button
                type="button"
                className="workspace-modal-close"
                onClick={closeCreateDocModal}
                aria-label="Close create doc modal"
              >
                ×
              </button>
            </div>

            <p className="workspace-modal-copy">This will be created in</p>
            <p className="workspace-modal-workspace">
              {selectedWorkspace ? selectedWorkspace.name : "No workspace selected"}
            </p>

            <form className="workspace-modal-form" onSubmit={createDoc}>
              <div className="workspace-template-picker" ref={templateMenuRef}>
                <div className="workspace-template-picker-header">
                  <span>Start from template</span>
                  <span>{availableTemplates.length} available</span>
                </div>

                <button
                  type="button"
                  className={`workspace-template-trigger ${showTemplateMenu ? "open" : ""}`}
                  onClick={toggleTemplateMenu}
                  aria-expanded={showTemplateMenu}
                >
                  <div className="workspace-template-trigger-copy">
                    <strong>{selectedTemplate ? selectedTemplate.name : "Blank doc"}</strong>
                    <p>
                      {selectedTemplate?.description ||
                        (selectedTemplate
                          ? "Saved template"
                          : "Start from an empty document")}
                    </p>
                  </div>
                  <span className="workspace-template-trigger-indicator">
                    {showTemplateMenu ? "Hide" : "Choose"}
                  </span>
                </button>

                {showTemplateMenu ? (
                  <div className="workspace-template-dropdown">
                    <button
                      type="button"
                      className={`workspace-template-option ${selectedTemplateId ? "" : "active"}`}
                      onClick={() => selectTemplate("")}
                    >
                      <div className="workspace-template-option-copy">
                        <strong>Blank doc</strong>
                        <p>Start from an empty page.</p>
                      </div>
                      {!selectedTemplateId ? (
                        <span className="workspace-template-selected">Selected</span>
                      ) : null}
                    </button>

                    {availableTemplates.length === 0 ? (
                      <p className="workspace-template-empty">No templates in this workspace yet.</p>
                    ) : (
                      availableTemplates.map((template) => {
                        const isSelected = template.id === selectedTemplateId;

                        return (
                          <div
                            key={template.id}
                            className={`workspace-template-option-row ${isSelected ? "active" : ""}`}
                          >
                            <button
                              type="button"
                              className={`workspace-template-option-main ${isSelected ? "active" : ""}`}
                              onClick={() => selectTemplate(template.id)}
                            >
                              <div className="workspace-template-option-copy">
                                <strong>{template.name}</strong>
                                <p>{template.description || "Reusable template"}</p>
                              </div>
                              {isSelected ? (
                                <span className="workspace-template-selected">Selected</span>
                              ) : null}
                            </button>
                            <button
                              type="button"
                              className="workspace-template-view-btn"
                              onClick={() => openTemplatePreview(template.id)}
                            >
                              View
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </div>

              <label>
                Doc name
                <input
                  type="text"
                  value={docTitle}
                  onChange={(event) => setDocTitle(event.target.value)}
                  placeholder={selectedTemplate ? selectedTemplate.name : "Q1 Team Plan"}
                  maxLength={120}
                  autoFocus
                />
              </label>

              {selectedTemplate ? (
                <p className="workspace-modal-copy">
                  Leave the name blank to use “{selectedTemplate.name}”.
                </p>
              ) : null}

              {docError ? <p className="workspace-error">{docError}</p> : null}

              <div className="workspace-modal-actions">
                <button type="button" className="workspace-action-btn ghost" onClick={closeCreateDocModal}>
                  Cancel
                </button>
                <button type="submit" className="workspace-action-btn primary" disabled={isCreatingDoc || !selectedWorkspace}>
                  {isCreatingDoc ? "Creating..." : "Create doc"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showTemplatePreview || closingModal === "templatePreview" ? (
        <div
          className={`workspace-modal-backdrop workspace-template-preview-backdrop ${closingModal === "templatePreview" ? "is-closing" : ""}`}
          role="presentation"
          onClick={closeTemplatePreview}
        >
          <div
            className={`workspace-modal workspace-template-preview-modal ${closingModal === "templatePreview" ? "is-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-preview-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="workspace-modal-header">
              <h2 id="template-preview-title">
                {previewTemplate ? previewTemplate.name : "Template preview"}
              </h2>
              <button
                type="button"
                className="workspace-modal-close"
                onClick={closeTemplatePreview}
                aria-label="Close template preview modal"
              >
                ×
              </button>
            </div>

            <p className="workspace-modal-copy">Template preview</p>
            <p className="workspace-modal-workspace">
              {selectedWorkspace ? selectedWorkspace.name : "No workspace selected"}
            </p>

            {previewTemplate ? (
              <>
                <p className="workspace-template-preview-description">
                  {previewTemplate.description ||
                    "This structure will be copied into the new doc exactly as shown below."}
                </p>

                <div className="workspace-template-preview-meta">
                  <span>Created by {resolveTemplateAuthorLabel(previewTemplate.createdBy)}</span>
                  <span>Updated {formatUpdatedTime(previewTemplate.updatedAt)}</span>
                </div>

                <TemplatePreviewPanel contentYdocState={previewTemplate.contentYdocState} />

                <div className="workspace-modal-actions">
                  <button
                    type="button"
                    className="workspace-action-btn ghost"
                    onClick={closeTemplatePreview}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="workspace-action-btn primary"
                    onClick={usePreviewedTemplate}
                  >
                    Use this template
                  </button>
                </div>
              </>
            ) : (
              <p className="workspace-error">Template not found.</p>
            )}
          </div>
        </div>
      ) : null}

      {showCreateWorkspace || closingModal === "createWorkspace" ? (
        <div
          className={`workspace-modal-backdrop ${closingModal === "createWorkspace" ? "is-closing" : ""}`}
          role="presentation"
          onClick={closeCreateWorkspaceModal}
        >
          <div
            className={`workspace-modal ${closingModal === "createWorkspace" ? "is-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-workspace-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="workspace-modal-header">
              <h2 id="create-workspace-title">Create workspace</h2>
              <button
                type="button"
                className="workspace-modal-close"
                onClick={closeCreateWorkspaceModal}
                aria-label="Close create workspace modal"
              >
                ×
              </button>
            </div>

            <p className="workspace-modal-copy">Set up a space for your team&apos;s docs and members.</p>

            <form className="workspace-modal-form" onSubmit={createWorkspace}>
              <label>
                Workspace name
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  placeholder="Product Team"
                  minLength={2}
                  maxLength={80}
                  required
                  autoFocus
                />
              </label>

              {workspaceError ? <p className="workspace-error">{workspaceError}</p> : null}

              <div className="workspace-modal-actions">
                <button
                  type="button"
                  className="workspace-action-btn ghost"
                  onClick={closeCreateWorkspaceModal}
                >
                  Cancel
                </button>
                <button type="submit" className="workspace-action-btn primary" disabled={isCreatingWorkspace}>
                  {isCreatingWorkspace ? "Creating..." : "Create workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showInviteMember || closingModal === "inviteMember" ? (
        <div
          className={`workspace-modal-backdrop ${closingModal === "inviteMember" ? "is-closing" : ""}`}
          role="presentation"
          onClick={closeInviteMemberModal}
        >
          <div
            className={`workspace-modal ${closingModal === "inviteMember" ? "is-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-member-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="workspace-modal-header">
              <h2 id="invite-member-title">Add team member</h2>
              <button
                type="button"
                className="workspace-modal-close"
                onClick={closeInviteMemberModal}
                aria-label="Close invite member modal"
              >
                ×
              </button>
            </div>

            <p className="workspace-modal-copy">Invite to workspace</p>
            <p className="workspace-modal-workspace">
              {selectedWorkspace ? selectedWorkspace.name : "No workspace selected"}
            </p>

            <form className="workspace-modal-form" onSubmit={inviteTeamMember}>
              <label>
                Team member email
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="teammate@company.com"
                  maxLength={320}
                  required
                  autoFocus
                />
              </label>

              {inviteError ? <p className="workspace-error">{inviteError}</p> : null}

              <div className="workspace-modal-actions">
                <button
                  type="button"
                  className="workspace-action-btn ghost"
                  onClick={closeInviteMemberModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="workspace-action-btn primary"
                  disabled={isInvitingMember || !selectedWorkspace}
                >
                  {isInvitingMember ? "Sending..." : "Send invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showArchiveNote || closingModal === "archiveNote" ? (
        <div
          className={`workspace-modal-backdrop ${closingModal === "archiveNote" ? "is-closing" : ""}`}
          role="presentation"
          onClick={closeArchiveNoteModal}
        >
          <div
            className={`workspace-modal ${closingModal === "archiveNote" ? "is-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-note-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="workspace-modal-header">
              <h2 id="archive-note-title">Archive note</h2>
              <button
                type="button"
                className="workspace-modal-close"
                onClick={closeArchiveNoteModal}
                aria-label="Close archive note modal"
              >
                ×
              </button>
            </div>

            <p className="workspace-modal-copy">Are you sure you want to archive this note?</p>
            <p className="workspace-modal-workspace">
              {archiveCandidateNote ? archiveCandidateNote.title : "Selected note"}
            </p>
            <p className="workspace-modal-copy">
              You can still view it later from the Archived filter.
            </p>

            {archiveError ? <p className="workspace-error">{archiveError}</p> : null}

            <div className="workspace-modal-actions">
              <button
                type="button"
                className="workspace-action-btn ghost"
                onClick={closeArchiveNoteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="workspace-action-btn primary"
                onClick={archiveNote}
                disabled={isArchivingNote || !archiveCandidateNote}
              >
                {isArchivingNote ? "Archiving..." : "Archive note"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

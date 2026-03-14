"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type Role = "OWNER" | "EDITOR" | "VIEWER";

type BasicUser = {
  id: string;
  name: string | null;
  email: string;
};

type PermissionRecord = {
  role: Role;
  user: BasicUser;
};

type PermissionManagerProps = {
  noteId: string;
  members: BasicUser[];
  initialPermissions: PermissionRecord[];
  currentUserId: string;
};

function roleOptions(): Role[] {
  return ["OWNER", "EDITOR", "VIEWER"];
}

function roleLabel(role: Role): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function memberLabel(user: BasicUser): string {
  return user.name?.trim() || user.email;
}

function memberInitials(user: BasicUser): string {
  const source = user.name?.trim() || user.email.split("@")[0] || user.email;
  const parts = source
    .split(/[\s._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "A";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
}

type DisabledFieldTooltipProps = {
  message: string | null;
  children: ReactNode;
};

function DisabledFieldTooltip({ message, children }: DisabledFieldTooltipProps) {
  if (!message) {
    return <>{children}</>;
  }

  return (
    <span
      className="field-tooltip-anchor"
      data-tooltip={message}
      tabIndex={0}
    >
      {children}
    </span>
  );
}

export function PermissionManager({
  noteId,
  members,
  initialPermissions,
  currentUserId,
}: PermissionManagerProps) {
  const [permissions, setPermissions] = useState(initialPermissions);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("VIEWER");
  const [draftRoles, setDraftRoles] = useState<Record<string, Role>>(() => {
    const entries = initialPermissions.map((permission) => [
      permission.user.id,
      permission.role,
    ]);
    return Object.fromEntries(entries) as Record<string, Role>;
  });

  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const assignableMembers = useMemo(
    () => members.filter((member) => member.id !== currentUserId),
    [members, currentUserId],
  );

  const sortedPermissions = useMemo(() => {
    const visiblePermissions = permissions.filter(
      (permission) => permission.user.id !== currentUserId,
    );

    return [...visiblePermissions].sort((left, right) => {
      const leftLabel = left.user.name ?? left.user.email;
      const rightLabel = right.user.name ?? right.user.email;
      return leftLabel.localeCompare(rightLabel);
    });
  }, [permissions, currentUserId]);

  const noMembersTooltip =
    assignableMembers.length === 0 && !isBusy
      ? "There are no other workspace members to grant note access to yet."
      : null;
  const roleDisabledTooltip =
    !selectedUserId && !isBusy
      ? assignableMembers.length === 0
        ? "There are no other workspace members to grant note access to yet."
        : "Please select a workspace member first."
      : null;

  useEffect(() => {
    setSelectedUserId((currentValue) => {
      if (assignableMembers.some((member) => member.id === currentValue)) {
        return currentValue;
      }

      return "";
    });
  }, [assignableMembers]);

  async function addPermission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedUserId) {
      setError("Select a user first");
      return;
    }

    if (selectedUserId === currentUserId) {
      setError("You cannot change your own permission");
      return;
    }

    setIsBusy(true);

    try {
      const response = await fetch(`/api/notes/${noteId}/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(payload?.error ?? "Failed to update permissions");
        return;
      }

      const payload = (await response.json()) as {
        permission: PermissionRecord;
      };

      setPermissions((current) => {
        const remaining = current.filter(
          (permission) => permission.user.id !== payload.permission.user.id,
        );
        return [...remaining, payload.permission];
      });
      setDraftRoles((current) => ({
        ...current,
        [payload.permission.user.id]: payload.permission.role,
      }));
    } finally {
      setIsBusy(false);
    }
  }

  async function updatePermission(userId: string) {
    setError(null);

    const role = draftRoles[userId];
    if (!role) {
      return;
    }

    setIsBusy(true);

    try {
      const response = await fetch(`/api/notes/${noteId}/permissions/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(payload?.error ?? "Failed to update permissions");
        return;
      }

      const payload = (await response.json()) as {
        permission: PermissionRecord;
      };

      setPermissions((current) =>
        current.map((permission) =>
          permission.user.id === payload.permission.user.id ? payload.permission : permission,
        ),
      );
      setDraftRoles((current) => ({
        ...current,
        [payload.permission.user.id]: payload.permission.role,
      }));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="panel stack">
      <h2>Permission Manager</h2>
      <p className="muted-text">Owners can grant OWNER, EDITOR, or VIEWER access per note.</p>

      <form className="stack" onSubmit={addPermission}>
        <label className="field">
          Workspace Member
          <DisabledFieldTooltip message={noMembersTooltip}>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              disabled={assignableMembers.length === 0 || isBusy}
            >
              <option value="">
                {assignableMembers.length === 0 ? "No members" : "Select a workspace member"}
              </option>
              {assignableMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name ?? member.email}
                </option>
              ))}
            </select>
          </DisabledFieldTooltip>
        </label>

        <label className="field">
          Role
          <DisabledFieldTooltip message={roleDisabledTooltip}>
            <select
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as Role)}
              disabled={!selectedUserId || isBusy}
            >
              {roleOptions().map((role) => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </select>
          </DisabledFieldTooltip>
        </label>

        <button
          type="submit"
          className="primary-btn"
          disabled={isBusy || !selectedUserId}
        >
          {isBusy ? "Updating..." : "Grant / Update Access"}
        </button>
      </form>

      <div className="stack">
        {sortedPermissions.map((permission) => (
          <div className="permission-row" key={permission.user.id}>
            <span className="permission-row-avatar" aria-hidden="true">
              {memberInitials(permission.user)}
            </span>
            <div className="permission-row-main">
              <div className="permission-row-copy">
                <strong>{memberLabel(permission.user)}</strong>
                <p className="muted-text">{permission.user.email}</p>
              </div>
              <div className="permission-row-controls">
                <select
                  value={draftRoles[permission.user.id] ?? permission.role}
                  onChange={(event) =>
                    setDraftRoles((current) => ({
                      ...current,
                      [permission.user.id]: event.target.value as Role,
                    }))
                  }
                  disabled={isBusy}
                >
                  {roleOptions().map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="primary-btn permission-save-btn"
                  disabled={isBusy}
                  onClick={() => updatePermission(permission.user.id)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}

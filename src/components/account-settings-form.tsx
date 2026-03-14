"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AccountSettingsFormProps = {
  initialName: string | null;
  email: string;
  memberSinceLabel: string;
  workspaceCount: number;
  noteCount: number;
  templateCount: number;
};

function resolveDisplayName(name: string, email: string): string {
  const trimmedName = name.trim();

  if (trimmedName) {
    return trimmedName;
  }

  return email.split("@")[0] || email;
}

function resolveInitials(name: string, email: string): string {
  return resolveDisplayName(name, email)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.slice(0, 1).toUpperCase())
    .join("");
}

export function AccountSettingsForm({
  initialName,
  email,
  memberSinceLabel,
  workspaceCount,
  noteCount,
  templateCount,
}: AccountSettingsFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialName ?? "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const displayName = useMemo(() => resolveDisplayName(name, email), [email, name]);
  const avatarInitials = useMemo(() => resolveInitials(name, email), [email, name]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setProfileNotice(null);
    setIsSavingProfile(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; user?: { name: string | null } }
        | null;

      if (!response.ok) {
        setProfileError(payload?.error ?? "Could not update profile");
        return;
      }

      setName(payload?.user?.name ?? "");
      setProfileNotice("Profile updated.");
      router.refresh();
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordNotice(null);

    if (nextPassword !== confirmPassword) {
      setPasswordError("New password and confirmation must match.");
      return;
    }

    setIsSavingPassword(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          nextPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setPasswordError(payload?.error ?? "Could not change password");
        return;
      }

      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      setPasswordNotice("Password updated.");
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <section className="account-layout reveal">
      <div className="account-grid">
        <section className="panel account-summary-card stack">
          <div className="account-summary-head">
            <span className="account-summary-avatar" aria-hidden="true">
              {avatarInitials}
            </span>
            <div className="stack compact">
              <p className="workspace-label">Account</p>
              <h2>{displayName}</h2>
              <p className="muted-text">{email}</p>
            </div>
          </div>

          <div className="inline-row">
            <span className="status-chip">Member since {memberSinceLabel}</span>
            <span className="status-chip">{workspaceCount} workspaces</span>
            <span className="status-chip">{noteCount} notes</span>
            <span className="status-chip">{templateCount} templates</span>
          </div>
        </section>

        <div className="account-forms stack">
          <section className="panel stack">
            <div className="stack compact">
              <p className="workspace-label">Profile</p>
              <h2>Personal details</h2>
              <p className="muted-text">Update the name shown across workspaces, templates, and notes.</p>
            </div>

            <form className="stack" onSubmit={saveProfile}>
              <label className="field">
                Name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  maxLength={80}
                />
              </label>

              <label className="field">
                Email
                <input
                  type="email"
                  value={email}
                  disabled
                  className="account-readonly-input"
                />
              </label>

              {profileError ? <p className="account-feedback error">{profileError}</p> : null}
              {profileNotice ? <p className="account-feedback success">{profileNotice}</p> : null}

              <div className="account-form-actions">
                <button type="submit" className="primary-btn" disabled={isSavingProfile}>
                  {isSavingProfile ? "Saving..." : "Save profile"}
                </button>
              </div>
            </form>
          </section>

          <section className="panel stack">
            <div className="stack compact">
              <p className="workspace-label">Security</p>
              <h2>Password</h2>
              <p className="muted-text">Change your password without affecting your existing workspaces.</p>
            </div>

            <form className="stack" onSubmit={savePassword}>
              <label className="field">
                Current password
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </label>

              <label className="field">
                New password
                <input
                  type="password"
                  value={nextPassword}
                  onChange={(event) => setNextPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </label>

              <label className="field">
                Confirm new password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </label>

              {passwordError ? <p className="account-feedback error">{passwordError}</p> : null}
              {passwordNotice ? <p className="account-feedback success">{passwordNotice}</p> : null}

              <div className="account-form-actions">
                <button type="submit" className="primary-btn" disabled={isSavingPassword}>
                  {isSavingPassword ? "Updating..." : "Change password"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </section>
  );
}

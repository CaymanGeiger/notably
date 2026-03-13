"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "signin" | "register";
const PANEL_ORDER: Record<AuthMode, number> = {
  signin: 0,
  register: 1,
};
const PANEL_COUNT = Object.keys(PANEL_ORDER).length;
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_USER_EMAIL ?? "demo@notably.app";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_USER_PASSWORD ?? "DemoPass123!";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signInRef = useRef<HTMLFormElement>(null);
  const signUpRef = useRef<HTMLFormElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const panelIndex = useMemo(() => PANEL_ORDER[mode], [mode]);

  useEffect(() => {
    const activeRef = mode === "signin" ? signInRef : signUpRef;
    const frame = window.requestAnimationFrame(() => {
      const nextHeight = activeRef.current?.scrollHeight ?? null;
      if (nextHeight && contentRef.current) {
        contentRef.current.style.height = `${nextHeight}px`;
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [mode, error, isSubmitting]);

  function onModeChange(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 12000);

    try {
      const response = await fetch(
        mode === "signin" ? "/api/auth/signin" : "/api/auth/register",
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            mode === "signin"
              ? {
                  email,
                  password,
                }
              : {
                  name: name.trim() || undefined,
                  email,
                  password,
                },
          ),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(payload?.error ?? "Authentication failed");
        return;
      }

      router.push("/workspaces");
      router.refresh();
    } catch (submitError) {
      if (submitError instanceof DOMException && submitError.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError("Could not reach the server. Please try again.");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <div className="stack compact">
        <p className="eyebrow">Secure Access</p>
        <h2>{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
        <p className="muted-text">
          {mode === "signin"
            ? "Continue into your collaborative workspace."
            : "Get your personal workspace and start collaborating."}
        </p>
      </div>

      <div className="mode-toggle" role="tablist" aria-label="Authentication Mode">
        <button
          type="button"
          className={mode === "signin" ? "active" : ""}
          onClick={() => onModeChange("signin")}
        >
          Sign In
        </button>
        <button
          type="button"
          className={mode === "register" ? "active" : ""}
          onClick={() => onModeChange("register")}
        >
          Create Account
        </button>
      </div>

      <div className="auth-panel-viewport">
        <div ref={contentRef} className="auth-panel-height" style={{ height: "auto" }}>
          <div
            className="auth-panel-track"
            style={{
              width: `${PANEL_COUNT * 100}%`,
              gridTemplateColumns: `repeat(${PANEL_COUNT}, minmax(0, 1fr))`,
              transform: `translateX(-${panelIndex * (100 / PANEL_COUNT)}%)`,
            }}
          >
            <form
              ref={signInRef}
              className="stack auth-panel-form"
              style={{ order: PANEL_ORDER.signin }}
              onSubmit={onSubmit}
            >
              <label className="field">
                Work Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                />
              </label>

              <label className="field">
                Password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
              </label>

              {error ? <p className="error-text">{error}</p> : null}

              <button type="submit" className="primary-btn" disabled={isSubmitting}>
                {isSubmitting && mode === "signin" ? "Working..." : "Sign In"}
              </button>
            </form>

            <form
              ref={signUpRef}
              className="stack auth-panel-form"
              style={{ order: PANEL_ORDER.register }}
              onSubmit={onSubmit}
            >
              <label className="field">
                Full Name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ada Lovelace"
                  maxLength={80}
                />
              </label>

              <label className="field">
                Work Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                />
              </label>

              <label className="field">
                Password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
              </label>

              {error ? <p className="error-text">{error}</p> : null}

              <button type="submit" className="primary-btn" disabled={isSubmitting}>
                {isSubmitting && mode === "register" ? "Working..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <p className="muted-text auth-footer">
        Session cookies are stored securely and access is enforced server-side.
      </p>
    </section>
  );
}

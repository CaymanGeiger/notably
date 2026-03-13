import Link from "next/link";
import type { CSSProperties } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import type { ThemeMode } from "@/lib/theme";

type PublicNavProps = {
  animateBrand?: boolean;
  isSignedIn: boolean;
  initialTheme: ThemeMode;
};

const brandLetters = "Notably".split("").map((character, index) => ({
  character,
  isAccent: index >= 3,
  delayMs: 120 + index * 54,
  style: {
    "--brand-letter-delay": `${120 + index * 54}ms`,
  } as CSSProperties,
}));

export function PublicNav({
  animateBrand = false,
  isSignedIn,
  initialTheme,
}: PublicNavProps) {

  return (
    <header className="home-nav reveal">
      <div className="brand-block">
        <Link href="/" className="brand-wordmark-link" aria-label="Notably Home">
          <span
            className={`brand-wordmark ${animateBrand ? "brand-wordmark-animated" : ""}`}
            aria-hidden="true"
          >
            {brandLetters.map((letter) => (
              <span
                key={`${letter.character}-${letter.delayMs}`}
                className={`brand-wordmark-letter ${letter.isAccent ? "brand-wordmark-accent" : ""}`}
                style={animateBrand ? letter.style : undefined}
              >
                {letter.character}
              </span>
            ))}
          </span>
        </Link>
        <p>Local-first team notes built for controlled collaboration.</p>
      </div>
      <div className="nav-actions">
        {isSignedIn ? null : (
          <Link className="ghost-btn" href="/signin">
            Sign In
          </Link>
        )}
        <ThemeToggle initialTheme={initialTheme} />
        <Link className="primary-btn" href={isSignedIn ? "/workspaces" : "/signin"}>
          {isSignedIn ? "Go To Workspace" : "Create Account"}
        </Link>
      </div>
    </header>
  );
}

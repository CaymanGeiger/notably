"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { defaultThemeMode, resolveThemeMode, type ThemeMode } from "@/lib/theme";

function getThemeSnapshot(): ThemeMode {
  if (typeof document === "undefined") {
    return defaultThemeMode;
  }

  return resolveThemeMode(document.documentElement.getAttribute("data-theme"));
}

function subscribeToTheme(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const observer = new MutationObserver(() => {
    callback();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => {
    observer.disconnect();
  };
}

type ThemeAwareTourShotProps = {
  title: string;
  alt: string;
  darkSrc: string;
  lightSrc: string;
  initialTheme: ThemeMode;
};

export function ThemeAwareTourShot({
  title,
  alt,
  darkSrc,
  lightSrc,
  initialTheme,
}: ThemeAwareTourShotProps) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => initialTheme);
  const imageSrc = theme === "light" ? lightSrc : darkSrc;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <div className="tour-shot-link">
        <div className="tour-shot-frame">
          <Image src={imageSrc} alt={alt} width={1440} height={980} sizes="(max-width: 980px) 100vw, 58vw" />
        </div>
        <div className="tour-shot-meta">
          <span>Live product screenshot</span>
          <button type="button" className="tour-shot-open-btn" onClick={() => setIsOpen(true)}>
            Open full image
          </button>
        </div>
      </div>
      {typeof document !== "undefined" && isOpen
        ? createPortal(
            <div className="tour-shot-modal-backdrop" onClick={() => setIsOpen(false)}>
              <div
                className="tour-shot-modal"
                role="dialog"
                aria-modal="true"
                aria-label={`${title} full image`}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="tour-shot-modal-close"
                  onClick={() => setIsOpen(false)}
                  aria-label={`Close full image for ${title}`}
                >
                  Close
                </button>
                <div className="tour-shot-modal-frame">
                  <Image src={imageSrc} alt={alt} width={1440} height={980} sizes="92vw" />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

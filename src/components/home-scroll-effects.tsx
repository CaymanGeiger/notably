"use client";

import { useEffect } from "react";

export function HomeScrollEffects() {
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(".home-page .reveal"),
    );

    if (sections.length === 0) {
      return;
    }

    sections.forEach((section, index) => {
      section.style.setProperty("--reveal-delay", `${Math.min(index * 95, 520)}ms`);
    });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sections.forEach((section) => section.classList.add("reveal-ready", "is-visible"));
      return;
    }

    const initialViewportCutoff = window.innerHeight * 0.92;

    const revealSection = (section: HTMLElement) => {
      section.classList.add("is-visible");
      observer.unobserve(section);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          revealSection(entry.target as HTMLElement);
        });
      },
      {
        threshold: 0.06,
        rootMargin: "0px 0px 2% 0px",
      },
    );

    const revealRemainingAtPageEnd = () => {
      const atPageBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8;

      if (!atPageBottom) {
        return;
      }

      sections.forEach((section) => revealSection(section));
    };

    sections.forEach((section) => {
      const sectionTop = section.getBoundingClientRect().top;
      section.classList.add("reveal-ready");

      if (sectionTop <= initialViewportCutoff) {
        section.classList.add("is-visible");
        return;
      }

      observer.observe(section);
    });

    revealRemainingAtPageEnd();
    window.addEventListener("scroll", revealRemainingAtPageEnd, { passive: true });
    window.addEventListener("resize", revealRemainingAtPageEnd);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", revealRemainingAtPageEnd);
      window.removeEventListener("resize", revealRemainingAtPageEnd);
    };
  }, []);

  return null;
}

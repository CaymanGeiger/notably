import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "./globals.css";
import { resolveThemeMode, themePreferenceCookieName } from "@/lib/theme";

const inter = Inter({
  variable: "--font-ui",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notably",
  description:
    "Local-first collaborative notes app with note-level access controls and realtime messaging.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialTheme = resolveThemeMode(cookieStore.get(themePreferenceCookieName)?.value);

  return (
    <html lang="en" data-theme={initialTheme} suppressHydrationWarning>
      <body className={`${inter.variable} ${newsreader.variable} ${jetBrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}

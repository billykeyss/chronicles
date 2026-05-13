import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeModeProvider } from "@/components/ThemeModeProvider";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Chronicles — Wiki Timeline",
  description:
    "Place Wikipedia events along a timeline. Three strikes ends the run.",
};

// Avoid a light-mode flash on hard refresh: read localStorage *before* React hydrates
// and apply the chosen background color directly on <html>.
const noFlashScript = `(function(){
  try {
    var m = localStorage.getItem("chronicles-theme-mode");
    if (m !== "light" && m !== "dark") m = "light";
    var bg = m === "dark" ? "#0a0a14" : "#f7f3e8";
    document.documentElement.style.backgroundColor = bg;
    document.documentElement.dataset.themeMode = m;
  } catch (e) {
    document.documentElement.style.backgroundColor = "#f7f3e8";
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Script id="no-flash-theme" strategy="beforeInteractive">
          {noFlashScript}
        </Script>
        <AppRouterCacheProvider options={{ key: "mui" }}>
          <ThemeModeProvider>{children}</ThemeModeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

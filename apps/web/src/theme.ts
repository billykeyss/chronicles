"use client";

import { createTheme, type Theme } from "@mui/material/styles";

export type ThemeMode = "light" | "dark";

const darkPalette = {
  background: "#0a0a14",
  paper: "#13131e",
  panelHi: "#181826",
  primary: "#c9a849",
  primaryHi: "#d8bd6a",
  primaryDark: "#5a4d2a",
  text: "#ece8dc",
  textSecondary: "#9a9485",
  divider: "#26242d",
  error: "#a8504a",
  success: "#6a8a62",
};

const lightPalette = {
  background: "#f7f3e8",
  paper: "#fdfbf3",
  panelHi: "#f1ecdb",
  primary: "#8a6f1c",
  primaryHi: "#a98a31",
  primaryDark: "#cbb979",
  text: "#15110d",
  textSecondary: "#6f6a60",
  divider: "#d8d3c5",
  error: "#8b3530",
  success: "#3f5d3a",
};

export function buildTheme(mode: ThemeMode): Theme {
  const p = mode === "dark" ? darkPalette : lightPalette;
  const contrast = mode === "dark" ? "#0a0a14" : "#fdfbf3";
  const hoverTint =
    mode === "dark" ? "rgba(201, 168, 73, 0.06)" : "rgba(138, 111, 28, 0.06)";
  const selectedTint =
    mode === "dark" ? "rgba(201, 168, 73, 0.10)" : "rgba(138, 111, 28, 0.10)";

  return createTheme({
    cssVariables: true,
    palette: {
      mode,
      primary: {
        main: p.primary,
        light: p.primaryHi,
        dark: p.primaryDark,
        contrastText: contrast,
      },
      secondary: { main: p.text, contrastText: p.background },
      success: { main: p.success },
      error: { main: p.error },
      warning: { main: p.primary },
      background: { default: p.background, paper: p.paper },
      divider: p.divider,
      text: { primary: p.text, secondary: p.textSecondary },
      action: { hover: hoverTint, selected: selectedTint },
    },
    shape: { borderRadius: 4 },
    typography: {
      fontFamily:
        'var(--font-display), "Fraunces", Georgia, "Times New Roman", serif',
      h1: { fontWeight: 400, letterSpacing: "-0.02em" },
      h2: { fontWeight: 400, letterSpacing: "-0.015em" },
      h3: { fontWeight: 500, letterSpacing: "-0.01em" },
      button: {
        fontFamily: "var(--font-display), Georgia, serif",
        textTransform: "none",
        letterSpacing: "0.01em",
        fontWeight: 500,
      },
      caption: { letterSpacing: "0.02em" },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: p.paper,
            border: `1px solid ${p.divider}`,
            boxShadow: "none",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 4,
            paddingInline: 16,
            fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          },
          contained: {
            background: p.primary,
            color: contrast,
            "&:hover": { background: p.primaryHi },
          },
          outlined: {
            borderColor: p.divider,
            color: p.text,
            "&:hover": {
              borderColor: p.primary,
              backgroundColor: hoverTint,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 400,
            fontFamily: "var(--font-display), Georgia, serif",
            letterSpacing: 0,
          },
          filled: {
            backgroundColor: selectedTint,
            border: `1px solid ${p.primary}`,
            color: p.text,
          },
          outlined: {
            borderColor: p.divider,
            color: p.textSecondary,
            "&:hover": { borderColor: p.textSecondary, color: p.text },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: p.paper,
            border: `1px solid ${p.divider}`,
            boxShadow: "0 24px 48px rgba(0, 0, 0, 0.35)",
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontFamily: "var(--font-display), Georgia, serif",
            fontWeight: 400,
            letterSpacing: "-0.01em",
            fontSize: 22,
            color: p.text,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: p.panelHi,
            color: p.text,
            border: `1px solid ${p.divider}`,
            fontFamily: "var(--font-display), serif",
          },
        },
      },
    },
  });
}

const defaultTheme = buildTheme("dark");
export default defaultTheme;

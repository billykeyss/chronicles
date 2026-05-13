"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { buildTheme, type ThemeMode } from "@/theme";

const STORAGE_KEY = "chronicles-theme-mode";

type Ctx = {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (m: ThemeMode) => void;
};

const ThemeModeContext = createContext<Ctx>({
  mode: "dark",
  toggleMode: () => {},
  setMode: () => {},
});

export function useThemeMode(): Ctx {
  return useContext(ThemeModeContext);
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") setModeState(saved);
    } catch {
      // ignore
    }
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // ignore
    }
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((m) => {
      const next: ThemeMode = m === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const theme = useMemo(() => buildTheme(mode), [mode]);
  const ctx = useMemo(
    () => ({ mode, toggleMode, setMode }),
    [mode, toggleMode, setMode],
  );

  return (
    <ThemeModeContext.Provider value={ctx}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

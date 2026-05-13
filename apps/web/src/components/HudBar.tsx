"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Moon, RotateCcw, Sun } from "lucide-react";
import { STRIKES_MAX, HINTS_PER_GAME } from "@/game/types";
import { useThemeMode } from "./ThemeModeProvider";

type Props = {
  score: number;
  streak: number;
  strikes: number;
  hintsRemaining: number;
  onNewGame?: () => void;
};

export default function HudBar({
  score,
  streak,
  strikes,
  hintsRemaining,
  onNewGame,
}: Props) {
  const livesLeft = STRIKES_MAX - strikes;
  const { mode, toggleMode } = useThemeMode();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "flex-start", md: "flex-end" },
        justifyContent: "space-between",
        gap: { xs: 2.5, md: 4 },
        pb: 2.5,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Box>
        <Typography
          variant="h1"
          sx={{
            fontVariationSettings: '"opsz" 144, "SOFT" 50',
            fontSize: { xs: 32, sm: 40, md: 48 },
            color: "text.primary",
            lineHeight: 0.95,
            fontWeight: 300,
            letterSpacing: "-0.02em",
          }}
        >
          Chronicles
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontFamily: 'var(--font-jetbrains), monospace',
            letterSpacing: "0.22em",
            fontSize: { xs: 9, sm: 10 },
            mt: 0.5,
            display: "block",
          }}
        >
          a game of chronology
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          columnGap: { xs: 2, sm: 3, md: 4 },
          rowGap: 1.5,
          alignItems: "end",
          width: { xs: "100%", md: "auto" },
        }}
      >
        <Stat label="Score" value={score.toLocaleString()} />
        <Stat label="Streak" value={String(streak)} />
        <PipStat label="Lives" count={STRIKES_MAX} filled={livesLeft} color="error.main" />
        <PipStat
          label="Hints"
          count={HINTS_PER_GAME}
          filled={hintsRemaining}
          color="primary.main"
        />
        <Box>
          <Label>Theme</Label>
          <Tooltip
            title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            placement="top"
          >
            <ButtonBase
              onClick={toggleMode}
              aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              sx={pillButtonSx}
            >
              {mode === "dark" ? (
                <Moon size={13} strokeWidth={1.5} />
              ) : (
                <Sun size={13} strokeWidth={1.5} />
              )}
              {mode === "dark" ? "Dark" : "Light"}
            </ButtonBase>
          </Tooltip>
        </Box>
        {onNewGame && (
          <Box>
            <Label>Run</Label>
            <Tooltip title="Start a new game" placement="top">
              <ButtonBase
                onClick={onNewGame}
                aria-label="Start a new game"
                sx={pillButtonSx}
              >
                <RotateCcw size={13} strokeWidth={1.5} />
                New
              </ButtonBase>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Label>{label}</Label>
      <Typography
        component="div"
        sx={{
          fontVariationSettings: '"opsz" 96',
          fontWeight: 300,
          fontSize: { xs: 24, sm: 28 },
          color: "text.primary",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function PipStat({
  label,
  count,
  filled,
  color,
}: {
  label: string;
  count: number;
  filled: number;
  color: string;
}) {
  return (
    <Box>
      <Label>{label}</Label>
      <Box
        sx={{
          display: "flex",
          gap: 0.75,
          height: { xs: 24, sm: 28 },
          alignItems: "center",
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <Box
            key={i}
            sx={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              border: 1,
              borderColor: i < filled ? color : "divider",
              backgroundColor: i < filled ? color : "transparent",
              transition: "background-color .15s, border-color .15s",
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

const pillButtonSx = {
  height: { xs: 24, sm: 28 },
  paddingInline: 1.25,
  borderRadius: 999,
  border: 1,
  borderColor: "divider",
  color: "text.primary",
  fontFamily: 'var(--font-jetbrains), monospace',
  fontSize: 10,
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  display: "inline-flex",
  alignItems: "center",
  gap: 0.75,
  transition: "border-color .2s, color .2s, background .2s",
  "&:hover": {
    borderColor: "primary.main",
    color: "primary.main",
    backgroundColor: "action.hover",
  },
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      sx={{
        color: "text.secondary",
        fontFamily: 'var(--font-jetbrains), monospace',
        textTransform: "uppercase",
        letterSpacing: "0.22em",
        fontSize: { xs: 9, sm: 10 },
        display: "block",
        mb: 0.5,
      }}
    >
      {children}
    </Typography>
  );
}

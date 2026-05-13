"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Lightbulb, Moon, RotateCcw, Sun } from "lucide-react";
import { STRIKES_MAX, HINTS_PER_GAME, type HintType } from "@/game/types";
import { useThemeMode } from "./ThemeModeProvider";

type Props = {
  score: number;
  streak: number;
  strikes: number;
  hintsRemaining: number;
  hintUsed?: HintType | null;
  onNewGame?: () => void;
  onUseHint?: () => void;
  onOpenMenu?: () => void;
};

export default function HudBar({
  score,
  streak,
  strikes,
  hintsRemaining,
  hintUsed,
  onNewGame,
  onUseHint,
  onOpenMenu,
}: Props) {
  const livesLeft = STRIKES_MAX - strikes;
  const { mode, toggleMode } = useThemeMode();
  const canHint = onUseHint && hintsRemaining > 0 && !hintUsed;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: { xs: 1, sm: 2, md: 3 },
        py: 0.75,
      }}
    >
      {onOpenMenu ? (
        <Tooltip title="Back to menu" placement="bottom-start">
          <ButtonBase
            onClick={onOpenMenu}
            aria-label="Back to menu"
            focusRipple
            sx={{
              borderRadius: 0.5,
              px: 0.5,
              mx: -0.5,
              transition: "color .15s",
              "&:hover .chronicles-wordmark": { color: "primary.main" },
            }}
          >
            <Typography
              className="chronicles-wordmark"
              variant="h1"
              sx={{
                fontVariationSettings: '"opsz" 96, "SOFT" 50',
                fontSize: { xs: 20, sm: 26, md: 30 },
                color: "text.primary",
                lineHeight: 1,
                fontWeight: 300,
                letterSpacing: "-0.015em",
                flexShrink: 0,
                transition: "color .15s",
              }}
            >
              Chronicles
            </Typography>
          </ButtonBase>
        </Tooltip>
      ) : (
        <Typography
          variant="h1"
          sx={{
            fontVariationSettings: '"opsz" 96, "SOFT" 50',
            fontSize: { xs: 20, sm: 26, md: 30 },
            color: "text.primary",
            lineHeight: 1,
            fontWeight: 300,
            letterSpacing: "-0.015em",
            flexShrink: 0,
          }}
        >
          Chronicles
        </Typography>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1.25, sm: 2, md: 3 },
          flex: 1,
          justifyContent: "flex-end",
          minWidth: 0,
        }}
      >
        {/* Stats — hidden labels on very narrow screens */}
        <Box
          sx={{
            display: { xs: "none", sm: "flex" },
            alignItems: "end",
            gap: { sm: 2, md: 3 },
          }}
        >
          <Stat label="Score" value={score.toLocaleString()} />
          <Stat label="Streak" value={String(streak)} />
          <Box>
            <Label>Lives</Label>
            <Pips count={STRIKES_MAX} filled={livesLeft} color="error.main" />
          </Box>
          <Box>
            <Label>Oracles</Label>
            <Pips
              count={HINTS_PER_GAME}
              filled={hintsRemaining}
              color="primary.main"
            />
          </Box>
        </Box>

        {/* Mobile-only compact stat: score + tiny pip rows */}
        <Box
          sx={{
            display: { xs: "flex", sm: "none" },
            alignItems: "center",
            gap: 1.25,
          }}
        >
          <Box>
            <Typography
              component="div"
              sx={{
                fontVariationSettings: '"opsz" 96',
                fontWeight: 300,
                fontSize: 18,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {score.toLocaleString()}
            </Typography>
          </Box>
          <Pips count={STRIKES_MAX} filled={livesLeft} color="error.main" />
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {onUseHint && (
            <Tooltip
              title={canHint ? "Consult the oracle" : "The oracle is silent"}
              placement="bottom"
            >
              <Box component="span" sx={{ display: "inline-flex" }}>
                <ButtonBase
                  onClick={onUseHint}
                  disabled={!canHint}
                  aria-label="Consult the oracle"
                  sx={{ ...iconButtonSx, opacity: canHint ? 1 : 0.35 }}
                >
                  <Lightbulb size={15} strokeWidth={1.5} />
                </ButtonBase>
              </Box>
            </Tooltip>
          )}
          <Tooltip
            title={
              mode === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            placement="bottom"
          >
            <ButtonBase
              onClick={toggleMode}
              aria-label={
                mode === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
              sx={iconButtonSx}
            >
              {mode === "dark" ? (
                <Moon size={15} strokeWidth={1.5} />
              ) : (
                <Sun size={15} strokeWidth={1.5} />
              )}
            </ButtonBase>
          </Tooltip>
          {onNewGame && (
            <Tooltip title="Start a new game" placement="bottom">
              <ButtonBase
                onClick={onNewGame}
                aria-label="Start a new game"
                sx={iconButtonSx}
              >
                <RotateCcw size={15} strokeWidth={1.5} />
              </ButtonBase>
            </Tooltip>
          )}
        </Box>
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

function Pips({
  count,
  filled,
  color,
}: {
  count: number;
  filled: number;
  color: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.6,
        height: { xs: 18, sm: 26 },
        alignItems: "center",
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          sx={{
            width: { xs: 7, sm: 9 },
            height: { xs: 7, sm: 9 },
            borderRadius: "50%",
            border: 1,
            borderColor: i < filled ? color : "divider",
            backgroundColor: i < filled ? color : "transparent",
            transition: "background-color .15s, border-color .15s",
          }}
        />
      ))}
    </Box>
  );
}

const iconButtonSx = {
  width: { xs: 32, sm: 36 },
  height: { xs: 32, sm: 36 },
  borderRadius: 1,
  border: 1,
  borderColor: "divider",
  color: "text.secondary",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "border-color .2s, color .2s, background .2s",
  "&:hover": {
    borderColor: "primary.main",
    color: "primary.main",
    backgroundColor: "action.hover",
  },
  "&.Mui-disabled, &:disabled": {
    cursor: "not-allowed",
  },
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      sx={{
        color: "text.secondary",
        fontFamily: "var(--font-mono), monospace",
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

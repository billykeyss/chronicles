"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type Props = {
  open: boolean;
  score: number;
  correctPlacements: number;
  placements: number;
  bestStreak: number;
  ranOutOfEvents: boolean;
  onRestart: () => void;
  onChangeCategories: () => void;
};

function rankFor(score: number) {
  if (score >= 1500) return "Loremaster";
  if (score >= 1000) return "Chronicler";
  if (score >= 600) return "Scribe";
  if (score >= 300) return "Apprentice";
  return "Wanderer";
}

export default function GameOverDialog({
  open,
  score,
  correctPlacements,
  placements,
  bestStreak,
  ranOutOfEvents,
  onRestart,
  onChangeCategories,
}: Props) {
  const rank = rankFor(score);
  const accuracy =
    placements === 0 ? 0 : Math.round((correctPlacements / placements) * 100);

  return (
    <Dialog open={open} fullWidth maxWidth="xs">
      <DialogTitle>
        {ranOutOfEvents ? "Pool cleared" : "Game over"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'var(--font-jetbrains), monospace',
                letterSpacing: "0.22em",
                color: "text.secondary",
                textTransform: "uppercase",
                fontSize: 10,
                display: "block",
              }}
            >
              Rank
            </Typography>
            <Typography
              sx={{
                fontVariationSettings: '"opsz" 96',
                fontSize: 32,
                fontWeight: 400,
                color: "text.primary",
                lineHeight: 1,
                mt: 0.5,
                letterSpacing: "-0.015em",
              }}
            >
              {rank}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'var(--font-jetbrains), monospace',
                letterSpacing: "0.22em",
                color: "text.secondary",
                textTransform: "uppercase",
                fontSize: 10,
                display: "block",
              }}
            >
              Final score
            </Typography>
            <Typography
              sx={{
                fontVariationSettings: '"opsz" 144',
                fontSize: 52,
                fontWeight: 300,
                color: "primary.main",
                lineHeight: 1,
                letterSpacing: "-0.025em",
              }}
            >
              {score.toLocaleString()}
            </Typography>
          </Box>
          <Stack direction="row" spacing={3}>
            <Stat label="Correct" value={`${correctPlacements} / ${placements}`} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
            <Stat label="Best streak" value={`×${bestStreak}`} />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onChangeCategories}>Change categories</Button>
        <Button variant="contained" onClick={onRestart}>
          Play again
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          fontFamily: 'var(--font-jetbrains), monospace',
          letterSpacing: "0.22em",
          color: "text.secondary",
          textTransform: "uppercase",
          fontSize: 10,
          display: "block",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontWeight: 500,
          fontSize: 18,
          color: "text.primary",
          lineHeight: 1,
          mt: 0.5,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

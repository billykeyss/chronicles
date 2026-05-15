"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { GameMode, HintType } from "@/game/types";
import { SCORING_RULES } from "@/game/scoring";

type Props = {
  open: boolean;
  mode: GameMode;
  onClose: () => void;
  onChoose: (hintType: HintType) => void;
};

type HintOption = { type: HintType; title: string; description: string };

const TIMELINE_OPTIONS: HintOption[] = [
  {
    type: "related",
    title: "Related fact",
    description: "A person, place, or detail from the page — year hidden.",
  },
  {
    type: "eliminate",
    title: "Rule out a slot",
    description: "The Oracle marks one wrong slot with an X.",
  },
  {
    type: "anchor",
    title: "Compare to history",
    description:
      "Tells you whether it's older or newer than a famous moment.",
  },
  {
    type: "compare",
    title: "Compare to the timeline",
    description:
      "Tells you whether it's older or newer than a card you've placed.",
  },
];

const REVERSE_OPTIONS: HintOption[] = [
  {
    type: "related",
    title: "Related fact",
    description: "A clue about the event that matches the year.",
  },
  {
    type: "eliminate",
    title: "Rule out a card",
    description: "The Oracle eliminates one of the wrong cards.",
  },
  {
    type: "verify",
    title: "Verify a card",
    description:
      "Tap a card; the Oracle answers yes or no. Confirms it, or eliminates it.",
  },
];

export default function HintModal({
  open,
  mode,
  onClose,
  onChoose,
}: Props) {
  const options = mode === "reverse" ? REVERSE_OPTIONS : TIMELINE_OPTIONS;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Consult the Oracle</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" sx={{ fontSize: 14, mb: 2 }}>
          Once per card. Clearer visions cost more points.
        </Typography>
        <Stack spacing={1}>
          {options.map((opt) => (
            <Box
              key={opt.type}
              role="button"
              tabIndex={0}
              onClick={() => onChoose(opt.type)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChoose(opt.type);
                }
              }}
              sx={{
                p: 1.5,
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
                cursor: "pointer",
                transition: "border-color .15s, background .15s",
                "&:hover": {
                  borderColor: "primary.main",
                  backgroundColor: "rgba(201, 168, 73, 0.04)",
                },
                "&:focus-visible": {
                  outline: "none",
                  boxShadow: (t) => `0 0 0 2px ${t.palette.primary.main}55`,
                },
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="baseline"
              >
                <Typography sx={{ fontWeight: 500, fontSize: 16 }}>
                  {opt.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: "var(--font-mono), monospace",
                    color: "primary.main",
                    fontSize: 11,
                    letterSpacing: "0.08em",
                  }}
                >
                  {SCORING_RULES.hintBase[opt.type]} pts
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 0.25,
                  color: "text.secondary",
                  fontSize: 13,
                }}
              >
                {opt.description}
              </Typography>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

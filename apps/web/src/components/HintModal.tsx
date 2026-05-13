"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { HintType } from "@/game/types";
import { SCORING_RULES } from "@/game/scoring";

type Props = {
  open: boolean;
  onClose: () => void;
  onChoose: (hintType: HintType) => void;
  hintsRemaining: number;
};

const OPTIONS: Array<{
  type: HintType;
  title: string;
  description: string;
}> = [
  {
    type: "related",
    title: "Related fact",
    description: "A person, place, or detail from the page — year hidden.",
  },
  {
    type: "decade",
    title: "Reveal the decade",
    description: "Narrow the year to a ten-year window.",
  },
  {
    type: "answer",
    title: "Give me the answer",
    description: "The year, plus a highlight of the correct slot.",
  },
];

export default function HintModal({ open, onClose, onChoose, hintsRemaining }: Props) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Use a hint</DialogTitle>
      <DialogContent>
        <Typography
          color="text.secondary"
          sx={{ fontSize: 14, mb: 2 }}
        >
          {hintsRemaining} hint{hintsRemaining === 1 ? "" : "s"} left. Stronger hints earn fewer points.
        </Typography>
        <Stack spacing={1}>
          {OPTIONS.map((opt) => (
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
                    fontFamily: 'var(--font-jetbrains), monospace',
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

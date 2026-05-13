"use client";

import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { PlacedEvent } from "@/game/types";
import { formatYear } from "./EventCard";

type Props = {
  open: boolean;
  result: null | {
    correct: boolean;
    pointsEarned: number;
    placedEvent: PlacedEvent;
  };
  onClose: () => void;
};

export default function ResultToast({ open, result, onClose }: Props) {
  if (!result) return null;
  return (
    <Snackbar
      open={open}
      autoHideDuration={null}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      onClose={onClose}
      sx={{ mt: { xs: 2, sm: 3 } }}
    >
      <Alert
        onClose={onClose}
        severity={result.correct ? "success" : "error"}
        variant="filled"
        sx={{ alignItems: "center" }}
      >
        <Stack direction="row" spacing={1.5} alignItems="baseline">
          <Typography sx={{ fontWeight: 700 }}>
            {result.correct ? "Correct!" : "Misplaced."}
          </Typography>
          <Typography sx={{ fontSize: 13 }}>
            {result.placedEvent.title} · {formatYear(result.placedEvent.year)}
          </Typography>
          {result.correct && result.pointsEarned > 0 && (
            <Typography sx={{ fontWeight: 700 }}>+{result.pointsEarned}</Typography>
          )}
        </Stack>
      </Alert>
    </Snackbar>
  );
}

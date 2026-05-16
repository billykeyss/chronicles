"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowDown, ArrowUp, Check, X } from "lucide-react";
import { CATEGORY_BY_ID } from "@/game/data";
import { formatYear } from "./EventCard";
import type { HigherLowerRound, TimelineEvent } from "@/game/types";
import type { WikipediaSummary } from "@/wikipedia/api";

type Props = {
  round: HigherLowerRound;
  thumbnails?: Record<string, string | undefined>;
  summaries?: Record<string, WikipediaSummary | undefined>;
  onPick: (direction: "earlier" | "later") => void;
};

export default function HigherLowerPanel({
  round,
  thumbnails,
  summaries,
  onPick,
}: Props) {
  const settled = round.pickedDirection !== null;
  const truth: "earlier" | "later" =
    round.challenger.year < round.anchor.year ? "earlier" : "later";
  const correct = settled && round.pickedDirection === truth;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Typography
        variant="caption"
        sx={{
          fontFamily: "var(--font-mono), monospace",
          letterSpacing: "0.36em",
          color: "text.secondary",
          textTransform: "uppercase",
          fontSize: { xs: 10, sm: 11 },
          mb: 2,
        }}
      >
        Did this event come earlier or later?
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr auto 1fr" },
          gap: { xs: 1.5, sm: 3 },
          alignItems: "stretch",
          width: "100%",
          maxWidth: 880,
        }}
      >
        <EventSlot
          event={round.anchor}
          revealYear
          thumb={thumbnails?.[round.anchor.id]}
          summary={summaries?.[round.anchor.id]}
          label="Anchor"
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
            fontFamily: "var(--font-mono), monospace",
            letterSpacing: "0.3em",
            fontSize: 11,
            textTransform: "uppercase",
            py: { xs: 1, sm: 0 },
          }}
        >
          vs
        </Box>

        <EventSlot
          event={round.challenger}
          revealYear={settled}
          thumb={thumbnails?.[round.challenger.id]}
          summary={summaries?.[round.challenger.id]}
          label={settled ? (correct ? "Correct" : "Wrong") : "Challenger"}
          tone={settled ? (correct ? "success" : "error") : undefined}
        />
      </Box>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mt: 3, width: "100%", maxWidth: 560 }}
      >
        <Button
          variant="outlined"
          size="large"
          fullWidth
          disabled={settled}
          onClick={() => onPick("earlier")}
          startIcon={<ArrowDown size={16} strokeWidth={1.5} />}
          sx={{
            py: 1.5,
            borderColor: "divider",
            color: "text.primary",
            fontFamily: "var(--font-mono), monospace",
            letterSpacing: "0.18em",
            fontSize: 12,
            textTransform: "uppercase",
            "&:hover": { borderColor: "primary.main" },
          }}
        >
          Earlier than {formatYear(round.anchor.year)}
        </Button>
        <Button
          variant="outlined"
          size="large"
          fullWidth
          disabled={settled}
          onClick={() => onPick("later")}
          startIcon={<ArrowUp size={16} strokeWidth={1.5} />}
          sx={{
            py: 1.5,
            borderColor: "divider",
            color: "text.primary",
            fontFamily: "var(--font-mono), monospace",
            letterSpacing: "0.18em",
            fontSize: 12,
            textTransform: "uppercase",
            "&:hover": { borderColor: "primary.main" },
          }}
        >
          Later than {formatYear(round.anchor.year)}
        </Button>
      </Stack>

      {settled && (
        <Box
          sx={{
            mt: 2,
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            color: correct ? "success.main" : "error.main",
            fontFamily: "var(--font-mono), monospace",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            fontSize: 11,
          }}
        >
          {correct ? <Check size={14} strokeWidth={2.5} /> : <X size={14} strokeWidth={2.5} />}
          {correct ? "Correct" : `Was ${truth}`} · drawing next round…
        </Box>
      )}
    </Box>
  );
}

function EventSlot({
  event,
  revealYear,
  thumb,
  summary,
  label,
  tone,
}: {
  event: TimelineEvent;
  revealYear: boolean;
  thumb?: string;
  summary?: WikipediaSummary;
  label: string;
  tone?: "success" | "error";
}) {
  const cat = CATEGORY_BY_ID[event.category];
  const borderColor =
    tone === "success"
      ? "success.main"
      : tone === "error"
        ? "error.main"
        : "divider";
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 1,
        border: 1.5,
        borderColor,
        overflow: "hidden",
        backgroundColor: "background.paper",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          width: "100%",
          aspectRatio: "16 / 10",
          backgroundColor: "background.default",
          backgroundImage: thumb ? `url(${thumb})` : undefined,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          position: "relative",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {!thumb && cat?.Icon && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
              opacity: 0.5,
            }}
          >
            <cat.Icon size={44} strokeWidth={1.25} />
          </Box>
        )}
      </Box>
      <Box sx={{ p: 2 }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            fontFamily: "var(--font-mono), monospace",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            fontSize: 10,
            color: tone
              ? tone === "success"
                ? "success.main"
                : "error.main"
              : "text.secondary",
            mb: 0.5,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontFamily: "var(--font-display), serif",
            fontSize: 20,
            fontWeight: 500,
            lineHeight: 1.2,
            color: "text.primary",
          }}
        >
          {event.title}
        </Typography>
        <Typography
          sx={{
            mt: 1,
            fontFamily: "var(--font-numerals), serif",
            fontSize: 40,
            lineHeight: 1,
            color: revealYear ? "primary.main" : "text.secondary",
            letterSpacing: "-0.01em",
          }}
        >
          {revealYear ? formatYear(event.year) : "????"}
        </Typography>
        {cat?.Icon && (
          <Box
            sx={{
              mt: 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              color: "text.secondary",
            }}
          >
            <cat.Icon size={12} strokeWidth={1.5} />
            <Typography
              variant="caption"
              sx={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              {cat.name}
            </Typography>
          </Box>
        )}
        {revealYear && summary?.extract && (
          <Typography
            variant="caption"
            sx={{
              display: "-webkit-box",
              mt: 1,
              fontSize: 12,
              lineHeight: 1.45,
              color: "text.secondary",
              fontStyle: "italic",
              overflow: "hidden",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
            }}
          >
            {summary.extract}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

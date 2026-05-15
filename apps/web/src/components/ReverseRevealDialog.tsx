"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ExternalLink, X } from "lucide-react";
import { CATEGORY_BY_ID } from "@/game/data";
import { formatYear } from "./EventCard";
import type { TimelineEvent } from "@/game/types";
import { wikipediaPageUrl, type WikipediaSummary } from "@/wikipedia/api";

type Props = {
  open: boolean;
  event: TimelineEvent | null;
  thumbnail?: string;
  summary?: WikipediaSummary;
  onClose: () => void;
  ctaLabel?: string;
};

export default function ReverseRevealDialog({
  open,
  event,
  thumbnail,
  summary,
  onClose,
  ctaLabel = "Next round",
}: Props) {
  if (!event) return null;
  const cat = CATEGORY_BY_ID[event.category];
  const wikiUrl = wikipediaPageUrl(event.wikipediaTitle ?? event.title);
  const blurb = summary?.extract ?? event.related;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            fontFamily: "var(--font-mono), monospace",
            letterSpacing: "0.28em",
            color: "error.main",
            textTransform: "uppercase",
            fontSize: 10,
            mb: 0.5,
          }}
        >
          Misplaced · the answer was
        </Typography>
        <Typography
          sx={{
            fontFamily: "var(--font-display), serif",
            fontVariationSettings: '"opsz" 36',
            fontSize: 24,
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            color: "text.primary",
          }}
        >
          {event.title}
        </Typography>
        <IconButton
          onClick={onClose}
          aria-label="Close"
          size="small"
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color: "text.secondary",
          }}
        >
          <X size={16} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {thumbnail && (
            <Box
              sx={{
                width: "100%",
                aspectRatio: "16 / 9",
                backgroundImage: `url(${thumbnail})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundColor: "background.default",
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
              }}
            />
          )}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Typography
              sx={{
                fontFamily: "var(--font-numerals), serif",
                fontSize: 36,
                color: "primary.main",
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              {formatYear(event.year)}
            </Typography>
            {cat?.Icon && (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  ml: "auto",
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
          </Box>
          {blurb && (
            <Typography
              sx={{
                fontSize: 14,
                lineHeight: 1.55,
                color: "text.primary",
              }}
            >
              {blurb}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
        <Button
          href={wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<ExternalLink size={14} strokeWidth={1.5} />}
          sx={{ color: "text.secondary" }}
        >
          Wikipedia
        </Button>
        <Button variant="contained" onClick={onClose}>
          {ctaLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

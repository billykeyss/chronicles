"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChevronDown, ExternalLink, X } from "lucide-react";
import { CATEGORY_BY_ID } from "@/game/data";
import { formatYear } from "./EventCard";
import type { TimelineEvent } from "@/game/types";
import { wikipediaPageUrl, type WikipediaSummary } from "@/wikipedia/api";

type OtherChoice = {
  event: TimelineEvent;
  picked?: boolean;
  summary?: WikipediaSummary;
};

type Props = {
  open: boolean;
  event: TimelineEvent | null;
  thumbnail?: string;
  summary?: WikipediaSummary;
  others?: OtherChoice[];
  correct?: boolean;
  onClose: () => void;
  ctaLabel?: string;
};

export default function ReverseRevealDialog({
  open,
  event,
  thumbnail,
  summary,
  others,
  correct = false,
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
            color: correct ? "success.main" : "error.main",
            textTransform: "uppercase",
            fontSize: 10,
            mb: 0.5,
          }}
        >
          {correct ? "Correct · the answer was" : "Misplaced · the answer was"}
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
          {others && others.length > 0 && (
            <Box
              sx={{
                mt: 0.5,
                pt: 1.5,
                borderTop: 1,
                borderColor: "divider",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontFamily: "var(--font-mono), monospace",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "text.secondary",
                  fontSize: 10,
                  mb: 1,
                }}
              >
                The others
              </Typography>
              <Stack spacing={0.5}>
                {others.map((o) => (
                  <OtherRow key={o.event.id} choice={o} />
                ))}
              </Stack>
            </Box>
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

function OtherRow({ choice }: { choice: OtherChoice }) {
  const [open, setOpen] = useState(false);
  const blurb = choice.summary?.extract ?? choice.event.related;
  const hasBlurb = Boolean(blurb);

  return (
    <Box>
      <ButtonBase
        component="div"
        onClick={() => hasBlurb && setOpen((v) => !v)}
        disabled={!hasBlurb}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "baseline",
          gap: 1.5,
          py: 0.5,
          px: 0.5,
          borderRadius: 0.5,
          textAlign: "left",
          cursor: hasBlurb ? "pointer" : "default",
          transition: "background-color .15s",
          "&:hover": hasBlurb
            ? { backgroundColor: "action.hover" }
            : undefined,
        }}
        aria-expanded={hasBlurb ? open : undefined}
        aria-label={
          hasBlurb
            ? `${open ? "Collapse" : "Expand"} ${choice.event.title}`
            : undefined
        }
      >
        <Typography
          sx={{
            fontFamily: "var(--font-numerals), serif",
            fontSize: 18,
            lineHeight: 1,
            color: choice.picked ? "error.main" : "text.secondary",
            minWidth: 64,
            flexShrink: 0,
          }}
        >
          {formatYear(choice.event.year)}
        </Typography>
        <Typography
          sx={{
            flex: 1,
            fontSize: 14,
            lineHeight: 1.35,
            color: "text.primary",
            fontStyle: choice.picked ? "italic" : "normal",
          }}
        >
          {choice.event.title}
          {choice.picked && (
            <Typography
              component="span"
              variant="caption"
              sx={{
                ml: 1,
                fontFamily: "var(--font-mono), monospace",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "error.main",
                fontSize: 9,
              }}
            >
              your pick
            </Typography>
          )}
        </Typography>
        {hasBlurb && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              color: "text.secondary",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform .2s",
              flexShrink: 0,
            }}
          >
            <ChevronDown size={14} strokeWidth={1.5} />
          </Box>
        )}
      </ButtonBase>
      {hasBlurb && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Typography
            sx={{
              mt: 0.5,
              ml: "calc(64px + 12px)",
              mr: 0.5,
              fontSize: 13,
              lineHeight: 1.5,
              color: "text.secondary",
            }}
          >
            {blurb}
          </Typography>
        </Collapse>
      )}
    </Box>
  );
}

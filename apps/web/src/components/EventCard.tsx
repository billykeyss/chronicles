"use client";

import { useDroppable } from "@dnd-kit/core";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Check, ExternalLink, X } from "lucide-react";
import { CATEGORY_BY_ID } from "@/game/data";
import type { PlacedEvent } from "@/game/types";
import { firstSentence, wikipediaPageUrl, type WikipediaSummary } from "@/wikipedia/api";

export const ENTRY_HEIGHT = 108;
export const ENTRY_GAP = 12;
export const SHIFT_DISTANCE = ENTRY_HEIGHT + ENTRY_GAP;
export const YEAR_TAG_WIDTH = 64;
export const SPINE_GAP = 32;

type Props = {
  event: PlacedEvent;
  index: number;
  thumbnailUrl?: string;
  summary?: WikipediaSummary;
  insertIdx?: number | null;
};

export default function EventCard({
  event,
  index,
  thumbnailUrl,
  summary,
  insertIdx,
}: Props) {
  const cat = CATEGORY_BY_ID[event.category];
  const correct = event.correct;
  const wikiUrl = wikipediaPageUrl(event.wikipediaTitle ?? event.title);

  const { setNodeRef, isOver } = useDroppable({
    id: `placed-${event.id}`,
    data: { index, kind: "placed" },
  });

  const shifted = insertIdx !== null && insertIdx !== undefined && index >= insertIdx;

  // Status color tokens
  const accent = correct ? "success.main" : "error.main";
  const fact = summary?.extract ? firstSentence(summary.extract) : null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        position: "relative",
        transform: shifted ? `translateY(${SHIFT_DISTANCE}px)` : "translateY(0)",
        transition: "transform .28s cubic-bezier(.2, .8, .2, 1)",
      }}
    >
      {/* Year tag */}
      <Box
        sx={{
          width: YEAR_TAG_WIDTH,
          minWidth: YEAR_TAG_WIDTH,
          height: ENTRY_HEIGHT,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
          pr: 1.5,
        }}
      >
        <Typography
          sx={{
            color: "primary.main",
            fontFamily: 'var(--font-fraunces), serif',
            fontVariationSettings: '"opsz" 96',
            fontWeight: 400,
            fontSize: 18,
            lineHeight: 1,
            letterSpacing: "-0.01em",
          }}
        >
          {event.year}
        </Typography>
      </Box>

      {/* Spine (vertical line + status dot) */}
      <Box
        sx={{
          width: SPINE_GAP,
          minWidth: SPINE_GAP,
          height: ENTRY_HEIGHT,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "&::before": {
            content: '""',
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: "primary.dark",
            transform: "translateX(-50%)",
            opacity: 0.6,
          },
        }}
      >
        <Box
          sx={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            backgroundColor: correct ? "success.main" : "error.main",
            border: 2,
            borderColor: "background.default",
            boxShadow: correct
              ? "0 0 0 2px var(--mui-palette-success-main), 0 0 12px rgba(106,138,98,.4)"
              : "0 0 0 2px var(--mui-palette-error-main), 0 0 12px rgba(168,80,74,.4)",
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "background.default",
          }}
        >
          {correct ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
        </Box>
      </Box>

      {/* Card */}
      <Paper
        ref={setNodeRef}
        elevation={0}
        sx={{
          flex: 1,
          minWidth: 0,
          height: ENTRY_HEIGHT,
          display: "flex",
          alignItems: "stretch",
          backgroundColor: "background.paper",
          border: 1,
          borderColor: isOver ? "primary.main" : accent,
          borderLeft: `4px solid var(--mui-palette-${correct ? "success" : "error"}-main)`,
          borderRadius: 1,
          overflow: "hidden",
          transition: "border-color .15s, box-shadow .2s",
          boxShadow: isOver
            ? "0 8px 20px rgba(0,0,0,.30), 0 0 0 1px var(--mui-palette-primary-main)"
            : "none",
          "&:hover": { boxShadow: "0 6px 18px rgba(0,0,0,.22)" },
          "&:hover .card-image": {
            filter: "saturate(1.15) contrast(1.05)",
          },
        }}
      >
        <Box
          className="card-image"
          sx={{
            width: ENTRY_HEIGHT,
            minWidth: ENTRY_HEIGHT,
            backgroundColor: "background.default",
            backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRight: 1,
            borderColor: "divider",
            position: "relative",
            transition: "filter .2s",
          }}
        >
          {!thumbnailUrl && cat?.Icon && (
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
              <cat.Icon size={26} strokeWidth={1.25} />
            </Box>
          )}
        </Box>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: 1.5,
            py: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              lineHeight: 1.25,
              fontWeight: 500,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 1,
            }}
          >
            {event.title}
          </Typography>
          {fact && (
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontSize: 11.5,
                lineHeight: 1.35,
                mt: 0.5,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                fontStyle: "italic",
              }}
            >
              {fact}
            </Typography>
          )}
          <Box
            sx={{
              mt: "auto",
              pt: 0.75,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
              {cat?.Icon && (
                <cat.Icon
                  size={10}
                  strokeWidth={1.5}
                  color={correct ? "var(--mui-palette-text-secondary)" : "var(--mui-palette-error-main)"}
                />
              )}
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  color: correct ? "text.secondary" : "error.main",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {correct ? cat?.name : "Misplaced"}
              </Typography>
            </Box>
            <Tooltip title="Read on Wikipedia">
              <IconButton
                size="small"
                href={wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ p: 0.25, color: "text.secondary", "&:hover": { color: "primary.main" } }}
                aria-label={`Open ${event.title} on Wikipedia`}
              >
                <ExternalLink size={11} strokeWidth={1.5} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

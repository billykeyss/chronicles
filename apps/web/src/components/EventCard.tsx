"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Check, ChevronDown, ExternalLink, X, ZoomIn } from "lucide-react";
import { CATEGORY_BY_ID } from "@/game/data";
import type { PlacedEvent } from "@/game/types";
import { wikipediaPageUrl, type WikipediaSummary } from "@/wikipedia/api";

export const ENTRY_HEIGHT = 132;
export const ENTRY_IMAGE_WIDTH = 168;
export const ENTRY_GAP = 12;
export const SHIFT_DISTANCE = ENTRY_HEIGHT + ENTRY_GAP;
export const YEAR_TAG_WIDTH = 56;
export const SPINE_GAP = 22;
const DOT_SIZE = 14;

export function formatYear(y: number): string {
  if (y >= 0) return String(y);
  return `${Math.abs(y)} BC`;
}

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

  const shifted =
    insertIdx !== null && insertIdx !== undefined && index >= insertIdx;
  const [expanded, setExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const canExpand = Boolean(
    (summary?.extract && summary.extract.length > 40) || event.related,
  );
  const lightboxSrc = summary?.original?.url ?? thumbnailUrl;

  const accent = correct ? "success.main" : "error.main";
  const summaryText = summary?.extract ?? null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 0,
        position: "relative",
        transform: shifted
          ? `translateY(${SHIFT_DISTANCE}px)`
          : "translateY(0)",
        transition: "transform .28s cubic-bezier(.2, .8, .2, 1)",
      }}
    >
      <Box
        sx={{
          width: YEAR_TAG_WIDTH,
          minWidth: YEAR_TAG_WIDTH,
          height: ENTRY_HEIGHT,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          pl: 0,
          pr: 1,
        }}
      >
        <Typography
          sx={{
            color: "primary.main",
            fontFamily: "var(--font-display), serif",
            fontVariationSettings: '"opsz" 96',
            fontWeight: 400,
            fontSize: 18,
            lineHeight: 1,
            letterSpacing: "-0.015em",
            whiteSpace: "nowrap",
          }}
        >
          {formatYear(event.year)}
        </Typography>
      </Box>

      <Box
        sx={{
          width: SPINE_GAP,
          minWidth: SPINE_GAP,
          alignSelf: "stretch",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: ENTRY_HEIGHT,
          // Main vertical axis
          "&::before": {
            content: '""',
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 3,
            background: `linear-gradient(180deg,
              var(--mui-palette-primary-dark) 0%,
              var(--mui-palette-primary-main) 50%,
              var(--mui-palette-primary-dark) 100%)`,
            transform: "translateX(-50%)",
            opacity: 0.85,
            borderRadius: 2,
          },
        }}
      >
        <Box
          sx={{
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: "50%",
            backgroundColor: correct ? "success.main" : "error.main",
            border: 1.5,
            borderColor: "background.default",
            boxShadow: correct
              ? "0 0 0 1.5px var(--mui-palette-success-main), 0 0 10px rgba(106,138,98,.4)"
              : "0 0 0 1.5px var(--mui-palette-error-main), 0 0 10px rgba(168,80,74,.4)",
            position: "absolute",
            top: (ENTRY_HEIGHT - DOT_SIZE) / 2,
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "background.default",
          }}
        >
          {correct ? (
            <Check size={8} strokeWidth={3} />
          ) : (
            <X size={8} strokeWidth={3} />
          )}
        </Box>
      </Box>

      <Paper
        ref={setNodeRef}
        elevation={0}
        onClick={() => canExpand && setExpanded((v) => !v)}
        sx={{
          flex: 1,
          minWidth: 0,
          backgroundColor: "background.paper",
          border: 1,
          borderColor: isOver ? "primary.main" : accent,
          borderLeft: `4px solid var(--mui-palette-${correct ? "success" : "error"}-main)`,
          borderRadius: 1,
          overflow: "hidden",
          cursor: canExpand ? "pointer" : "default",
          transition: "border-color .15s, box-shadow .2s",
          boxShadow: isOver
            ? "0 8px 20px rgba(0,0,0,.30), 0 0 0 1px var(--mui-palette-primary-main)"
            : "none",
          "&:hover": { boxShadow: "0 6px 18px rgba(0,0,0,.22)" },
          "&:hover .card-image": {
            filter: "saturate(1.15) contrast(1.05)",
          },
        }}
        aria-expanded={canExpand ? expanded : undefined}
      >
        {/* Always-shown header row */}
        <Box
          sx={{ display: "flex", alignItems: "stretch", height: ENTRY_HEIGHT }}
        >
          <Box
            className="card-image"
            onClick={(e) => {
              if (!thumbnailUrl) return;
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            sx={{
              width: ENTRY_IMAGE_WIDTH,
              minWidth: ENTRY_IMAGE_WIDTH,
              backgroundColor: "background.default",
              backgroundImage: thumbnailUrl
                ? `url(${thumbnailUrl})`
                : undefined,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              borderRight: 1,
              borderColor: "divider",
              position: "relative",
              transition: "filter .2s",
              cursor: thumbnailUrl ? "zoom-in" : "default",
              "&:hover .zoom-hint": { opacity: 1 },
            }}
          >
            {thumbnailUrl && (
              <Box
                className="zoom-hint"
                sx={{
                  position: "absolute",
                  bottom: 6,
                  right: 6,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  backgroundColor: "rgba(10,10,20,0.65)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0,
                  transition: "opacity .15s",
                }}
                aria-hidden
              >
                <ZoomIn size={12} strokeWidth={1.75} />
              </Box>
            )}
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
                fontSize: 14.5,
                lineHeight: 1.25,
                fontWeight: 500,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
              }}
            >
              {event.title}
            </Typography>
            {summaryText && !expanded && (
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
                {summaryText}
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  minWidth: 0,
                }}
              >
                {cat?.Icon && (
                  <cat.Icon
                    size={10}
                    strokeWidth={1.5}
                    color={
                      correct
                        ? "var(--mui-palette-text-secondary)"
                        : "var(--mui-palette-error-main)"
                    }
                  />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 9,
                    letterSpacing: "0.18em",
                    color: correct ? "text.secondary" : "error.main",
                    textTransform: "uppercase",
                    lineHeight: 1.1,
                  }}
                >
                  {correct ? cat?.name : "Misplaced"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                <Tooltip title="Read on Wikipedia">
                  <IconButton
                    size="small"
                    href={wikiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      p: 0.25,
                      color: "text.secondary",
                      "&:hover": { color: "primary.main" },
                    }}
                    aria-label={`Open ${event.title} on Wikipedia`}
                  >
                    <ExternalLink size={11} strokeWidth={1.5} />
                  </IconButton>
                </Tooltip>
                {canExpand && (
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      color: "text.secondary",
                      transition: "transform .2s, color .15s",
                      transform: expanded ? "rotate(180deg)" : "rotate(0)",
                      p: 0.5,
                    }}
                  >
                    <ChevronDown size={14} strokeWidth={1.5} />
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
        {/* Expanded content */}
        {canExpand && (
          <Collapse in={expanded} timeout="auto">
            <Box
              sx={{
                px: 1.75,
                py: 1.5,
                borderTop: 1,
                borderColor: "divider",
                backgroundColor: "rgba(201, 168, 73, 0.02)",
              }}
            >
              {summary?.extract && (
                <Typography
                  sx={{
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: "text.primary",
                  }}
                >
                  {summary.extract}
                </Typography>
              )}
              {event.related && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1.25,
                    pt: 1,
                    borderTop: 1,
                    borderColor: "divider",
                    fontSize: 11,
                    letterSpacing: "0.04em",
                    color: "text.secondary",
                    fontStyle: "italic",
                  }}
                >
                  {event.related}
                </Typography>
              )}
            </Box>
          </Collapse>
        )}
      </Paper>
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "background.default",
              border: 0,
            },
          },
        }}
      >
        <Box
          onClick={() => setLightboxOpen(false)}
          sx={{
            cursor: "zoom-out",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 2, sm: 3 },
            gap: 1.5,
          }}
        >
          {lightboxSrc && (
            <Box
              component="img"
              src={lightboxSrc}
              alt={event.title}
              sx={{
                maxWidth: "100%",
                maxHeight: "75vh",
                objectFit: "contain",
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
                backgroundColor: "background.paper",
              }}
            />
          )}
          <Box sx={{ textAlign: "center" }}>
            <Typography
              sx={{
                fontFamily: "var(--font-display), serif",
                fontVariationSettings: '"opsz" 60',
                fontSize: 22,
                color: "text.primary",
              }}
            >
              {event.title}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 0.5,
                color: "text.secondary",
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {cat?.name} ·{" "}
              {event.year >= 0 ? event.year : `${Math.abs(event.year)} BC`}
            </Typography>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}

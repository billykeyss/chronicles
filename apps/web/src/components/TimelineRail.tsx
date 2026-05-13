"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ExternalLink } from "lucide-react";
import { CATEGORY_BY_ID } from "@/game/data";
import type { PlacedEvent } from "@/game/types";
import { wikipediaPageUrl, type WikipediaSummary } from "@/wikipedia/api";

const PLACEMENT_W = 200;
const CARD_H = 116;
const IMAGE_H = 72;
const SLOT_W = 28;
const RAIL_H = 384;
const AXIS_FROM_TOP = 192;
/** Approx height of the year typography line — used to center on axis. */
const YEAR_H = 22;
/** Length of the tick connecting card to year (which sits on the axis). */
const TICK_LEN = 36;
/** How far items shift right to open a gap when the user drags over a slot. */
const SHIFT_DISTANCE = PLACEMENT_W;
const SHIFT_TRANSITION =
  "transform .28s cubic-bezier(.2, .8, .2, 1)";

function formatYear(y: number): string {
  if (y >= 0) return String(y);
  return `${Math.abs(y)} BC`;
}

type Props = {
  timeline: PlacedEvent[];
  thumbnails?: Record<string, string | undefined>;
  summaries?: Record<string, WikipediaSummary | undefined>;
  insertIdx?: number | null;
  dragging?: boolean;
};

function Slot({
  index,
  dragging,
  active,
  shifted,
}: {
  index: number;
  dragging?: boolean;
  active: boolean;
  shifted: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `rail-slot-${index}`,
    data: { index, kind: "slot" },
  });
  const highlight = isOver || active;
  return (
    <Box
      ref={setNodeRef}
      sx={{
        width: SLOT_W,
        minWidth: SLOT_W,
        height: RAIL_H,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
        transform: shifted
          ? `translateX(${SHIFT_DISTANCE}px)`
          : "translateX(0)",
        transition: SHIFT_TRANSITION,
      }}
    >
      <Box
        sx={{
          height: "55%",
          width: highlight ? 2 : 1.5,
          backgroundColor: highlight ? "primary.main" : "divider",
          borderRadius: 1,
          opacity: highlight ? 1 : dragging ? 0.5 : 0,
          transition: "opacity .2s, background-color .15s, width .15s",
        }}
      />
      {highlight && (
        <Box
          sx={{
            position: "absolute",
            top: AXIS_FROM_TOP - 14,
            left: "50%",
            transform: "translateX(-50%)",
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: 1.5,
            borderColor: "primary.main",
            backgroundColor: "rgba(201, 168, 73, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "primary.main",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 13,
            fontWeight: 500,
            boxShadow: "0 0 0 4px rgba(201, 168, 73, 0.08)",
          }}
        >
          +
        </Box>
      )}
    </Box>
  );
}

function Placement({
  event,
  above,
  thumbnailUrl,
  summary,
  shifted,
}: {
  event: PlacedEvent;
  above: boolean;
  thumbnailUrl?: string;
  summary?: WikipediaSummary;
  shifted: boolean;
}) {
  const cat = CATEGORY_BY_ID[event.category];
  const correct = event.correct;
  const wikiUrl = wikipediaPageUrl(event.wikipediaTitle ?? event.title);
  const summaryText = summary?.extract ?? null;

  // Year sits centered on the axis line. Tick connects the card to the year.
  const yearTop = AXIS_FROM_TOP - YEAR_H / 2;
  const tickTop = above
    ? AXIS_FROM_TOP - YEAR_H / 2 - TICK_LEN
    : AXIS_FROM_TOP + YEAR_H / 2;
  const cardTop = above
    ? AXIS_FROM_TOP - YEAR_H / 2 - TICK_LEN - CARD_H
    : AXIS_FROM_TOP + YEAR_H / 2 + TICK_LEN;

  return (
    <Box
      sx={{
        width: PLACEMENT_W,
        minWidth: PLACEMENT_W,
        height: RAIL_H,
        position: "relative",
        zIndex: 1,
        transform: shifted
          ? `translateX(${SHIFT_DISTANCE}px)`
          : "translateX(0)",
        transition: SHIFT_TRANSITION,
      }}
    >
      {/* Card */}
      <Box
        sx={{
          position: "absolute",
          top: cardTop,
          left: 6,
          right: 6,
          height: CARD_H,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "background.paper",
            border: 1,
            borderColor: correct ? "success.main" : "error.main",
            borderTopWidth: above ? 1 : 3,
            borderBottomWidth: above ? 3 : 1,
            borderTopColor: above
              ? undefined
              : correct
                ? "success.main"
                : "error.main",
            borderBottomColor: above
              ? correct
                ? "success.main"
                : "error.main"
              : undefined,
            borderRadius: 1,
            overflow: "hidden",
            transition: "box-shadow .2s",
            "&:hover": { boxShadow: "0 6px 14px rgba(0,0,0,.18)" },
          }}
        >
          <Box
            sx={{
              height: IMAGE_H,
              backgroundColor: "background.default",
              backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : undefined,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              borderBottom: 1,
              borderColor: "divider",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!thumbnailUrl && cat?.Icon && (
              <Box sx={{ color: "text.secondary", opacity: 0.5 }}>
                <cat.Icon size={22} strokeWidth={1.25} />
              </Box>
            )}
          </Box>
          <Box
            sx={{
              px: 0.875,
              py: 0.625,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <Tooltip
              title={summaryText ?? event.title}
              placement={above ? "top" : "bottom"}
              enterDelay={400}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  lineHeight: 1.2,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                  cursor: "default",
                }}
              >
                {event.title}
              </Typography>
            </Tooltip>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                mt: "auto",
                pt: 0.25,
              }}
            >
              {cat?.Icon && (
                <cat.Icon
                  size={9}
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
                  fontSize: 8.5,
                  letterSpacing: "0.18em",
                  color: correct ? "text.secondary" : "error.main",
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {correct ? cat?.name : "Misplaced"}
              </Typography>
              <Tooltip title="Read on Wikipedia">
                <IconButton
                  size="small"
                  href={wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    p: 0.25,
                    color: "text.secondary",
                    "&:hover": { color: "primary.main" },
                  }}
                  aria-label={`Open ${event.title} on Wikipedia`}
                >
                  <ExternalLink size={10} strokeWidth={1.5} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Tick connecting card to year (year sits on the axis) */}
      <Box
        sx={{
          position: "absolute",
          top: tickTop,
          left: "50%",
          transform: "translateX(-50%)",
          width: 1,
          height: TICK_LEN,
          backgroundColor: "primary.main",
          opacity: 0.7,
          zIndex: 1,
        }}
      />

      {/* Year label — centered on the axis line, with a background pill that
          masks the axis behind the text so the line appears to pass behind it. */}
      <Box
        sx={{
          position: "absolute",
          top: yearTop,
          left: 0,
          right: 0,
          height: YEAR_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            backgroundColor: "background.default",
            px: 1,
            lineHeight: 1,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              color: correct ? "primary.main" : "error.main",
              fontFamily: "var(--font-display), serif",
              fontVariationSettings: '"opsz" 96',
              fontWeight: 400,
              fontSize: 18,
              lineHeight: 1,
              letterSpacing: "-0.015em",
            }}
          >
            {formatYear(event.year)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function TimelineRail({
  timeline,
  thumbnails,
  summaries,
  insertIdx,
  dragging,
}: Props) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        overflowX: "auto",
        overflowY: "hidden",
        // Faint inset shadow at edges to hint at scrollability
        "&::-webkit-scrollbar": { height: 8 },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          background: "var(--mui-palette-divider)",
          borderRadius: 4,
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "stretch",
          height: RAIL_H,
          minWidth: "min-content",
          px: 2,
          py: 1,
          // Reserve space on the right while dragging so the shifted items
          // don't get clipped past the scroll edge.
          pr: dragging ? `${SHIFT_DISTANCE + 16}px` : 2,
          transition: "padding-right .28s cubic-bezier(.2, .8, .2, 1)",
        }}
      >
        {/* Horizontal axis — spans the full track */}
        <Box
          sx={{
            position: "absolute",
            left: 16,
            right: 16,
            top: AXIS_FROM_TOP,
            height: "1px",
            backgroundColor: "primary.main",
            opacity: 0.55,
            zIndex: 0,
          }}
        />

        <Slot
          index={0}
          dragging={dragging}
          active={insertIdx === 0}
          shifted={false}
        />
        {timeline.map((event, i) => {
          const placementShifted =
            insertIdx !== null && insertIdx !== undefined && i >= insertIdx;
          const trailingSlotIndex = i + 1;
          const trailingSlotShifted =
            insertIdx !== null &&
            insertIdx !== undefined &&
            trailingSlotIndex > insertIdx;
          return (
            <React.Fragment key={event.id}>
              <Placement
                event={event}
                above={i % 2 === 0}
                thumbnailUrl={thumbnails?.[event.id]}
                summary={summaries?.[event.id]}
                shifted={placementShifted}
              />
              <Slot
                index={trailingSlotIndex}
                dragging={dragging}
                active={insertIdx === trailingSlotIndex}
                shifted={trailingSlotShifted}
              />
            </React.Fragment>
          );
        })}
      </Box>
    </Box>
  );
}

"use client";

import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
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

/** Layout mode for the rail. Stacked = evenly spaced cards; Spread = positioned by year. */
export enum TimelineLayout {
  Stacked = "stacked",
  Spread = "spread",
}

/** Spread mode can run along either axis. Stacked mode is horizontal only. */
export enum RailOrientation {
  Horizontal = "horizontal",
  Vertical = "vertical",
}

type Props = {
  timeline: PlacedEvent[];
  thumbnails?: Record<string, string | undefined>;
  summaries?: Record<string, WikipediaSummary | undefined>;
  insertIdx?: number | null;
  dragging?: boolean;
  layout?: TimelineLayout;
  orientation?: RailOrientation;
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
          width: highlight ? "2px" : "1.5px",
          backgroundColor: highlight ? "primary.main" : "divider",
          borderRadius: "1px",
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
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const canExpand = Boolean(summaryText || event.related);
  const open = Boolean(anchorEl);

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!canExpand) return;
    setAnchorEl((prev) => (prev ? null : (e.currentTarget as HTMLElement)));
  };

  // Year sits centered on the axis line via translateY(-50%) on its own
  // intrinsic height. Tick connects the card to the edge of the year pill.
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
          onClick={handleCardClick}
          aria-expanded={canExpand ? open : undefined}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "background.paper",
            border: 1,
            borderColor: open
              ? "primary.main"
              : correct
                ? "success.main"
                : "error.main",
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
            cursor: canExpand ? "pointer" : "default",
            transition: "box-shadow .2s, border-color .15s",
            boxShadow: open ? "0 6px 14px rgba(0,0,0,.18)" : "none",
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
                  onClick={(e) => e.stopPropagation()}
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
          width: "1px",
          height: `${TICK_LEN}px`,
          backgroundColor: "primary.main",
          opacity: 0.7,
          zIndex: 1,
        }}
      />

      {/* Year label — anchored at the axis line, then shifted up 50% of its
          own intrinsic height so the digits sit centered on the line. */}
      <Box
        sx={{
          position: "absolute",
          top: AXIS_FROM_TOP,
          left: 0,
          right: 0,
          textAlign: "center",
          transform: "translateY(-50%)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        <Typography
          component="span"
          sx={{
            display: "inline-block",
            backgroundColor: "background.default",
            px: 0.875,
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

      {/* Expand-on-click — popover anchored to the card showing the full
          Wikipedia summary and the related sentence. */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: above ? "top" : "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: above ? "bottom" : "top",
          horizontal: "center",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 520,
              maxWidth: "calc(100vw - 32px)",
              p: 3,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              boxShadow: "0 14px 36px rgba(0,0,0,.18)",
            },
          },
        }}
      >
        <Stack spacing={2}>
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              {formatYear(event.year)} · {cat?.name ?? ""}
              {!correct && " · Misplaced"}
            </Typography>
            <Typography
              sx={{
                fontFamily: "var(--font-display), serif",
                fontVariationSettings: '"opsz" 60',
                fontSize: 22,
                fontWeight: 400,
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
                mt: 0.5,
              }}
            >
              {event.title}
            </Typography>
          </Box>
          {thumbnailUrl && (
            <Box
              sx={{
                height: 160,
                backgroundColor: "background.default",
                backgroundImage: `url(${thumbnailUrl})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
              }}
            />
          )}
          {summaryText && (
            <Typography sx={{ fontSize: 13, lineHeight: 1.55 }}>
              {summaryText}
            </Typography>
          )}
          {event.related && (
            <Typography
              sx={{
                fontSize: 12,
                fontStyle: "italic",
                color: "text.secondary",
                pt: 1,
                borderTop: 1,
                borderColor: "divider",
              }}
            >
              {event.related}
            </Typography>
          )}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              pt: 0.5,
            }}
          >
            <IconButton
              size="small"
              href={wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: "text.secondary",
                "&:hover": { color: "primary.main" },
              }}
              aria-label={`Open ${event.title} on Wikipedia`}
            >
              <ExternalLink size={14} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Stack>
      </Popover>
    </Box>
  );
}

/* ----------------------- Scale mode ----------------------- */

const SCALE_TRACK_MIN_W = 1100;
const SCALE_TRACK_MAX_W = 3200;
const SCALE_PX_PER_YEAR = 3;
const SCALE_EDGE_PAD = 32;

function ScaleSlot({
  index,
  left,
  width,
  dragging,
  active,
}: {
  index: number;
  /** Left offset as a CSS length (e.g. "12%" or `${px}px`). */
  left: string;
  /** Width as a CSS length. */
  width: string;
  dragging?: boolean;
  active: boolean;
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
        position: "absolute",
        left,
        top: 0,
        width,
        height: RAIL_H,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
      }}
    >
      <Box
        sx={{
          height: "55%",
          width: highlight ? "2px" : "1.5px",
          backgroundColor: highlight ? "primary.main" : "divider",
          borderRadius: "1px",
          opacity: highlight ? 1 : dragging ? 0.35 : 0,
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

function ScaleRail({
  timeline,
  thumbnails,
  summaries,
  insertIdx,
  dragging,
}: Required<Pick<Props, "timeline">> & Props) {
  const minYear = Math.min(...timeline.map((e) => e.year));
  const maxYear = Math.max(...timeline.map((e) => e.year));
  const rangeRaw = Math.max(maxYear - minYear, 1);
  // Pad the year range so first/last events sit comfortably away from the edges.
  const pad = Math.max(rangeRaw * 0.08, 5);
  const paddedMin = minYear - pad;
  const paddedMax = maxYear + pad;
  const paddedRange = paddedMax - paddedMin;

  // Map year → percentage position within the rail, with 6% inset on each side
  // so 200px-wide cards centred on the position don't clip at the container edge
  // on viewports ~1100px+.
  const EDGE_PCT = 6;
  const INNER_PCT = 100 - EDGE_PCT * 2;
  const yearToPctNum = (year: number): number => {
    const fraction = (year - paddedMin) / paddedRange;
    return EDGE_PCT + fraction * INNER_PCT;
  };
  const yearToPct = (year: number): string => `${yearToPctNum(year)}%`;

  // Century / decade tick marks along the axis. Step adapts to range.
  const tickStep =
    paddedRange > 2000
      ? 500
      : paddedRange > 500
        ? 100
        : paddedRange > 100
          ? 50
          : 25;
  const firstTick = Math.ceil(paddedMin / tickStep) * tickStep;
  const tickMarks: number[] = [];
  for (let y = firstTick; y <= paddedMax; y += tickStep) tickMarks.push(y);

  // Drop zones between consecutive events, sized by year proportion.
  const slotPcts: { index: number; leftPct: number; widthPct: number }[] = [];
  for (let i = 0; i <= timeline.length; i++) {
    const leftPct =
      i === 0 ? 0 : yearToPctNum(timeline[i - 1].year);
    const rightPct =
      i === timeline.length ? 100 : yearToPctNum(timeline[i].year);
    slotPcts.push({
      index: i,
      leftPct,
      widthPct: rightPct - leftPct,
    });
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: RAIL_H,
        }}
      >
        {/* Axis line */}
        <Box
          sx={{
            position: "absolute",
            left: `${EDGE_PCT}%`,
            right: `${EDGE_PCT}%`,
            top: AXIS_FROM_TOP,
            height: "1px",
            backgroundColor: "primary.main",
            opacity: 0.55,
            zIndex: 0,
          }}
        />

        {/* Decade / century tick marks */}
        {tickMarks.map((yr) => (
          <Box
            key={`tick-${yr}`}
            sx={{
              position: "absolute",
              left: yearToPct(yr),
              top: AXIS_FROM_TOP - 5,
              height: 10,
              width: "1px",
              backgroundColor: "primary.main",
              opacity: 0.35,
              zIndex: 0,
            }}
          />
        ))}
        {/* Tick labels — auto-thin when crowded */}
        {tickMarks.map((yr, i) => (
          <Box
            key={`label-${yr}`}
            sx={{
              position: "absolute",
              left: yearToPct(yr),
              top: AXIS_FROM_TOP + 12,
              transform: "translateX(-50%)",
              opacity: tickMarks.length > 24 && i % 2 === 1 ? 0 : 0.45,
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            <Typography
              sx={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 9,
                letterSpacing: "0.16em",
                color: "text.secondary",
              }}
            >
              {yr}
            </Typography>
          </Box>
        ))}

        {/* Slots — variable-width zones between consecutive events */}
        {slotPcts.map((slot) => (
          <ScaleSlot
            key={`slot-${slot.index}`}
            index={slot.index}
            left={`${slot.leftPct}%`}
            width={`${slot.widthPct}%`}
            dragging={dragging}
            active={insertIdx === slot.index}
          />
        ))}

        {/* Placements positioned absolutely by year */}
        {timeline.map((event, i) => {
          return (
            <Box
              key={event.id}
              sx={{
                position: "absolute",
                left: yearToPct(event.year),
                transform: "translateX(-50%)",
                top: 0,
                width: PLACEMENT_W,
                height: RAIL_H,
              }}
            >
              <Placement
                event={event}
                above={i % 2 === 0}
                thumbnailUrl={thumbnails?.[event.id]}
                summary={summaries?.[event.id]}
                shifted={false}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/* ----------------------- Even-spacing mode (current) ----------------------- */

function EvenRail({
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
          width: "fit-content",
          minWidth: "min-content",
          mx: "auto",
          px: 2,
          py: 1,
          pr: dragging ? `${SHIFT_DISTANCE + 16}px` : 2,
          transition: "padding-right .28s cubic-bezier(.2, .8, .2, 1)",
        }}
      >
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

/* ----------------------- Vertical spread mode (mobile) ----------------------- */

const V_RAIL_H = 560;
const V_CARD_W = 132;
const V_CARD_H = 84;
const V_IMAGE_H = 52;
const V_TICK_LEN = 18;
const V_YEAR_PAD_X = 6; // px — horizontal padding inside year pill (mask)

function ScaleSlotVertical({
  index,
  top,
  height,
  dragging,
  active,
}: {
  index: number;
  top: string;
  height: string;
  dragging?: boolean;
  active: boolean;
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
        position: "absolute",
        top,
        left: 0,
        right: 0,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
      }}
    >
      <Box
        sx={{
          width: "44%",
          height: highlight ? "2px" : "1.5px",
          backgroundColor: highlight ? "primary.main" : "divider",
          borderRadius: "1px",
          opacity: highlight ? 1 : dragging ? 0.35 : 0,
          transition: "opacity .2s, background-color .15s, height .15s",
        }}
      />
      {highlight && (
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: 1.5,
            borderColor: "primary.main",
            backgroundColor: "rgba(201, 168, 73, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "primary.main",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
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

function PlacementVertical({
  event,
  side,
  topPct,
  thumbnailUrl,
  summary,
}: {
  event: PlacedEvent;
  side: "left" | "right";
  topPct: string;
  thumbnailUrl?: string;
  summary?: WikipediaSummary;
}) {
  const cat = CATEGORY_BY_ID[event.category];
  const correct = event.correct;
  const wikiUrl = wikipediaPageUrl(event.wikipediaTitle ?? event.title);
  const summaryText = summary?.extract ?? null;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const canExpand = Boolean(summaryText || event.related);
  const open = Boolean(anchorEl);

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!canExpand) return;
    setAnchorEl((prev) => (prev ? null : (e.currentTarget as HTMLElement)));
  };

  // Card sits to its side of the central axis, with a horizontal tick
  // bridging from card edge to the year pill on the axis.
  const cardPosition =
    side === "left"
      ? {
          right: `calc(50% + ${V_TICK_LEN}px)`,
        }
      : {
          left: `calc(50% + ${V_TICK_LEN}px)`,
        };
  const tickPosition =
    side === "left"
      ? { right: "50%", width: V_TICK_LEN }
      : { left: "50%", width: V_TICK_LEN };

  return (
    <>
      {/* Tick connecting card to year on axis */}
      <Box
        sx={{
          position: "absolute",
          top: topPct,
          ...tickPosition,
          height: "1px",
          backgroundColor: "primary.main",
          opacity: 0.7,
          transform: "translateY(-50%)",
          zIndex: 1,
        }}
      />

      {/* Card */}
      <Box
        sx={{
          position: "absolute",
          top: topPct,
          ...cardPosition,
          width: V_CARD_W,
          height: V_CARD_H,
          transform: "translateY(-50%)",
          zIndex: 1,
        }}
      >
        <Paper
          elevation={0}
          onClick={handleCardClick}
          aria-expanded={canExpand ? open : undefined}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "background.paper",
            border: 1,
            borderColor: open
              ? "primary.main"
              : correct
                ? "success.main"
                : "error.main",
            borderLeftWidth: side === "right" ? 3 : 1,
            borderRightWidth: side === "left" ? 3 : 1,
            borderRadius: 1,
            overflow: "hidden",
            cursor: canExpand ? "pointer" : "default",
            transition: "box-shadow .2s, border-color .15s",
            boxShadow: open ? "0 4px 12px rgba(0,0,0,.15)" : "none",
            "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,.15)" },
          }}
        >
          <Box
            sx={{
              height: V_IMAGE_H,
              backgroundColor: "background.default",
              backgroundImage: thumbnailUrl
                ? `url(${thumbnailUrl})`
                : undefined,
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
                <cat.Icon size={18} strokeWidth={1.25} />
              </Box>
            )}
          </Box>
          <Box
            sx={{
              px: 0.75,
              py: 0.5,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: 10.5,
                fontWeight: 500,
                lineHeight: 1.2,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
              }}
            >
              {event.title}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                mt: "auto",
                fontFamily: "var(--font-mono), monospace",
                fontSize: 8,
                letterSpacing: "0.18em",
                color: correct ? "text.secondary" : "error.main",
                textTransform: "uppercase",
                lineHeight: 1.1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {correct ? cat?.name : "Misplaced"}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Year pill — sits centered on the axis at the card's Y */}
      <Box
        sx={{
          position: "absolute",
          top: topPct,
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        <Typography
          component="span"
          sx={{
            display: "inline-block",
            backgroundColor: "background.default",
            px: `${V_YEAR_PAD_X}px`,
            color: correct ? "primary.main" : "error.main",
            fontFamily: "var(--font-display), serif",
            fontVariationSettings: '"opsz" 96',
            fontWeight: 400,
            fontSize: 14,
            lineHeight: 1,
            letterSpacing: "-0.015em",
          }}
        >
          {formatYear(event.year)}
        </Typography>
      </Box>

      {/* Click-to-expand popover, anchored to the card */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "center",
          horizontal: side === "left" ? "left" : "right",
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: side === "left" ? "right" : "left",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 320,
              maxWidth: "calc(100vw - 32px)",
              p: 2,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              boxShadow: "0 14px 36px rgba(0,0,0,.18)",
            },
          },
        }}
      >
        <Stack spacing={1.5}>
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              {formatYear(event.year)} · {cat?.name ?? ""}
              {!correct && " · Misplaced"}
            </Typography>
            <Typography
              sx={{
                fontFamily: "var(--font-display), serif",
                fontVariationSettings: '"opsz" 60',
                fontSize: 20,
                fontWeight: 400,
                lineHeight: 1.2,
                mt: 0.5,
              }}
            >
              {event.title}
            </Typography>
          </Box>
          {thumbnailUrl && (
            <Box
              sx={{
                height: 140,
                backgroundColor: "background.default",
                backgroundImage: `url(${thumbnailUrl})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
              }}
            />
          )}
          {summaryText && (
            <Typography sx={{ fontSize: 13, lineHeight: 1.55 }}>
              {summaryText}
            </Typography>
          )}
          {event.related && (
            <Typography
              sx={{
                fontSize: 12,
                fontStyle: "italic",
                color: "text.secondary",
                pt: 1,
                borderTop: 1,
                borderColor: "divider",
              }}
            >
              {event.related}
            </Typography>
          )}
          <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 0.5 }}>
            <IconButton
              size="small"
              href={wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: "text.secondary",
                "&:hover": { color: "primary.main" },
              }}
              aria-label={`Open ${event.title} on Wikipedia`}
            >
              <ExternalLink size={14} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Stack>
      </Popover>
    </>
  );
}

function ScaleRailVertical({
  timeline,
  thumbnails,
  summaries,
  insertIdx,
  dragging,
}: Required<Pick<Props, "timeline">> & Props) {
  const minYear = Math.min(...timeline.map((e) => e.year));
  const maxYear = Math.max(...timeline.map((e) => e.year));
  const rangeRaw = Math.max(maxYear - minYear, 1);
  const pad = Math.max(rangeRaw * 0.08, 5);
  const paddedMin = minYear - pad;
  const paddedMax = maxYear + pad;
  const paddedRange = paddedMax - paddedMin;

  // Pad the vertical viewport so cards near min/max don't get clipped.
  const EDGE_PCT = 6;
  const INNER_PCT = 100 - EDGE_PCT * 2;
  const yearToPctNum = (year: number): number => {
    const fraction = (year - paddedMin) / paddedRange;
    return EDGE_PCT + fraction * INNER_PCT;
  };
  const yearToPct = (year: number): string => `${yearToPctNum(year)}%`;

  const tickStep =
    paddedRange > 2000
      ? 500
      : paddedRange > 500
        ? 100
        : paddedRange > 100
          ? 50
          : 25;
  const firstTick = Math.ceil(paddedMin / tickStep) * tickStep;
  const tickMarks: number[] = [];
  for (let y = firstTick; y <= paddedMax; y += tickStep) tickMarks.push(y);

  const slotPcts: { index: number; topPct: number; heightPct: number }[] = [];
  for (let i = 0; i <= timeline.length; i++) {
    const topPct = i === 0 ? 0 : yearToPctNum(timeline[i - 1].year);
    const bottomPct =
      i === timeline.length ? 100 : yearToPctNum(timeline[i].year);
    slotPcts.push({ index: i, topPct, heightPct: bottomPct - topPct });
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: V_RAIL_H,
        overflow: "hidden",
      }}
    >
      {/* Vertical axis */}
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: `${EDGE_PCT}%`,
          bottom: `${EDGE_PCT}%`,
          width: "1px",
          backgroundColor: "primary.main",
          opacity: 0.55,
          transform: "translateX(-50%)",
          zIndex: 0,
        }}
      />

      {/* Tick marks (small horizontal segments across axis) */}
      {tickMarks.map((yr) => (
        <Box
          key={`tick-${yr}`}
          sx={{
            position: "absolute",
            top: yearToPct(yr),
            left: "50%",
            width: 10,
            height: "1px",
            backgroundColor: "primary.main",
            opacity: 0.35,
            transform: "translate(-50%, -50%)",
            zIndex: 0,
          }}
        />
      ))}

      {/* Tick labels — offset to the side of axis */}
      {tickMarks.map((yr, i) => (
        <Box
          key={`label-${yr}`}
          sx={{
            position: "absolute",
            top: yearToPct(yr),
            // Offset alternates left/right so labels don't fight with placements
            left: "calc(50% + 14px)",
            transform: "translateY(-50%)",
            opacity: tickMarks.length > 16 && i % 2 === 1 ? 0 : 0.4,
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          <Typography
            sx={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 9,
              letterSpacing: "0.16em",
              color: "text.secondary",
            }}
          >
            {yr}
          </Typography>
        </Box>
      ))}

      {/* Slots */}
      {slotPcts.map((slot) => (
        <ScaleSlotVertical
          key={`slot-${slot.index}`}
          index={slot.index}
          top={`${slot.topPct}%`}
          height={`${slot.heightPct}%`}
          dragging={dragging}
          active={insertIdx === slot.index}
        />
      ))}

      {/* Placements alternate left/right by index */}
      {timeline.map((event, i) => (
        <PlacementVertical
          key={event.id}
          event={event}
          side={i % 2 === 0 ? "left" : "right"}
          topPct={yearToPct(event.year)}
          thumbnailUrl={thumbnails?.[event.id]}
          summary={summaries?.[event.id]}
        />
      ))}
    </Box>
  );
}

export default function TimelineRail(props: Props) {
  if (
    props.layout === TimelineLayout.Spread &&
    props.timeline.length > 0
  ) {
    if (props.orientation === RailOrientation.Vertical) {
      return <ScaleRailVertical {...props} />;
    }
    return <ScaleRail {...props} />;
  }
  return <EvenRail {...props} />;
}

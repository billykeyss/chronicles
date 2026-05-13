"use client";

import { useDroppable } from "@dnd-kit/core";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EventCard, {
  ENTRY_GAP,
  ENTRY_HEIGHT,
  SHIFT_DISTANCE,
  SPINE_GAP,
  YEAR_TAG_WIDTH,
} from "./EventCard";
import type { PlacedEvent } from "@/game/types";
import type { WikipediaSummary } from "@/wikipedia/api";

type Props = {
  timeline: PlacedEvent[];
  thumbnails?: Record<string, string | undefined>;
  summaries?: Record<string, WikipediaSummary | undefined>;
  insertIdx?: number | null;
  dragging?: boolean;
};

export default function Timeline({
  timeline,
  thumbnails,
  summaries,
  insertIdx,
  dragging,
}: Props) {
  const { setNodeRef: setStartRef, isOver: startIsOver } = useDroppable({
    id: "placed-start",
    data: { index: 0, kind: "start" },
  });
  const { setNodeRef: setEndRef, isOver: endIsOver } = useDroppable({
    id: "placed-end",
    data: { index: timeline.length, kind: "end" },
  });
  const insertAtStart = insertIdx === 0;
  const insertAtEnd = insertIdx === timeline.length;

  return (
    <Box sx={{ position: "relative", py: 1 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: `${ENTRY_GAP}px`,
        }}
      >
        {/* Leading drop zone — appears above the first card while dragging */}
        <Box
          ref={setStartRef}
          sx={{
            display: "flex",
            alignItems: "center",
            pl: `${YEAR_TAG_WIDTH + SPINE_GAP}px`,
            height: insertAtStart ? ENTRY_HEIGHT : 24,
            transition: "height .28s cubic-bezier(.2, .8, .2, 1), opacity .15s",
            opacity: dragging || insertAtStart ? 1 : 0.001,
            mb: insertAtStart ? `-${ENTRY_HEIGHT - 24}px` : 0,
            transform: insertAtStart
              ? `translateY(-${SHIFT_DISTANCE - ENTRY_HEIGHT}px)`
              : "translateY(0)",
          }}
        >
          <Box
            sx={{
              flex: 1,
              height: insertAtStart ? ENTRY_HEIGHT : 1,
              border: 1.5,
              borderStyle: "dashed",
              borderColor: insertAtStart
                ? "primary.main"
                : startIsOver
                  ? "primary.main"
                  : "divider",
              borderRadius: 1,
              backgroundColor: insertAtStart
                ? "rgba(201, 168, 73, 0.08)"
                : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all .2s",
            }}
          >
            {insertAtStart && (
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: "primary.main",
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                Drop here · before {timeline[0]?.year ?? ""}
              </Typography>
            )}
          </Box>
        </Box>

        {timeline.map((event, i) => (
          <EventCard
            key={event.id}
            event={event}
            index={i}
            thumbnailUrl={thumbnails?.[event.id]}
            summary={summaries?.[event.id]}
            insertIdx={insertIdx}
          />
        ))}

        {/* Trailing drop zone */}
        <Box
          ref={setEndRef}
          sx={{
            display: "flex",
            alignItems: "center",
            pl: `${YEAR_TAG_WIDTH + SPINE_GAP}px`,
            height: insertAtEnd ? ENTRY_HEIGHT : 24,
            transform: insertAtEnd
              ? `translateY(${SHIFT_DISTANCE - ENTRY_HEIGHT}px)`
              : "translateY(0)",
            transition: "height .28s cubic-bezier(.2, .8, .2, 1), opacity .15s, transform .28s",
            opacity: dragging || insertAtEnd ? 1 : 0.001,
          }}
        >
          <Box
            sx={{
              flex: 1,
              height: insertAtEnd ? ENTRY_HEIGHT : 1,
              border: 1.5,
              borderStyle: "dashed",
              borderColor: insertAtEnd
                ? "primary.main"
                : endIsOver
                  ? "primary.main"
                  : "divider",
              borderRadius: 1,
              backgroundColor: insertAtEnd
                ? "rgba(201, 168, 73, 0.08)"
                : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all .2s",
            }}
          >
            {insertAtEnd && (
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: "primary.main",
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                Drop here · after {timeline[timeline.length - 1]?.year ?? ""}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

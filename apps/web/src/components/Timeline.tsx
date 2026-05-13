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
  const { setNodeRef: setEndRef, isOver: endIsOver } = useDroppable({
    id: "placed-end",
    data: { index: timeline.length, kind: "end" },
  });
  const insertAtEnd = insertIdx === timeline.length;

  return (
    <Box
      sx={{
        position: "relative",
        py: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: `${ENTRY_GAP}px`,
        }}
      >
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
        <Box
          ref={setEndRef}
          sx={{
            display: "flex",
            alignItems: "center",
            // Leave room for the spine column on the left so the drop zone
            // aligns with the entries above.
            pl: `${YEAR_TAG_WIDTH + SPINE_GAP}px`,
            height: insertAtEnd ? ENTRY_HEIGHT : 24,
            transform: insertAtEnd
              ? `translateY(${SHIFT_DISTANCE - ENTRY_HEIGHT}px)`
              : "translateY(0)",
            transition:
              "height .28s cubic-bezier(.2, .8, .2, 1), opacity .15s, transform .28s",
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
                ? "rgba(201, 168, 73, 0.06)"
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
                Drop here
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

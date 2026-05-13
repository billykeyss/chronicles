"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { GripVertical, Lightbulb } from "lucide-react";
import { keyframes } from "@mui/material/styles";
import { CATEGORY_BY_ID } from "@/game/data";
import type { HintReveal, HintType, TimelineEvent } from "@/game/types";

const bob = keyframes`
  0%, 100% { transform: translate(-50%, 0); }
  50% { transform: translate(-50%, -3px); }
`;

const ENTRY_HEIGHT = 84;

/**
 * Bottom-pinned draw card. Acts as the drag source: user drags it UPWARD
 * into the vertical timeline above. Hint reveal + button are shown above
 * the card row when needed.
 */
export function NowDrawingPanel({
  event,
  thumbnailUrl,
  hintReveal,
  hintUsed,
  hintsRemaining,
  onOpenHint,
}: {
  event: TimelineEvent;
  thumbnailUrl?: string;
  hintReveal: HintReveal | null;
  hintUsed: HintType | null;
  hintsRemaining: number;
  onOpenHint: () => void;
}) {
  const cat = CATEGORY_BY_ID[event.category];
  const canHint = hintsRemaining > 0 && hintUsed === null;

  const { setNodeRef, transform, listeners, attributes, isDragging } = useDraggable({
    id: event.id,
    data: { kind: "current" },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    touchAction: "none",
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          maxWidth: 720,
          mx: "auto",
          px: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 3 },
          pt: 3,
          background:
            "linear-gradient(to top, var(--mui-palette-background-default) 60%, transparent)",
          pointerEvents: "auto",
        }}
      >
        {hintReveal && (
          <Box
            sx={{
              mb: 1.5,
              px: 1.5,
              py: 1,
              borderLeft: 2,
              borderColor: "primary.main",
              backgroundColor: "rgba(201, 168, 73, 0.06)",
              borderRadius: "0 4px 4px 0",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
              <Lightbulb size={11} strokeWidth={1.5} color="var(--mui-palette-primary-main)" />
              <Typography
                variant="caption"
                sx={{
                  color: "primary.main",
                  fontFamily: 'var(--font-jetbrains), monospace',
                  textTransform: "uppercase",
                  letterSpacing: "0.26em",
                  fontSize: 9,
                }}
              >
                {hintReveal.type} hint
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 13, lineHeight: 1.4 }}>
              {hintReveal.content}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "stretch",
            gap: 1.25,
          }}
        >
          {!isDragging && (
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                left: "50%",
                top: -22,
                color: "primary.main",
                fontSize: 18,
                animation: `${bob} 1.4s ease-in-out infinite`,
                pointerEvents: "none",
                fontFamily: 'var(--font-fraunces), serif',
                fontWeight: 300,
              }}
            >
              ↑
            </Box>
          )}

          <Paper
            ref={setNodeRef}
            elevation={0}
            style={style}
            {...attributes}
            {...listeners}
            sx={{
              flex: 1,
              minWidth: 0,
              height: ENTRY_HEIGHT,
              display: "flex",
              alignItems: "stretch",
              backgroundColor: "background.paper",
              border: 1.5,
              borderColor: "primary.main",
              borderRadius: 1,
              overflow: "hidden",
              cursor: "grab",
              userSelect: "none",
              opacity: isDragging ? 0 : 1,
              boxShadow: "0 12px 32px rgba(0,0,0,.35), 0 0 0 1px rgba(201,168,73,.2)",
              transition: "box-shadow .2s, opacity .15s",
              "&:active": { cursor: "grabbing" },
              "&:hover": {
                boxShadow:
                  "0 18px 40px rgba(0,0,0,.45), 0 0 0 2px var(--mui-palette-primary-main)",
              },
            }}
          >
            <Box
              sx={{
                width: ENTRY_HEIGHT,
                minWidth: ENTRY_HEIGHT,
                backgroundColor: "background.default",
                backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRight: 1,
                borderColor: "primary.main",
                position: "relative",
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
                    color: "primary.main",
                    opacity: 0.45,
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
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
                <Box sx={{ color: "primary.main", display: "inline-flex" }}>
                  <GripVertical size={11} strokeWidth={1.5} />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "primary.main",
                    fontFamily: 'var(--font-jetbrains), monospace',
                    fontSize: 9,
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                  }}
                >
                  Drag up to place
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: 14,
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 0.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {cat?.Icon && (
                    <cat.Icon
                      size={10}
                      strokeWidth={1.5}
                      color="var(--mui-palette-text-secondary)"
                    />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'var(--font-jetbrains), monospace',
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      color: "text.secondary",
                      textTransform: "uppercase",
                    }}
                  >
                    {cat?.name}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontVariationSettings: '"opsz" 144',
                    fontWeight: 300,
                    fontSize: 22,
                    color: "primary.main",
                    lineHeight: 1,
                    letterSpacing: "0.02em",
                    opacity: 0.55,
                  }}
                >
                  ????
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Button
            onClick={onOpenHint}
            disabled={!canHint}
            variant="outlined"
            sx={{
              minWidth: 56,
              minHeight: ENTRY_HEIGHT,
              paddingInline: 1,
              flexDirection: "column",
              gap: 0.5,
              flexShrink: 0,
            }}
            aria-label="Use a hint"
          >
            <Lightbulb size={18} strokeWidth={1.5} />
            <Box component="span" sx={{ fontSize: 9, letterSpacing: "0.18em" }}>
              {hintUsed ? "Used" : "Hint"}
            </Box>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

/** Floating preview rendered inside the DragOverlay; follows the cursor. */
export function CurrentCardPreview({
  event,
  thumbnailUrl,
}: {
  event: TimelineEvent;
  thumbnailUrl?: string;
}) {
  const cat = CATEGORY_BY_ID[event.category];
  return (
    <Paper
      elevation={0}
      sx={{
        height: ENTRY_HEIGHT,
        display: "flex",
        alignItems: "stretch",
        backgroundColor: "background.paper",
        border: 1.5,
        borderColor: "primary.main",
        borderRadius: 1,
        boxShadow: "0 24px 48px rgba(0,0,0,.5), 0 0 0 1px var(--mui-palette-primary-main)",
        overflow: "hidden",
        pointerEvents: "none",
        transform: "rotate(-1deg)",
        minWidth: 280,
        maxWidth: 360,
      }}
    >
      <Box
        sx={{
          width: ENTRY_HEIGHT,
          minWidth: ENTRY_HEIGHT,
          backgroundColor: "background.default",
          backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRight: 1,
          borderColor: "primary.main",
        }}
      />
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: 1.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "primary.main",
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 9,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
          }}
        >
          Now placing
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
          {cat?.Icon && (
            <cat.Icon size={10} strokeWidth={1.5} color="var(--mui-palette-text-secondary)" />
          )}
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'var(--font-jetbrains), monospace',
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "text.secondary",
              textTransform: "uppercase",
            }}
          >
            {cat?.name}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

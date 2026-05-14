"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Dialog from "@mui/material/Dialog";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { GripVertical, Lightbulb, ZoomIn } from "lucide-react";
import { CATEGORY_BY_ID } from "@/game/data";
import type { HintReveal, HintType, TimelineEvent } from "@/game/types";

const PANEL_HEIGHT = 76;

/**
 * Compact draw card panel. Sits inside a sticky top bar in the page layout
 * (the page is responsible for stickiness). Drag the card downward into
 * the timeline below.
 */
export function NowDrawingPanel({
  event,
  thumbnailUrl,
  originalUrl,
  hintReveal,
  hintUsed,
  onOpenHint,
}: {
  event: TimelineEvent;
  thumbnailUrl?: string;
  originalUrl?: string;
  hintReveal: HintReveal | null;
  hintUsed?: HintType | null;
  onOpenHint?: () => void;
}) {
  const cat = CATEGORY_BY_ID[event.category];
  const canHint = Boolean(onOpenHint) && !hintUsed;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const largeUrl = originalUrl ?? thumbnailUrl;
  const canOpenLightbox = Boolean(thumbnailUrl) && Boolean(largeUrl);

  const { setNodeRef, transform, listeners, attributes, isDragging } =
    useDraggable({
      id: event.id,
      data: { kind: "current" },
    });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    touchAction: "none",
  };

  return (
    <Box>
      {hintReveal && (
        <Box
          sx={{
            mb: 1,
            px: 1.25,
            py: 0.75,
            borderLeft: 2,
            borderColor: "primary.main",
            backgroundColor: "rgba(201, 168, 73, 0.06)",
            borderRadius: "0 4px 4px 0",
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}
          >
            <Lightbulb
              size={11}
              strokeWidth={1.5}
              color="var(--mui-palette-primary-main)"
            />
            <Typography
              variant="caption"
              sx={{
                color: "primary.main",
                fontFamily: "var(--font-mono), monospace",
                textTransform: "uppercase",
                letterSpacing: "0.26em",
                fontSize: 9,
              }}
            >
              Oracle · {hintReveal.type}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 13, lineHeight: 1.4 }}>
            {hintReveal.content}
          </Typography>
        </Box>
      )}

      <Box
        sx={{ display: "flex", alignItems: "stretch", position: "relative" }}
      >
        {onOpenHint && (
          <Tooltip
            title={canHint ? "Consult the oracle" : "The oracle is silent"}
            placement="left"
          >
            <Box
              component="span"
              sx={{
                // Mobile only — desktop has it in the HUD
                display: { xs: "inline-flex", md: "none" },
                position: "absolute",
                top: -10,
                right: -8,
                zIndex: 2,
              }}
            >
              <ButtonBase
                onClick={(e) => {
                  e.stopPropagation();
                  if (canHint) onOpenHint();
                }}
                disabled={!canHint}
                aria-label="Consult the oracle"
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  backgroundColor: "background.paper",
                  border: 1.5,
                  borderColor: canHint ? "primary.main" : "divider",
                  color: canHint ? "primary.main" : "text.disabled",
                  boxShadow: "0 4px 10px rgba(0,0,0,.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: canHint ? 1 : 0.45,
                  transition: "border-color .2s, color .2s, transform .15s",
                  "&:hover:not(:disabled)": {
                    transform: "scale(1.06)",
                  },
                }}
              >
                <Lightbulb size={14} strokeWidth={1.5} />
              </ButtonBase>
            </Box>
          </Tooltip>
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
            height: PANEL_HEIGHT,
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
            boxShadow: "0 6px 16px rgba(0,0,0,.18)",
            transition: "box-shadow .2s, opacity .15s",
            "&:active": { cursor: "grabbing" },
            "&:hover": {
              boxShadow:
                "0 12px 24px rgba(0,0,0,.28), 0 0 0 1px var(--mui-palette-primary-main)",
            },
            "&:hover .card-image": {
              filter: "saturate(1.15) contrast(1.05)",
            },
          }}
        >
          <Box
            className="card-image"
            onClick={(e) => {
              if (!canOpenLightbox) return;
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            role={canOpenLightbox ? "button" : undefined}
            aria-label={
              canOpenLightbox ? "View larger image" : undefined
            }
            sx={{
              width: PANEL_HEIGHT,
              minWidth: PANEL_HEIGHT,
              backgroundColor: "background.default",
              backgroundImage: thumbnailUrl
                ? `url(${thumbnailUrl})`
                : undefined,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              borderRight: 1,
              borderColor: "primary.main",
              position: "relative",
              transition: "filter .2s",
              cursor: canOpenLightbox ? "zoom-in" : undefined,
              "&:hover .zoom-hint": { opacity: 1 },
            }}
          >
            {canOpenLightbox && (
              <Box
                className="zoom-hint"
                sx={{
                  position: "absolute",
                  bottom: 4,
                  right: 4,
                  width: 18,
                  height: 18,
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
                <ZoomIn size={10} strokeWidth={1.75} />
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
                  color: "primary.main",
                  opacity: 0.45,
                }}
              >
                <cat.Icon size={22} strokeWidth={1.25} />
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
              px: 1.25,
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}
            >
              <Box sx={{ color: "primary.main", display: "inline-flex" }}>
                <GripVertical size={10} strokeWidth={1.5} />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: "primary.main",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 9,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                }}
              >
                Drag down to place
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: 14,
                lineHeight: 1.2,
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
                mt: 0.25,
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
                    fontFamily: "var(--font-mono), monospace",
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
                  fontSize: 18,
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
      </Box>

      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth={false}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "background.default",
              border: 0,
              m: 2,
              maxWidth: "calc(100vw - 32px)",
              maxHeight: "calc(100vh - 32px)",
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
          {largeUrl && (
            <Box
              component="img"
              src={largeUrl}
              alt={event.title}
              sx={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "calc(100vh - 160px)",
                width: "auto",
                height: "auto",
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
              {cat?.name} · ????
            </Typography>
          </Box>
        </Box>
      </Dialog>
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
        height: PANEL_HEIGHT,
        display: "flex",
        alignItems: "stretch",
        backgroundColor: "background.paper",
        border: 1.5,
        borderColor: "primary.main",
        borderRadius: 1,
        boxShadow:
          "0 20px 40px rgba(0,0,0,.45), 0 0 0 1px var(--mui-palette-primary-main)",
        overflow: "hidden",
        pointerEvents: "none",
        transform: "rotate(-1deg)",
        minWidth: 240,
        maxWidth: 320,
      }}
    >
      <Box
        sx={{
          width: PANEL_HEIGHT,
          minWidth: PANEL_HEIGHT,
          backgroundColor: "background.default",
          backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : undefined,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
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
          px: 1.25,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "primary.main",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 9,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          Now placing
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
            lineHeight: 1.2,
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
            <cat.Icon
              size={10}
              strokeWidth={1.5}
              color="var(--mui-palette-text-secondary)"
            />
          )}
          <Typography
            variant="caption"
            sx={{
              fontFamily: "var(--font-mono), monospace",
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

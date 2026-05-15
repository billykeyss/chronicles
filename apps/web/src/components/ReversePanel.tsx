"use client";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Check, ExternalLink, Lightbulb, Search, X } from "lucide-react";
import { CATEGORY_BY_ID } from "@/game/data";
import { formatYear } from "./EventCard";
import type { HintReveal, ReverseRound } from "@/game/types";
import { wikipediaPageUrl, type WikipediaSummary } from "@/wikipedia/api";

type Props = {
  round: ReverseRound;
  thumbnails?: Record<string, string | undefined>;
  summaries?: Record<string, WikipediaSummary | undefined>;
  hintReveal: HintReveal | null;
  onPick: (choiceIndex: number) => void;
  /** Called when the player taps a card while the `verify` hint is armed. */
  onVerify: (choiceIndex: number) => void;
};

const HINT_LABELS: Record<string, string> = {
  related: "Related",
  eliminate: "Eliminated",
  verify: "Verify",
};

export default function ReversePanel({
  round,
  thumbnails,
  summaries,
  hintReveal,
  onPick,
  onVerify,
}: Props) {
  const settled = round.pickedIndex !== null;
  const pickedCorrect =
    settled && round.pickedIndex === round.correctIndex;
  const verifyArmed = round.verifyArmed && !settled;
  const confirmedIndex = round.verifiedIndex;

  return (
    <Box>
      {/* Year prompt */}
      <Box sx={{ textAlign: "center", py: { xs: 2, sm: 3 } }}>
        <Typography
          variant="caption"
          sx={{
            fontFamily: 'var(--font-mono), monospace',
            letterSpacing: "0.36em",
            color: "text.secondary",
            textTransform: "uppercase",
            fontSize: { xs: 10, sm: 11 },
            display: "block",
            mb: 1,
          }}
        >
          Which event happened in
        </Typography>
        <Typography
          sx={{
            fontFamily: 'var(--font-numerals), serif',
            fontWeight: 400,
            fontSize: { xs: 72, sm: 104, md: 128 },
            color: "primary.main",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
          }}
        >
          {formatYear(round.year)}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 1,
            color: "text.secondary",
            fontFamily: 'var(--font-display), serif',
            fontStyle: "italic",
            fontSize: 14,
          }}
        >
          Tap the card you think matches.
        </Typography>
      </Box>

      {hintReveal && (
        <Box
          sx={{
            mb: 2,
            mx: { xs: 0, sm: 2 },
            p: 1.5,
            borderLeft: 2,
            borderColor: "primary.main",
            backgroundColor: "rgba(201, 168, 73, 0.06)",
            borderRadius: "0 4px 4px 0",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
            {hintReveal.type === "verify" ? (
              <Search size={11} strokeWidth={1.5} color="var(--mui-palette-primary-main)" />
            ) : (
              <Lightbulb size={11} strokeWidth={1.5} color="var(--mui-palette-primary-main)" />
            )}
            <Typography
              variant="caption"
              sx={{
                color: "primary.main",
                fontFamily: 'var(--font-mono), monospace',
                textTransform: "uppercase",
                letterSpacing: "0.28em",
                fontSize: 10,
              }}
            >
              Oracle · {HINT_LABELS[hintReveal.type] ?? hintReveal.type}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 14, lineHeight: 1.45 }}>
            {hintReveal.content}
          </Typography>
        </Box>
      )}

      {/* Choices */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, 1fr)",
          },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {round.choices.map((choice, i) => {
          const isPicked = round.pickedIndex === i;
          const isCorrect = i === round.correctIndex;
          const showCorrect = settled && isCorrect;
          const showWrong = settled && isPicked && !isCorrect;
          const eliminated = choice.eliminated;
          const isConfirmed = !settled && confirmedIndex === i;

          const summary = summaries?.[choice.event.id];
          const thumb = thumbnails?.[choice.event.id];
          const cat = CATEGORY_BY_ID[choice.event.category];
          const wikiUrl = wikipediaPageUrl(
            choice.event.wikipediaTitle ?? choice.event.title,
          );

          const borderColor = showCorrect
            ? "success.main"
            : showWrong
              ? "error.main"
              : isConfirmed
                ? "success.main"
                : verifyArmed && !eliminated
                  ? "primary.main"
                  : "divider";

          return (
            <Paper
              key={choice.event.id}
              elevation={0}
              onClick={() => {
                if (settled || eliminated) return;
                if (verifyArmed) {
                  onVerify(i);
                  return;
                }
                onPick(i);
              }}
              sx={{
                position: "relative",
                borderRadius: 1,
                border: 1.5,
                borderColor,
                backgroundColor: "background.paper",
                overflow: "hidden",
                cursor: settled || eliminated ? "default" : "pointer",
                opacity: eliminated ? 0.35 : 1,
                transition: "border-color .15s, transform .15s, box-shadow .2s",
                ...(isConfirmed && {
                  boxShadow:
                    "0 0 0 2px var(--mui-palette-success-main), 0 12px 24px rgba(0,0,0,.25)",
                }),
                ...(verifyArmed && !eliminated && !isConfirmed && {
                  boxShadow:
                    "0 0 0 1px var(--mui-palette-primary-main), 0 8px 18px rgba(0,0,0,.2)",
                }),
                "&:hover":
                  !settled && !eliminated
                    ? {
                        transform: "translateY(-2px)",
                        boxShadow: "0 10px 24px rgba(0,0,0,.22)",
                        borderColor: verifyArmed
                          ? "primary.main"
                          : "primary.main",
                      }
                    : undefined,
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  aspectRatio: "4 / 3",
                  backgroundColor: "background.default",
                  backgroundImage: thumb ? `url(${thumb})` : undefined,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  borderBottom: 1,
                  borderColor: "divider",
                  position: "relative",
                }}
              >
                {!thumb && cat?.Icon && (
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
                    <cat.Icon size={40} strokeWidth={1.25} />
                  </Box>
                )}
                {showCorrect && <StatusBadge kind="correct" />}
                {showWrong && <StatusBadge kind="wrong" />}
                {!settled && isConfirmed && <StatusBadge kind="confirmed" />}
              </Box>
              <Box sx={{ p: 1.5 }}>
                <Typography
                  sx={{
                    fontFamily: 'var(--font-display), serif',
                    fontSize: 17,
                    fontWeight: 500,
                    lineHeight: 1.2,
                    color: "text.primary",
                  }}
                >
                  {choice.event.title}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mt: 0.75,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {cat?.Icon && (
                      <cat.Icon
                        size={11}
                        strokeWidth={1.5}
                        color="var(--mui-palette-text-secondary)"
                      />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: 9,
                        letterSpacing: "0.18em",
                        color: "text.secondary",
                        textTransform: "uppercase",
                      }}
                    >
                      {cat?.name}
                    </Typography>
                  </Box>
                  {settled && (
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
                        aria-label={`Open ${choice.event.title} on Wikipedia`}
                      >
                        <ExternalLink size={11} strokeWidth={1.5} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                {settled && summary?.extract && (
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
                      fontSize: 12,
                      lineHeight: 1.45,
                      color: "text.secondary",
                      fontStyle: "italic",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 3,
                    }}
                  >
                    {summary.extract}
                  </Typography>
                )}
                {settled && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 1,
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      color: "text.secondary",
                    }}
                  >
                    {formatYear(choice.event.year)}
                  </Typography>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>

      {settled && (
        <Box
          sx={{
            mt: 2,
            textAlign: "center",
            color: pickedCorrect ? "success.main" : "error.main",
            fontFamily: 'var(--font-mono), monospace',
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            fontSize: 11,
          }}
        >
          {pickedCorrect ? "Correct" : "Misplaced"} · drawing next round…
        </Box>
      )}
    </Box>
  );
}

function StatusBadge({ kind }: { kind: "correct" | "wrong" | "confirmed" }) {
  const color =
    kind === "correct" || kind === "confirmed" ? "success.main" : "error.main";
  return (
    <Box
      sx={{
        position: "absolute",
        top: 8,
        right: 8,
        width: 26,
        height: 26,
        borderRadius: "50%",
        backgroundColor: color,
        border: 2,
        borderColor: "background.paper",
        color: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label={
        kind === "confirmed" ? "Verified by the Oracle" : undefined
      }
    >
      {kind === "wrong" ? (
        <X size={14} strokeWidth={3} />
      ) : kind === "confirmed" ? (
        <Search size={13} strokeWidth={2.5} />
      ) : (
        <Check size={14} strokeWidth={3} />
      )}
    </Box>
  );
}

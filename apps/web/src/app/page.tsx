"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import CategoryPicker from "@/components/CategoryPicker";
import { CurrentCardPreview, NowDrawingPanel } from "@/components/CurrentCard";
import GameOverDialog from "@/components/GameOverDialog";
import HintModal from "@/components/HintModal";
import HudBar from "@/components/HudBar";
import ResultToast from "@/components/ResultToast";
import ReversePanel from "@/components/ReversePanel";
import Timeline from "@/components/Timeline";
import TimelineRail from "@/components/TimelineRail";
import { getEventsForSubcategories, SUBCATEGORY_BY_ID } from "@/game/data";
import { gameReducer, initialState } from "@/game/state";
import {
  clearPersistedState,
  loadPersistedState,
  loadSeenEventIds,
  recordSeenEventIds,
  savePersistedState,
} from "@/game/persistence";
import type { CategoryId, HintType, TimelineEvent } from "@/game/types";
import { fetchLiveEventsForCategories } from "@/wikidata/fetcher";
import {
  fetchWikipediaSummary,
  firstSentence,
  preloadImage,
  redactYear,
  type WikipediaSummary,
} from "@/wikipedia/api";

const NEXT_CARD_DELAY_MS = 450;
const TOAST_VISIBLE_MS = 2800;
const PREFETCH_AHEAD = 8;

/**
 * Shuffle a pool with a bias toward unseen events. Each event gets a random
 * sort key — unseen events draw from [0, 0.7), seen from [0.3, 1). The ranges
 * overlap, so seen events still appear (great for spaced repetition) but
 * unseen events are more likely to be drawn first.
 */
function weightedShuffle<T extends { id: string }>(
  events: T[],
  seenIds: Set<string>,
): T[] {
  return events
    .map((e) => ({
      e,
      sort: seenIds.has(e.id)
        ? Math.random() * 0.7 + 0.3 // seen: 0.30 – 1.00
        : Math.random() * 0.7, //         unseen: 0.00 – 0.70
    }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ e }) => e);
}

export default function HomePage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"), { noSsr: true });
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [restoringCache, setRestoringCache] = useState(false);

  // On mount, restore from localStorage (after hydration so SSR/CSR match).
  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      // There IS a cached game — show the spinner long enough to read.
      setRestoringCache(true);
      dispatch({ type: "restore", state: persisted });
      const t = setTimeout(() => {
        setRestoringCache(false);
        setHydrated(true);
      }, 450);
      return () => clearTimeout(t);
    }
    // Fresh visitor — skip the spinner entirely.
    setHydrated(true);
  }, []);

  // Persist every state change once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    savePersistedState(state);
  }, [state, hydrated]);
  const [hintOpen, setHintOpen] = useState(false);
  const [confirmNewGameOpen, setConfirmNewGameOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [shownResult, setShownResult] = useState<typeof state.lastResult>(null);
  const [currentSummary, setCurrentSummary] = useState<WikipediaSummary | null>(
    null,
  );
  const [thumbnails, setThumbnails] = useState<
    Record<string, string | undefined>
  >({});
  const [summaries, setSummaries] = useState<
    Record<string, WikipediaSummary | undefined>
  >({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [insertIdx, setInsertIdx] = useState<number | null>(null);
  const [poolLoading, setPoolLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const lookupTitle = useCallback(
    (event: TimelineEvent) => event.wikipediaTitle ?? event.title,
    [],
  );

  const fetchAndStoreThumbnail = useCallback(
    async (event: TimelineEvent, signal?: AbortSignal) => {
      const summary = await fetchWikipediaSummary(lookupTitle(event), signal);
      if (summary) {
        setSummaries((prev) =>
          prev[event.id] === summary ? prev : { ...prev, [event.id]: summary },
        );
        if (summary.thumbnail?.url) {
          const url = summary.thumbnail.url;
          preloadImage(url);
          setThumbnails((prev) =>
            prev[event.id] === url ? prev : { ...prev, [event.id]: url },
          );
        }
      }
      return summary;
    },
    [lookupTitle],
  );

  useEffect(() => {
    if (!state.lastResult) return;
    // Latch the result into local state so the toast survives next-card,
    // and keep it visible long enough to read.
    setShownResult(state.lastResult);
    setToastOpen(true);
    // Mark this event (and the reverse-mode distractors that were on screen
    // alongside it) as "seen" so the player gets fresh material next run.
    const seenIds: string[] = [state.lastResult.placedEvent.id];
    if (state.reverseRound) {
      for (const c of state.reverseRound.choices) seenIds.push(c.event.id);
    }
    recordSeenEventIds(seenIds);
    const closeT = setTimeout(() => setToastOpen(false), TOAST_VISIBLE_MS);
    const drawT =
      state.status === "playing"
        ? setTimeout(() => dispatch({ type: "next-card" }), NEXT_CARD_DELAY_MS)
        : null;
    return () => {
      clearTimeout(closeT);
      if (drawT) clearTimeout(drawT);
    };
  }, [state.lastResult, state.status, state.reverseRound]);

  useEffect(() => {
    setCurrentSummary(null);
    if (!state.current) return;
    const event = state.current;
    const controller = new AbortController();
    fetchAndStoreThumbnail(event, controller.signal)
      .then((s) => setCurrentSummary(s))
      .catch(() => {});
    return () => controller.abort();
  }, [state.current?.id, fetchAndStoreThumbnail, state.current]);

  useEffect(() => {
    if (state.timeline.length === 0) return;
    const controllers: AbortController[] = [];
    for (const event of state.timeline) {
      if (thumbnails[event.id] !== undefined) continue;
      const controller = new AbortController();
      controllers.push(controller);
      fetchAndStoreThumbnail(event, controller.signal).catch(() => {});
    }
    return () => controllers.forEach((c) => c.abort());
  }, [state.timeline, fetchAndStoreThumbnail, thumbnails]);

  useEffect(() => {
    const next = state.pool.slice(0, PREFETCH_AHEAD);
    const controllers: AbortController[] = [];
    for (const event of next) {
      if (thumbnails[event.id] !== undefined) continue;
      const controller = new AbortController();
      controllers.push(controller);
      fetchAndStoreThumbnail(event, controller.signal).catch(() => {});
    }
    return () => controllers.forEach((c) => c.abort());
  }, [state.pool, fetchAndStoreThumbnail, thumbnails]);

  // Reverse mode: fetch summaries for the three choices on the current round.
  useEffect(() => {
    if (!state.reverseRound) return;
    const controllers: AbortController[] = [];
    for (const choice of state.reverseRound.choices) {
      if (thumbnails[choice.event.id] !== undefined) continue;
      const controller = new AbortController();
      controllers.push(controller);
      fetchAndStoreThumbnail(choice.event, controller.signal).catch(() => {});
    }
    return () => controllers.forEach((c) => c.abort());
  }, [state.reverseRound, fetchAndStoreThumbnail, thumbnails]);

  const handleStart = () => {
    setThumbnails({});
    setSummaries({});

    // Start instantly on the bundled pool, biased toward events the player
    // hasn't seen in recent runs.
    const bundled = getEventsForSubcategories(state.selectedSubcategories);
    const seenIds = loadSeenEventIds();
    const ordered = weightedShuffle(bundled, seenIds);
    // Mark the anchor (and first reverse-round trio) as seen up front so
    // subsequent runs don't immediately reopen with the same starter.
    if (ordered.length > 0) {
      recordSeenEventIds(
        state.mode === "reverse"
          ? ordered.slice(0, 3).map((e) => e.id)
          : [ordered[0].id],
      );
    }
    dispatch({ type: "start-game", events: ordered });

    // Fire SPARQL queries in the background; append to the pool when they land.
    const cats = new Set<CategoryId>();
    for (const subId of state.selectedSubcategories) {
      const meta = SUBCATEGORY_BY_ID[subId];
      if (meta) cats.add(meta.category);
    }
    if (cats.size === 0) return;

    setPoolLoading(true);
    fetchLiveEventsForCategories(Array.from(cats))
      .then((live) => {
        if (live.length > 0) {
          const seenIds = loadSeenEventIds();
          const biased = weightedShuffle(live, seenIds);
          dispatch({ type: "extend-pool", events: biased });
        }
      })
      .catch(() => {
        // Silent — bundled pool still drives the game.
      })
      .finally(() => setPoolLoading(false));
  };

  const handlePlaceAt = useCallback(
    (i: number) => {
      if (state.lastResult) return;
      dispatch({ type: "place", slotIndex: i });
    },
    [state.lastResult],
  );

  const handleChooseHint = (hintType: HintType) => {
    let relatedSentence: string | undefined;
    if (hintType === "related") {
      // Resolve the target event + its summary across modes.
      const targetEvent =
        state.mode === "reverse"
          ? state.reverseRound?.choices[state.reverseRound.correctIndex].event
          : state.current;
      const targetSummary =
        state.mode === "reverse"
          ? targetEvent
            ? summaries[targetEvent.id]
            : null
          : currentSummary;
      if (targetEvent && targetSummary?.extract) {
        relatedSentence = redactYear(
          firstSentence(targetSummary.extract),
          targetEvent.year,
        );
      }
    }
    dispatch({ type: "use-hint", hintType, relatedSentence });
    setHintOpen(false);
  };

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  };

  const onDragOver = (e: DragOverEvent) => {
    const { over, active } = e;
    if (!over) {
      setInsertIdx(null);
      return;
    }
    const data = over.data.current as
      | { index?: number; kind?: string }
      | undefined;
    if (typeof data?.index !== "number") {
      setInsertIdx(null);
      return;
    }
    if (
      data.kind === "end" ||
      data.kind === "start" ||
      data.kind === "slot"
    ) {
      setInsertIdx(data.index);
      return;
    }
    // Over a placed card — top half = before, bottom half = after.
    const overRect = over.rect;
    const activeRect = active.rect.current.translated;
    if (!activeRect || !overRect) {
      setInsertIdx(data.index);
      return;
    }
    const cursorY = activeRect.top + activeRect.height / 2;
    const overMid = overRect.top + overRect.height / 2;
    setInsertIdx(cursorY < overMid ? data.index : data.index + 1);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const idx = insertIdx;
    setActiveId(null);
    setInsertIdx(null);
    if (!state.current) return;
    if (e.active.id !== state.current.id) return;
    if (idx !== null) handlePlaceAt(idx);
  };

  const onDragCancel = () => {
    setActiveId(null);
    setInsertIdx(null);
  };

  const draggedPreview =
    activeId && state.current?.id === activeId ? (
      <CurrentCardPreview
        event={state.current}
        thumbnailUrl={
          currentSummary?.thumbnail?.url ?? thumbnails[state.current.id]
        }
      />
    ) : null;

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: { xs: 1, sm: 2 },
        px: { xs: 2, sm: 3, md: 4 },
        // Leave room on mobile for the bottom-pinned NowDrawingPanel.
        // On desktop the panel is a sidebar so no extra bottom padding.
        pb: {
          xs: state.status === "playing" ? 18 : 4,
          md: 4,
        },
        position: "relative",
        zIndex: 1,
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        autoScroll={{ threshold: { x: 0, y: 0.2 } }}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <Stack spacing={3}>
          {hydrated && (
            <Box
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 8,
                bgcolor: "background.default",
                pb: 1,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <HudBar
                score={state.score}
                streak={state.streak}
                strikes={state.strikes}
                hintsRemaining={state.hintsRemaining}
                hintUsed={state.hintUsedOnCurrent}
                onUseHint={
                  state.status === "playing" &&
                  (state.current || state.reverseRound)
                    ? () => setHintOpen(true)
                    : undefined
                }
                onNewGame={
                  state.status === "playing"
                    ? () => setConfirmNewGameOpen(true)
                    : state.status === "gameover"
                      ? () => {
                          setThumbnails({});
                          clearPersistedState();
                          dispatch({ type: "restart" });
                          handleStart();
                        }
                      : undefined
                }
                onOpenMenu={
                  state.status !== "picking" && !menuOpen
                    ? () => setMenuOpen(true)
                    : undefined
                }
              />
            </Box>
          )}

          {restoringCache && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                py: 10,
                color: "text.secondary",
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: 2,
                  borderColor: "divider",
                  borderTopColor: "primary.main",
                  animation: "spin 0.9s linear infinite",
                  "@keyframes spin": {
                    to: { transform: "rotate(360deg)" },
                  },
                }}
              />
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  sx={{
                    fontFamily: "var(--font-display), serif",
                    fontVariationSettings: '"opsz" 36',
                    fontSize: 18,
                    fontWeight: 400,
                    color: "text.primary",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Restoring your last run
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 0.5,
                    fontFamily: "var(--font-mono), monospace",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    fontSize: 10,
                  }}
                >
                  loading from cache
                </Typography>
              </Box>
            </Box>
          )}

          {hydrated && (state.status === "picking" || menuOpen) && (
            <CategoryPicker
              selected={state.selectedSubcategories}
              difficulty={state.difficulty}
              mode={state.mode}
              loading={poolLoading}
              onToggleSub={(subId) =>
                dispatch({ type: "toggle-subcategory", subcategory: subId })
              }
              onToggleCategory={(catId) =>
                dispatch({ type: "toggle-category-all", category: catId })
              }
              onChangeDifficulty={(d) =>
                dispatch({ type: "set-difficulty", difficulty: d })
              }
              onChangeMode={(m) => dispatch({ type: "set-mode", mode: m })}
              onStart={() => {
                setMenuOpen(false);
                setThumbnails({});
                clearPersistedState();
                handleStart();
              }}
              onResume={
                menuOpen && state.status !== "picking"
                  ? () => setMenuOpen(false)
                  : undefined
              }
            />
          )}

          {hydrated &&
            !menuOpen &&
            state.status !== "picking" &&
            state.mode === "reverse" &&
            state.reverseRound && (
              <ReversePanel
                round={state.reverseRound}
                thumbnails={thumbnails}
                summaries={summaries}
                hintReveal={state.hintReveal}
                highlightCorrect={state.hintReveal?.type === "answer"}
                onPick={(i) => {
                  if (state.lastResult) return;
                  dispatch({ type: "pick-reverse", choiceIndex: i });
                }}
              />
            )}

          {hydrated &&
            !menuOpen &&
            state.status !== "picking" &&
            state.mode === "timeline" &&
            (isDesktop ? (
              /* Desktop — horizontal procession rail */
              <Stack spacing={2.5} sx={{ alignItems: "stretch" }}>
                {state.status === "playing" && state.current && (
                  <Box
                    sx={{
                      maxWidth: 420,
                      width: "100%",
                      mx: "auto",
                    }}
                  >
                    <NowDrawingPanel
                      event={state.current}
                      thumbnailUrl={
                        currentSummary?.thumbnail?.url ??
                        thumbnails[state.current.id]
                      }
                      originalUrl={currentSummary?.original?.url}
                      hintReveal={state.hintReveal}
                      hintsRemaining={state.hintsRemaining}
                      hintUsed={state.hintUsedOnCurrent}
                      onOpenHint={() => setHintOpen(true)}
                    />
                    <Typography
                      sx={{
                        mt: 1,
                        textAlign: "center",
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 10,
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        color: "text.secondary",
                      }}
                    >
                      ↓ drop on the rail to place
                    </Typography>
                  </Box>
                )}

                <Stack spacing={1}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontFamily: "var(--font-mono), monospace",
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        fontSize: 10,
                      }}
                    >
                      Timeline · procession
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontFamily: "var(--font-mono), monospace",
                        letterSpacing: "0.16em",
                        fontSize: 10,
                      }}
                    >
                      {state.timeline.length} placed ·{" "}
                      {state.pool.length} in deck
                    </Typography>
                  </Box>

                  <TimelineRail
                    timeline={state.timeline}
                    thumbnails={thumbnails}
                    summaries={summaries}
                    insertIdx={insertIdx}
                    dragging={activeId !== null}
                  />
                </Stack>
              </Stack>
            ) : (
              /* Mobile — existing vertical timeline with bottom-pinned panel */
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                {state.status === "playing" && state.current && (
                  <Box
                    sx={{
                      position: "fixed",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      zIndex: 10,
                      width: "100%",
                      px: { xs: 2, sm: 3 },
                      pt: 3,
                      pb: 2,
                      background:
                        "linear-gradient(to top, var(--mui-palette-background-default) 70%, transparent)",
                    }}
                  >
                    <NowDrawingPanel
                      event={state.current}
                      thumbnailUrl={
                        currentSummary?.thumbnail?.url ??
                        thumbnails[state.current.id]
                      }
                      originalUrl={currentSummary?.original?.url}
                      hintReveal={state.hintReveal}
                      hintsRemaining={state.hintsRemaining}
                      hintUsed={state.hintUsedOnCurrent}
                      onOpenHint={() => setHintOpen(true)}
                    />
                  </Box>
                )}

                <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontFamily: "var(--font-mono), monospace",
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        fontSize: 10,
                      }}
                    >
                      Timeline
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontFamily: "var(--font-mono), monospace",
                        letterSpacing: "0.16em",
                        fontSize: 10,
                      }}
                    >
                      {state.timeline.length} placed ·{" "}
                      {state.pool.length} in deck
                    </Typography>
                  </Box>

                  <Timeline
                    timeline={state.timeline}
                    thumbnails={thumbnails}
                    summaries={summaries}
                    insertIdx={insertIdx}
                    dragging={activeId !== null}
                  />
                </Stack>
              </Box>
            ))}
        </Stack>

        <DragOverlay
          dropAnimation={{
            duration: 220,
            easing: "cubic-bezier(.2, .8, .2, 1)",
          }}
        >
          {draggedPreview}
        </DragOverlay>
      </DndContext>

      <HintModal
        open={hintOpen}
        onClose={() => setHintOpen(false)}
        onChoose={handleChooseHint}
        hintsRemaining={state.hintsRemaining}
      />

      <ResultToast
        open={toastOpen && state.status !== "gameover"}
        result={shownResult}
        onClose={() => setToastOpen(false)}
      />

      <GameOverDialog
        open={state.status === "gameover" && !menuOpen}
        score={state.score}
        correctPlacements={state.correctPlacements}
        placements={state.placements}
        bestStreak={state.bestStreak}
        ranOutOfEvents={state.strikes < 3}
        onRestart={() => {
          setThumbnails({});
          clearPersistedState();
          dispatch({ type: "restart" });
          handleStart();
        }}
        onChangeCategories={() => {
          setThumbnails({});
          clearPersistedState();
          dispatch({ type: "restart" });
        }}
      />

      <Dialog
        open={confirmNewGameOpen}
        onClose={() => setConfirmNewGameOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Start a new game?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your current game progress will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmNewGameOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setConfirmNewGameOpen(false);
              setThumbnails({});
              setSummaries({});
              clearPersistedState();
              dispatch({ type: "restart" });
              // Don't auto-start — return to the picker so the player can
              // re-choose mode / difficulty / categories.
            }}
          >
            Back to menu
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

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
import { Lock } from "lucide-react";
import CategoryPicker from "@/components/CategoryPicker";
import { CurrentCardPreview, NowDrawingPanel } from "@/components/CurrentCard";
import GameOverDialog from "@/components/GameOverDialog";
import HintModal from "@/components/HintModal";
import HudBar from "@/components/HudBar";
import { useThemeMode } from "@/components/ThemeModeProvider";
import ResultToast from "@/components/ResultToast";
import ReversePanel from "@/components/ReversePanel";
import ReverseRevealDialog from "@/components/ReverseRevealDialog";
import Timeline from "@/components/Timeline";
import TimelineRail, {
  RailOrientation,
  TimelineLayout,
} from "@/components/TimelineRail";
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

function LayoutToggle({
  value,
  onChange,
}: {
  value: TimelineLayout;
  onChange: (next: TimelineLayout) => void;
}) {
  const options: Array<{ key: TimelineLayout; label: string }> = [
    { key: TimelineLayout.Stacked, label: "Stacked" },
    { key: TimelineLayout.Spread, label: "Spread" },
  ];
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 1,
        fontFamily: "var(--font-mono), monospace",
        fontSize: 10,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "text.secondary",
      }}
    >
      <Box component="span">Timeline ·</Box>
      {options.map((opt, i) => (
        <Box key={opt.key} component="span" sx={{ display: "inline-flex", alignItems: "baseline", gap: 1 }}>
          <Box
            component="button"
            type="button"
            onClick={() => onChange(opt.key)}
            sx={{
              all: "unset",
              cursor: "pointer",
              color: value === opt.key ? "primary.main" : "text.secondary",
              borderBottom: 1,
              borderColor:
                value === opt.key ? "primary.main" : "transparent",
              pb: "1px",
              transition: "color .15s, border-color .15s",
              "&:hover": { color: "primary.main" },
            }}
          >
            {opt.label}
          </Box>
          {i < options.length - 1 && (
            <Box component="span" sx={{ opacity: 0.4 }}>
              /
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}

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
  const { mode: themeMode } = useThemeMode();
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
      // If the player reloads mid-result (the round was answered but the
      // auto-advance never fired because lastResult is transient), draw the
      // next round so they aren't stranded on a settled board.
      const stalledReverse =
        persisted.mode === "reverse" &&
        persisted.reverseRound !== null &&
        persisted.reverseRound.pickedIndex !== null;
      const stalledTimeline =
        persisted.mode === "timeline" && persisted.current === null;
      if (persisted.status === "playing" && (stalledReverse || stalledTimeline)) {
        dispatch({ type: "next-card" });
      }
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
  const [gameOverDismissed, setGameOverDismissed] = useState(false);
  useEffect(() => {
    if (state.status !== "gameover") setGameOverDismissed(false);
  }, [state.status]);
  const [toastOpen, setToastOpen] = useState(false);
  const [reverseRevealOpen, setReverseRevealOpen] = useState(false);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
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
  const [railLayout, setRailLayout] = useState<TimelineLayout>(
    TimelineLayout.Stacked,
  );

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
    // In reverse mode, always pause auto-advance and pop the reveal dialog so
    // the player gets a clear look at every event in the round before moving on.
    const pauseForReveal = state.mode === "reverse";
    if (pauseForReveal) setReverseRevealOpen(true);
    const drawT =
      state.status === "playing" && !pauseForReveal
        ? setTimeout(() => dispatch({ type: "next-card" }), NEXT_CARD_DELAY_MS)
        : null;
    return () => {
      clearTimeout(closeT);
      if (drawT) clearTimeout(drawT);
    };
  }, [state.lastResult, state.status, state.reverseRound, state.mode]);

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
      maxWidth={false}
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
            <Box
              sx={{
                width: "100%",
                maxWidth: 760,
                alignSelf: "center",
                px: { xs: 1, sm: 2 },
                py: { xs: 2, sm: 4 },
              }}
            >
              <Box
                sx={{
                  textAlign: "center",
                  mb: { xs: 5, sm: 7 },
                  pt: { xs: 2, sm: 4 },
                }}
              >
                <Box
                  component="img"
                  src={themeMode === "light" ? "/logo-light.svg" : "/logo.svg"}
                  alt="Chronicles"
                  sx={{
                    width: { xs: 72, sm: 88, md: 104 },
                    height: { xs: 72, sm: 88, md: 104 },
                    display: "block",
                    mx: "auto",
                    mb: { xs: 2, sm: 2.5 },
                  }}
                />
                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: "var(--font-display), serif",
                    fontVariationSettings: '"opsz" 144, "SOFT" 50',
                    fontSize: { xs: 44, sm: 56, md: 64 },
                    fontWeight: 300,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    color: "text.primary",
                    mb: 1.5,
                  }}
                >
                  Chronicles
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: { xs: 10, sm: 11 },
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "text.secondary",
                  }}
                >
                  A Wikipedia timeline trivia game
                </Typography>
                <Box
                  sx={{
                    mt: { xs: 4, sm: 5 },
                    mx: "auto",
                    height: "1px",
                    width: 64,
                    backgroundColor: "primary.main",
                    opacity: 0.45,
                  }}
                />
              </Box>
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
            </Box>
          )}

          {hydrated &&
            !menuOpen &&
            state.status !== "picking" &&
            state.mode === "reverse" &&
            state.reverseRound && (
              <ReversePanel
                round={state.reverseRound}
                history={state.reverseHistory}
                thumbnails={thumbnails}
                summaries={summaries}
                hintReveal={state.hintReveal}
                onPick={(i) => {
                  if (state.lastResult) return;
                  dispatch({ type: "pick-reverse", choiceIndex: i });
                }}
                onVerify={(i) =>
                  dispatch({ type: "verify-reverse", choiceIndex: i })
                }
                onOpenHistory={(idx) => setHistoryIndex(idx)}
              />
            )}

          {hydrated &&
            !menuOpen &&
            state.status !== "picking" &&
            state.mode === "timeline" &&
            (isDesktop ? (
              /* Desktop — horizontal procession rail */
              <Stack spacing={2.5} sx={{ alignItems: "stretch" }}>
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
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <LayoutToggle
                        value={railLayout}
                        onChange={setRailLayout}
                      />
                      {state.status === "gameover" && (
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 0.875,
                            py: 0.375,
                            borderRadius: 0.75,
                            border: 1,
                            borderColor: "text.secondary",
                            color: "text.secondary",
                            opacity: 0.85,
                          }}
                        >
                          <Lock size={11} strokeWidth={1.5} />
                          <Typography
                            sx={{
                              fontFamily: "var(--font-mono), monospace",
                              fontSize: 9.5,
                              letterSpacing: "0.22em",
                              textTransform: "uppercase",
                              lineHeight: 1,
                            }}
                          >
                            Locked
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "baseline",
                        gap: 1.5,
                      }}
                    >
                      {state.status === "gameover" && gameOverDismissed && (
                        <Box
                          component="button"
                          type="button"
                          onClick={() => setGameOverDismissed(false)}
                          sx={{
                            all: "unset",
                            cursor: "pointer",
                            color: "primary.main",
                            fontFamily: "var(--font-mono), monospace",
                            fontSize: 10,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            borderBottom: 1,
                            borderColor: "primary.main",
                            "&:hover": { opacity: 0.75 },
                          }}
                        >
                          Show final results
                        </Box>
                      )}
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
                  </Box>

                  <TimelineRail
                    timeline={state.timeline}
                    thumbnails={thumbnails}
                    summaries={summaries}
                    insertIdx={insertIdx}
                    dragging={activeId !== null}
                    layout={railLayout}
                    eliminatedSlotIndex={
                      state.hintReveal?.type === "eliminate"
                        ? state.hintReveal.eliminatedSlotIndex ?? null
                        : null
                    }
                  />
                </Stack>

                {state.status === "playing" && state.current && (
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: 420,
                      alignSelf: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        mb: 1,
                        textAlign: "center",
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 10,
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        color: "text.secondary",
                      }}
                    >
                      ↑ drag onto the rail to place
                    </Typography>
                    <NowDrawingPanel
                      event={state.current}
                      thumbnailUrl={
                        currentSummary?.thumbnail?.url ??
                        thumbnails[state.current.id]
                      }
                      originalUrl={currentSummary?.original?.url}
                      hintReveal={state.hintReveal}
                      hintUsed={state.hintUsedOnCurrent}
                      onOpenHint={() => setHintOpen(true)}
                    />
                  </Box>
                )}
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
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <LayoutToggle
                        value={railLayout}
                        onChange={setRailLayout}
                      />
                      {state.status === "gameover" && (
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 0.875,
                            py: 0.375,
                            borderRadius: 0.75,
                            border: 1,
                            borderColor: "text.secondary",
                            color: "text.secondary",
                            opacity: 0.85,
                          }}
                        >
                          <Lock size={11} strokeWidth={1.5} />
                          <Typography
                            sx={{
                              fontFamily: "var(--font-mono), monospace",
                              fontSize: 9.5,
                              letterSpacing: "0.22em",
                              textTransform: "uppercase",
                              lineHeight: 1,
                            }}
                          >
                            Locked
                          </Typography>
                        </Box>
                      )}
                    </Box>
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

                  {railLayout === TimelineLayout.Spread ? (
                    <TimelineRail
                      timeline={state.timeline}
                      thumbnails={thumbnails}
                      summaries={summaries}
                      insertIdx={insertIdx}
                      dragging={activeId !== null}
                      layout={railLayout}
                      orientation={RailOrientation.Vertical}
                      eliminatedSlotIndex={
                        state.hintReveal?.type === "eliminate"
                          ? state.hintReveal.eliminatedSlotIndex ?? null
                          : null
                      }
                    />
                  ) : (
                    <Timeline
                      timeline={state.timeline}
                      thumbnails={thumbnails}
                      summaries={summaries}
                      insertIdx={insertIdx}
                      dragging={activeId !== null}
                    />
                  )}
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
        mode={state.mode}
        onClose={() => setHintOpen(false)}
        onChoose={handleChooseHint}
      />

      <ResultToast
        open={toastOpen && state.status !== "gameover"}
        result={shownResult}
        onClose={() => setToastOpen(false)}
      />

      {(() => {
        const historyRound =
          historyIndex !== null
            ? (state.reverseHistory[historyIndex] ?? null)
            : null;
        const viewingHistory = historyRound !== null;
        const dialogEvent = viewingHistory
          ? (historyRound.choices[historyRound.correctIndex]?.event ?? null)
          : (shownResult?.placedEvent ?? null);
        const dialogCorrect = viewingHistory
          ? historyRound.pickedIndex === historyRound.correctIndex
          : (shownResult?.correct ?? false);
        const sourceRound = viewingHistory ? historyRound : state.reverseRound;
        const dialogOthers =
          sourceRound && dialogEvent
            ? sourceRound.choices
                .filter((c) => c.event.id !== dialogEvent.id)
                .map((c) => ({
                  event: c.event,
                  summary: summaries[c.event.id],
                  picked:
                    sourceRound.pickedIndex !== null &&
                    sourceRound.choices[sourceRound.pickedIndex]?.event.id ===
                      c.event.id,
                }))
            : undefined;
        return (
          <ReverseRevealDialog
            open={reverseRevealOpen || viewingHistory}
            event={dialogEvent}
            correct={dialogCorrect}
            thumbnail={dialogEvent ? thumbnails[dialogEvent.id] : undefined}
            summary={dialogEvent ? summaries[dialogEvent.id] : undefined}
            others={dialogOthers}
            ctaLabel={
              viewingHistory
                ? "Close"
                : state.status === "gameover"
                  ? "Continue"
                  : "Next round"
            }
            onClose={() => {
              if (viewingHistory) {
                setHistoryIndex(null);
                return;
              }
              setReverseRevealOpen(false);
              if (state.status === "playing")
                dispatch({ type: "next-card" });
            }}
          />
        );
      })()}

      <GameOverDialog
        open={
          state.status === "gameover" &&
          !menuOpen &&
          !gameOverDismissed &&
          !reverseRevealOpen
        }
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
        onClose={() => setGameOverDismissed(true)}
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

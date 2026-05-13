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
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CategoryPicker from "@/components/CategoryPicker";
import { CurrentCardPreview, NowDrawingPanel } from "@/components/CurrentCard";
import GameOverDialog from "@/components/GameOverDialog";
import HintModal from "@/components/HintModal";
import HudBar from "@/components/HudBar";
import ResultToast from "@/components/ResultToast";
import Timeline from "@/components/Timeline";
import { getEventsForSubcategories, SUBCATEGORY_BY_ID } from "@/game/data";
import { gameReducer, initialState } from "@/game/state";
import {
  clearPersistedState,
  loadPersistedState,
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

export default function HomePage() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  // On mount, restore from localStorage (after hydration so SSR/CSR match).
  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      dispatch({ type: "restore", state: persisted });
    }
    setHydrated(true);
  }, []);

  // Persist every state change once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    savePersistedState(state);
  }, [state, hydrated]);
  const [hintOpen, setHintOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [shownResult, setShownResult] = useState<typeof state.lastResult>(null);
  const [currentSummary, setCurrentSummary] = useState<WikipediaSummary | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string | undefined>>({});
  const [summaries, setSummaries] = useState<Record<string, WikipediaSummary | undefined>>({});
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
    const closeT = setTimeout(() => setToastOpen(false), TOAST_VISIBLE_MS);
    const drawT =
      state.status === "playing"
        ? setTimeout(() => dispatch({ type: "next-card" }), NEXT_CARD_DELAY_MS)
        : null;
    return () => {
      clearTimeout(closeT);
      if (drawT) clearTimeout(drawT);
    };
  }, [state.lastResult, state.status]);

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

  const handleStart = () => {
    setThumbnails({});
    setSummaries({});

    // Start instantly on the bundled pool.
    const bundled = getEventsForSubcategories(state.selectedSubcategories);
    dispatch({ type: "start-game", events: bundled });

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
          dispatch({ type: "extend-pool", events: live });
        }
      })
      .catch(() => {})
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
    if (hintType === "related" && currentSummary?.extract && state.current) {
      relatedSentence = redactYear(
        firstSentence(currentSummary.extract),
        state.current.year,
      );
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
    const data = over.data.current as { index?: number; kind?: string } | undefined;
    if (typeof data?.index !== "number") {
      setInsertIdx(null);
      return;
    }
    if (data.kind === "end" || data.kind === "start") {
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
      maxWidth="md"
      sx={{
        py: { xs: 2, sm: 4 },
        px: { xs: 2, sm: 3, md: 4 },
        // Leave room for the bottom-pinned NowDrawingPanel
        pb: { xs: state.status === "playing" ? 18 : 4, sm: state.status === "playing" ? 20 : 4 },
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
          <HudBar
            score={state.score}
            streak={state.streak}
            strikes={state.strikes}
            hintsRemaining={state.hintsRemaining}
            onNewGame={
              state.status === "playing" || state.status === "gameover"
                ? () => {
                    setThumbnails({});
                    clearPersistedState();
                    dispatch({ type: "restart" });
                    handleStart();
                  }
                : undefined
            }
          />

          {!hydrated && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
                py: 6,
                color: "text.secondary",
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  border: 1.5,
                  borderColor: "divider",
                  borderTopColor: "primary.main",
                  animation: "spin 0.9s linear infinite",
                  "@keyframes spin": {
                    to: { transform: "rotate(360deg)" },
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontSize: 10,
                }}
              >
                Restoring your run…
              </Typography>
            </Box>
          )}

          {hydrated && state.status === "picking" && (
            <CategoryPicker
              selected={state.selectedSubcategories}
              difficulty={state.difficulty}
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
              onStart={handleStart}
            />
          )}

          {hydrated && state.status !== "picking" && (
            <Stack spacing={2}>
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
                    fontFamily: 'var(--font-jetbrains), monospace',
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
                    fontFamily: 'var(--font-jetbrains), monospace',
                    letterSpacing: "0.16em",
                    fontSize: 10,
                  }}
                >
                  {state.timeline.length} placed · {state.pool.length} in deck
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
          )}
        </Stack>

        {state.status === "playing" && state.current && (
          <NowDrawingPanel
            event={state.current}
            thumbnailUrl={
              currentSummary?.thumbnail?.url ?? thumbnails[state.current.id]
            }
            hintReveal={state.hintReveal}
            hintUsed={state.hintUsedOnCurrent}
            hintsRemaining={state.hintsRemaining}
            onOpenHint={() => setHintOpen(true)}
          />
        )}

        <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(.2, .8, .2, 1)" }}>
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
        open={state.status === "gameover"}
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
    </Container>
  );
}

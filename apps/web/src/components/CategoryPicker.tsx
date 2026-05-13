"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChevronDown } from "lucide-react";
import {
  ALL_SUBCATEGORY_IDS,
  CATEGORIES,
  EVENTS_BY_SUBCATEGORY,
  getEventsForSubcategories,
} from "@/game/data";
import type { CategoryId, Difficulty, GameMode } from "@/game/types";

type Props = {
  selected: string[];
  difficulty: Difficulty;
  mode: GameMode;
  loading?: boolean;
  onToggleSub: (subId: string) => void;
  onToggleCategory: (id: CategoryId) => void;
  onChangeDifficulty: (d: Difficulty) => void;
  onChangeMode: (m: GameMode) => void;
  onStart: () => void;
  onResume?: () => void;
};

const DIFFICULTIES: Array<{
  id: Difficulty;
  label: string;
  gap: string;
  description: string;
}> = [
  {
    id: "easy",
    label: "Easy",
    gap: "100 yrs",
    description: "Forgiving spacing",
  },
  {
    id: "medium",
    label: "Medium",
    gap: "50 yrs",
    description: "Default balance",
  },
  { id: "hard", label: "Hard", gap: "10 yrs", description: "Tight order" },
];

const MODES: Array<{
  id: GameMode;
  label: string;
  description: string;
}> = [
  {
    id: "timeline",
    label: "Timeline",
    description: "Drag each event onto the chronological row.",
  },
  {
    id: "reverse",
    label: "Reverse",
    description: "Pick which event happened in the shown year.",
  },
];

export default function CategoryPicker({
  selected,
  difficulty,
  mode,
  loading,
  onToggleSub,
  onToggleCategory,
  onChangeDifficulty,
  onChangeMode,
  onStart,
  onResume,
}: Props) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const total = useMemo(
    () => getEventsForSubcategories(selected).length,
    [selected],
  );
  const [catsOpen, setCatsOpen] = useState(false);
  const fullySelected = selected.length === ALL_SUBCATEGORY_IDS.length;

  // Names of the top-level categories that have at least one sub selected
  const activeCategoryNames = useMemo(() => {
    return CATEGORIES.filter((c) =>
      c.subcategories.some((s) => selectedSet.has(s.id)),
    ).map((c) => c.name);
  }, [selectedSet]);

  return (
    <Box>
      {onResume && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            p: 2,
            mb: 3,
            borderRadius: 1,
            border: 1.5,
            borderColor: "primary.main",
            backgroundColor: "rgba(201, 168, 73, 0.06)",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: "primary.main",
                fontFamily: "var(--font-mono), monospace",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                fontSize: 10,
                display: "block",
                mb: 0.25,
              }}
            >
              Game in progress
            </Typography>
            <Typography sx={{ fontSize: 14, color: "text.primary" }}>
              Starting a new run will discard your current game.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={onResume}
            sx={{
              flexShrink: 0,
              letterSpacing: "0.18em",
              fontSize: 12,
            }}
          >
            Resume
          </Button>
        </Box>
      )}
      <Typography
        variant="h2"
        sx={{
          fontSize: 28,
          fontWeight: 400,
          mb: 0.5,
          fontVariationSettings: '"opsz" 96',
        }}
      >
        Set up your run
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, fontSize: 14 }}>
        Pick a difficulty, hit start. Tap "Categories" if you want to change the
        source pool.
      </Typography>

      {/* Mode */}
      <SectionLabel>Mode</SectionLabel>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 3 }}>
        {MODES.map((m) => {
          const active = m.id === mode;
          return (
            <Box
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() => onChangeMode(m.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChangeMode(m.id);
                }
              }}
              sx={{
                flex: 1,
                px: 1.5,
                py: 1.25,
                borderRadius: 1,
                border: 1,
                borderColor: active ? "primary.main" : "divider",
                backgroundColor: active ? "action.selected" : "transparent",
                cursor: "pointer",
                transition: "border-color .15s, background .15s",
                outline: "none",
                "&:hover": {
                  borderColor: active ? "primary.main" : "text.secondary",
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: active ? "primary.main" : "text.primary",
                }}
              >
                {m.label}
              </Typography>
              <Typography
                variant="caption"
                sx={{ display: "block", color: "text.secondary", mt: 0.25 }}
              >
                {m.description}
              </Typography>
            </Box>
          );
        })}
      </Stack>

      {/* Difficulty */}
      <SectionLabel>Difficulty</SectionLabel>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 3 }}>
        {DIFFICULTIES.map((d) => {
          const active = d.id === difficulty;
          return (
            <Box
              key={d.id}
              role="button"
              tabIndex={0}
              onClick={() => onChangeDifficulty(d.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChangeDifficulty(d.id);
                }
              }}
              sx={{
                flex: 1,
                px: 1.5,
                py: 1.25,
                borderRadius: 1,
                border: 1,
                borderColor: active ? "primary.main" : "divider",
                backgroundColor: active ? "action.selected" : "transparent",
                cursor: "pointer",
                transition: "border-color .15s, background .15s",
                outline: "none",
                "&:hover": {
                  borderColor: active ? "primary.main" : "text.secondary",
                },
                "&:focus-visible": {
                  boxShadow: (t) => `0 0 0 2px ${t.palette.primary.main}44`,
                },
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="baseline"
              >
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: active ? "primary.main" : "text.primary",
                  }}
                >
                  {d.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: "var(--font-mono), monospace",
                    letterSpacing: "0.12em",
                    color: "text.secondary",
                    fontSize: 10,
                  }}
                >
                  ≥ {d.gap}
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                sx={{ display: "block", color: "text.secondary", mt: 0.25 }}
              >
                {d.description}
              </Typography>
            </Box>
          );
        })}
      </Stack>

      {/* Start button right under difficulty, full width */}
      <Button
        variant="contained"
        size="large"
        onClick={onStart}
        disabled={total < 2 || loading}
        fullWidth
        sx={{
          py: 1.5,
          fontSize: 13,
          letterSpacing: "0.22em",
          mb: 1,
        }}
      >
        {loading
          ? "Loading Wikipedia events…"
          : `Start game — ${total} event${total === 1 ? "" : "s"}`}
      </Button>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          textAlign: "center",
          color: "text.secondary",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          mb: 4,
          opacity: loading ? 1 : 0.6,
        }}
      >
        {loading
          ? "Querying Wikidata · this can take a few seconds"
          : "Bundled pool · live Wikidata events will join when you start"}
      </Typography>

      {/* Categories — collapsible */}
      <Box
        sx={{
          borderTop: 1,
          borderColor: "divider",
          pt: 2,
        }}
      >
        <Box
          role="button"
          tabIndex={0}
          onClick={() => setCatsOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setCatsOpen((v) => !v);
            }
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            color: catsOpen ? "primary.main" : "text.primary",
            "&:hover": { color: "primary.main" },
            outline: "none",
            "&:focus-visible": {
              boxShadow: (t) => `0 0 0 2px ${t.palette.primary.main}33`,
            },
          }}
        >
          <Box
            sx={{
              transition: "transform .2s",
              transform: catsOpen ? "rotate(180deg)" : "rotate(0deg)",
              display: "inline-flex",
            }}
          >
            <ChevronDown size={16} strokeWidth={1.5} />
          </Box>
          <Typography
            sx={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              flex: 1,
            }}
          >
            Categories
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "text.secondary",
            }}
          >
            {fullySelected
              ? "all"
              : `${selected.length}/${ALL_SUBCATEGORY_IDS.length}`}
          </Typography>
        </Box>

        {!catsOpen && (
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              display: "block",
              mt: 0.75,
              fontStyle: "italic",
            }}
          >
            {fullySelected
              ? "All 5 categories included."
              : activeCategoryNames.length === 0
                ? "No categories selected — expand to choose."
                : `From: ${activeCategoryNames.join(" · ")}`}
          </Typography>
        )}

        <Collapse in={catsOpen} timeout="auto">
          <Stack spacing={2.5} sx={{ mt: 2.5 }}>
            {CATEGORIES.map((cat) => {
              const subIds = cat.subcategories.map((s) => s.id);
              const selectedSubs = subIds.filter((s) => selectedSet.has(s));
              const allSelected = selectedSubs.length === subIds.length;
              const noneSelected = selectedSubs.length === 0;
              const catTotal = subIds.reduce(
                (sum, id) => sum + (EVENTS_BY_SUBCATEGORY[id]?.length ?? 0),
                0,
              );
              const selectedCount = selectedSubs.reduce(
                (sum, id) => sum + (EVENTS_BY_SUBCATEGORY[id]?.length ?? 0),
                0,
              );

              return (
                <Box key={cat.id}>
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={() => onToggleCategory(cat.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onToggleCategory(cat.id);
                      }
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 1.25,
                      cursor: "pointer",
                      pb: 1,
                      borderBottom: 1,
                      borderColor: "divider",
                      mb: 1.25,
                      "&:focus-visible": {
                        outline: "none",
                        boxShadow: (t) =>
                          `0 0 0 2px ${t.palette.primary.main}33`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                        flex: 1,
                        color: allSelected
                          ? "primary.main"
                          : noneSelected
                            ? "text.secondary"
                            : "text.primary",
                      }}
                    >
                      <cat.Icon size={18} strokeWidth={1.5} />
                      <Typography
                        sx={{ fontSize: 18, fontWeight: 500, color: "inherit" }}
                      >
                        {cat.name}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: "var(--font-mono), monospace",
                        letterSpacing: "0.12em",
                        color: "text.secondary",
                        fontSize: 10,
                      }}
                    >
                      {selectedSubs.length}/{subIds.length} · {selectedCount}/
                      {catTotal}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {cat.subcategories.map((sub) => {
                      const isOn = selectedSet.has(sub.id);
                      const count = EVENTS_BY_SUBCATEGORY[sub.id]?.length ?? 0;
                      return (
                        <Chip
                          key={sub.id}
                          onClick={() => onToggleSub(sub.id)}
                          variant={isOn ? "filled" : "outlined"}
                          label={
                            <Box
                              component="span"
                              sx={{
                                display: "inline-flex",
                                alignItems: "baseline",
                                gap: 0.6,
                              }}
                            >
                              <span>{sub.name}</span>
                              <Box
                                component="span"
                                sx={{
                                  fontFamily:
                                    "var(--font-mono), monospace",
                                  fontSize: 10,
                                  opacity: 0.65,
                                }}
                              >
                                {count}
                              </Box>
                            </Box>
                          }
                          title={sub.description}
                          sx={{ height: 30, fontSize: 13, cursor: "pointer" }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Collapse>
      </Box>
    </Box>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      sx={{
        fontFamily: "var(--font-mono), monospace",
        letterSpacing: "0.28em",
        color: "text.secondary",
        textTransform: "uppercase",
        display: "block",
        mb: 1.25,
        fontSize: 10,
      }}
    >
      {children}
    </Typography>
  );
}

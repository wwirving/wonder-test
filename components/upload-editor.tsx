"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import type { Video } from "@/lib/db/schema";
import {
  AI_CLIPS_DELAY_MS,
  AI_TAGS_DELAY_MS,
  MOCK_AI_CLIPS,
  MOCK_AI_TAGS,
  MOCK_ANALYTICS,
  type AiTagSuggestions,
  type SuggestedClip,
} from "@/lib/mock-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailsPanel, type DetailsForm } from "@/components/editor/details-panel";
import { AutoTagsPanel } from "@/components/editor/auto-tags-panel";
import { ClipsPanel } from "@/components/editor/clips-panel";
import { AnalyticsPanel } from "@/components/editor/analytics-panel";
import { PreviewRail } from "@/components/editor/preview-rail";
import { Toaster, type EditorToast } from "@/components/editor/toast";
import { CountBadge, Spinner, type AiStatus } from "@/components/editor/status";

const TABS = ["details", "autotags", "clips", "analytics"] as const;
type Tab = (typeof TABS)[number];
type ApplyField = "synopsis" | "genre" | "moodTags" | "tags";

const has = (arr: string[], v: string) =>
  arr.some((x) => x.toLowerCase() === v.toLowerCase());

/**
 * The `/upload/[id]` editor — "add metadata → preview → publish", with Twelve
 * Labs enrichment arriving progressively.
 *
 * Structure follows the creator's mental model: the **Details** tab is theirs
 * (title, story, credits, genre/mood/tags — no AI chrome); AI output lives on
 * the **Auto-tags** and **Clips** tabs and is announced by a toast the moment it
 * lands, so it never interrupts typing. Nothing AI gates publishing.
 *
 * MOCK seams (marked): AI arrival is timers standing in for a Supabase Realtime
 * subscription; edits/publish are local state standing in for updateVideo /
 * publishVideo. Component shape is unchanged when those are wired.
 */
export function UploadEditor({
  video,
  initialTab,
}: {
  video: Video;
  /** Deep-link entry (e.g. dashboard → `?tab=analytics`). */
  initialTab?: string;
}) {
  const [form, setForm] = React.useState<DetailsForm>({
    title: video.title,
    synopsis: video.synopsis ?? "",
    director: video.director ?? "",
    credits: video.credits,
    genre: video.genre,
    moodTags: video.moodTags,
    tags: video.tags,
  });
  const [posterUrl, setPosterUrl] = React.useState<string | null>(
    video.posterUrl,
  );
  const [customPoster, setCustomPoster] = React.useState<string | null>(null);
  const [accessTier, setAccessTier] = React.useState(video.accessTier);

  const [tab, setTab] = React.useState<Tab>(
    (TABS as readonly string[]).includes(initialTab ?? "")
      ? (initialTab as Tab)
      : "details",
  );

  const [aiTags, setAiTags] = React.useState<AiStatus>(video.aiTagsStatus);
  const [aiClips, setAiClips] = React.useState<AiStatus>(video.aiClipsStatus);
  const [tagPayload, setTagPayload] = React.useState<AiTagSuggestions | null>(
    null,
  );
  const [clips, setClips] = React.useState<SuggestedClip[]>([]);
  const [selectedClips, setSelectedClips] = React.useState<Set<string>>(
    new Set(),
  );
  const [tagsSeen, setTagsSeen] = React.useState(false);
  const [clipsSeen, setClipsSeen] = React.useState(false);
  const [published, setPublished] = React.useState(false);

  const [toasts, setToasts] = React.useState<EditorToast[]>([]);
  const toastId = React.useRef(0);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const pushToast = React.useCallback(
    (toast: Omit<EditorToast, "id">) => {
      const id = `t${(toastId.current += 1)}`;
      setToasts((ts) => [...ts, { ...toast, id }]);
      setTimeout(() => dismissToast(id), 8000);
    },
    [dismissToast],
  );

  // MOCK: stand-in for the Supabase Realtime subscription that flips these
  // statuses when the Twelve Labs webhooks land. Real build: subscribe to the
  // row and setState from the payload; drop the timers.
  React.useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (aiTags !== "ready") {
      timers.push(
        setTimeout(() => {
          const n =
            1 +
            MOCK_AI_TAGS.genre.length +
            MOCK_AI_TAGS.moodTags.length +
            MOCK_AI_TAGS.tags.length;
          setTagPayload(MOCK_AI_TAGS);
          setAiTags("ready");
          pushToast({
            message: `Auto-tags ready · ${n} suggestions`,
            actionLabel: "Review",
            onAction: () => setTab("autotags"),
          });
        }, AI_TAGS_DELAY_MS),
      );
    }
    if (aiClips !== "ready") {
      timers.push(
        setTimeout(() => {
          setClips(MOCK_AI_CLIPS);
          setSelectedClips(new Set(MOCK_AI_CLIPS.map((c) => c.id)));
          setAiClips("ready");
          pushToast({
            message: `${MOCK_AI_CLIPS.length} clips found`,
            actionLabel: "Review",
            onAction: () => setTab("clips"),
          });
        }, AI_CLIPS_DELAY_MS),
      );
    }
    return () => timers.forEach(clearTimeout);
    // Run once — the timers model a one-shot async arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fade a tab's badge from active to muted once its results have been opened.
  React.useEffect(() => {
    if (tab === "autotags" && aiTags === "ready") setTagsSeen(true);
    if (tab === "clips" && aiClips === "ready") setClipsSeen(true);
  }, [tab, aiTags, aiClips]);

  function updateForm(patch: Partial<DetailsForm>) {
    // MOCK: real build debounces this into updateVideo(db, id, patch).
    setForm((f) => ({ ...f, ...patch }));
  }

  function applyAi(field: ApplyField, value: string) {
    if (field === "synopsis") {
      setForm((f) => ({ ...f, synopsis: value }));
    } else {
      setForm((f) =>
        has(f[field], value) ? f : { ...f, [field]: [...f[field], value] },
      );
    }
  }

  function applyAllAi() {
    if (!tagPayload) return;
    setForm((f) => ({
      ...f,
      synopsis: f.synopsis.trim() ? f.synopsis : tagPayload.synopsis,
      genre: [...f.genre, ...tagPayload.genre.filter((v) => !has(f.genre, v))],
      moodTags: [
        ...f.moodTags,
        ...tagPayload.moodTags.filter((v) => !has(f.moodTags, v)),
      ],
      tags: [...f.tags, ...tagPayload.tags.filter((v) => !has(f.tags, v))],
    }));
  }

  function uploadPoster(file: File) {
    if (customPoster) URL.revokeObjectURL(customPoster);
    const url = URL.createObjectURL(file);
    setCustomPoster(url);
    setPosterUrl(url);
  }
  React.useEffect(() => {
    return () => {
      if (customPoster) URL.revokeObjectURL(customPoster);
    };
  }, [customPoster]);

  function toggleClip(id: string) {
    setSelectedClips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function downloadClip(clip: SuggestedClip) {
    // MOCK: production POSTs to a clip-export job (trim start-end, re-encode)
    // and downloads the returned file. Rendering is deferred (see build plan),
    // so here we just acknowledge the export the creator kicked off.
    pushToast({ message: `Preparing "${clip.label}" to download` });
  }

  // Count of auto-tag suggestions not yet applied (drives the tab badge).
  const tagsRemaining = React.useMemo(() => {
    if (!tagPayload) return 0;
    const synopsisApplied =
      form.synopsis.trim().length > 0 &&
      form.synopsis.trim() === tagPayload.synopsis.trim();
    return (
      (synopsisApplied ? 0 : 1) +
      tagPayload.genre.filter((v) => !has(form.genre, v)).length +
      tagPayload.moodTags.filter((v) => !has(form.moodTags, v)).length +
      tagPayload.tags.filter((v) => !has(form.tags, v)).length
    );
  }, [tagPayload, form]);

  const canPublish = form.title.trim().length > 0;
  const enrichmentPending = aiTags !== "ready" || aiClips !== "ready";

  const isPublished = published || video.status === "published";
  // MOCK: real build fetches getVideoAnalytics(db, id). Null until published.
  const analytics = isPublished
    ? { ...MOCK_ANALYTICS, videoId: video.id }
    : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pt-32 pb-24">
      {/* Header — Publish lives here, always reachable, never gated by AI. */}
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/upload"
            aria-label="Back to upload"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted transition hover:bg-hover hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-medium text-foreground">
              {form.title.trim() || "Untitled film"}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-xsmall text-muted">
              {isPublished ? (
                "Published"
              ) : enrichmentPending ? (
                <>
                  <Spinner /> Draft · enriching
                </>
              ) : (
                "Draft"
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          {isPublished ? (
            <div className="flex items-center gap-3 text-small">
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <Check className="h-4 w-4" strokeWidth={1.75} />
                Published
              </span>
              <Link
                href={`/watch/${video.id}`}
                className="text-muted underline-offset-2 transition hover:text-foreground hover:underline"
              >
                View page
              </Link>
            </div>
          ) : (
            <Button
              onClick={() => setPublished(true)}
              disabled={!canPublish}
              title={canPublish ? undefined : "Add a title to publish"}
            >
              Publish
            </Button>
          )}
          {published && enrichmentPending ? (
            <p className="text-xsmall text-muted">
              AI enrichment will apply when it lands.
            </p>
          ) : null}
        </div>
      </header>

      {/* Two-pane: sticky preview/settings rail · tabbed editor. */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <PreviewRail
            video={video}
            title={form.title}
            posterUrl={posterUrl}
            onSelectPoster={setPosterUrl}
            customPoster={customPoster}
            onUploadPoster={uploadPoster}
            accessTier={accessTier}
            onAccessTier={setAccessTier}
            aiTags={aiTags}
            aiClips={aiClips}
          />
        </div>

        <div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger
                value="autotags"
                adornment={
                  aiTags === "processing" || aiTags === "pending" ? (
                    <Spinner className="text-muted" />
                  ) : aiTags === "ready" && tagsRemaining > 0 ? (
                    <CountBadge count={tagsRemaining} muted={tagsSeen} />
                  ) : null
                }
              >
                Auto-tags
              </TabsTrigger>
              <TabsTrigger
                value="clips"
                adornment={
                  aiClips === "processing" || aiClips === "pending" ? (
                    <Spinner className="text-muted" />
                  ) : aiClips === "ready" && clips.length > 0 ? (
                    <CountBadge count={clips.length} muted={clipsSeen} />
                  ) : null
                }
              >
                Clips
              </TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <div className="pt-6">
              <TabsContent value="details">
                <DetailsPanel form={form} onChange={updateForm} />
              </TabsContent>
              <TabsContent value="autotags">
                <AutoTagsPanel
                  status={aiTags}
                  suggestions={tagPayload}
                  form={form}
                  onApply={applyAi}
                  onApplyAll={applyAllAi}
                />
              </TabsContent>
              <TabsContent value="clips">
                <ClipsPanel
                  status={aiClips}
                  clips={clips}
                  selected={selectedClips}
                  onToggle={toggleClip}
                  onDownload={downloadClip}
                />
              </TabsContent>
              <TabsContent value="analytics">
                <AnalyticsPanel published={isPublished} analytics={analytics} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}

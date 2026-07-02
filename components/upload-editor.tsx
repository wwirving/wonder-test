"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import type { Video } from "@/lib/db/schema";
import type { VideoAnalytics } from "@/lib/types";
import {
  AI_CLIPS_DELAY_MS,
  AI_TAGS_DELAY_MS,
  MOCK_AI_CLIPS,
  MOCK_AI_TAGS,
  type AiTagSuggestions,
  type SuggestedClip,
} from "@/lib/mock-editor";
import { saveVideo, publishVideoAction } from "@/app/upload/[id]/actions";
import { uploadPosterImage } from "@/lib/storage/upload-image";
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
type SaveState = "idle" | "saving" | "saved";

const AUTOSAVE_MS = 800;

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
 * Persistence is real: the metadata form autosaves to the `videos` row via a
 * server action (debounced), Publish flips the row live and revalidates the
 * discovery feed, and the poster is grabbed/uploaded to Storage. The only mock
 * left is the Twelve Labs enrichment (tags/clips arrive on timers, standing in
 * for the webhook → Realtime push).
 */
export function UploadEditor({
  video,
  analytics,
  initialTab,
}: {
  video: Video;
  /** Engagement roll-up over watch_events; null until published / with no views. */
  analytics: VideoAnalytics | null;
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
  // The persisted poster (a real Storage URL or null). `posterPreview` is a
  // transient blob: URL shown for instant feedback while an upload is in flight.
  const [posterUrl, setPosterUrl] = React.useState<string | null>(
    video.posterUrl,
  );
  const [posterPreview, setPosterPreview] = React.useState<string | null>(null);
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
  const [published, setPublished] = React.useState(
    video.status === "published",
  );
  const [publishing, setPublishing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");

  const router = useRouter();

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

  // The exact payload the server persists — form fields plus the two settings
  // that live in the rail. Memoised so the autosave effect only fires on change.
  const patch = React.useMemo(
    () => ({ ...form, posterUrl, accessTier }),
    [form, posterUrl, accessTier],
  );

  // Debounced autosave. Skips the initial render (nothing has changed yet) so we
  // don't write the row straight back on mount.
  const firstRender = React.useRef(true);
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveState("saving");
    const timer = setTimeout(async () => {
      try {
        await saveVideo(video.id, patch);
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [patch, video.id]);

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

  // Poster: show the picked frame instantly (blob URL), upload it to Storage in
  // the background, then swap to the durable public URL (which autosaves).
  async function uploadPoster(file: File) {
    const preview = URL.createObjectURL(file);
    setPosterPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return preview;
    });
    try {
      const url = await uploadPosterImage(video.id, file);
      setPosterUrl(url);
    } catch {
      pushToast({ message: "Couldn't upload that poster — try again." });
    } finally {
      setPosterPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }
  React.useEffect(() => {
    return () => {
      if (posterPreview) URL.revokeObjectURL(posterPreview);
    };
  }, [posterPreview]);

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

  async function handlePublish() {
    setPublishing(true);
    try {
      // Persists the current form and flips status → published in one call.
      await publishVideoAction(video.id, patch);
      setPublished(true);
      setSaveState("saved");
    } catch {
      pushToast({ message: "Publish failed — please try again." });
    } finally {
      setPublishing(false);
    }
  }

  // Delete this upload and return to the dashboard. A 404 means the row is
  // already gone — treat it as success rather than surfacing an error. On
  // success we navigate away, so `deleting` is intentionally left true (the view
  // is unmounting) and only reset on the failure path.
  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/uploads/${video.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setDeleting(false);
      pushToast({ message: "Couldn't delete this upload — please try again." });
    }
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
  const isPublished = published;
  const displayPoster = posterPreview ?? posterUrl;

  // Once published, always show numbers (zeroed until watch_events accrue) even
  // if the page loaded while still a draft (analytics prop was null then).
  const displayAnalytics: VideoAnalytics | null = analytics
    ? { ...analytics, videoId: video.id }
    : isPublished
      ? {
          videoId: video.id,
          views: 0,
          meanPctWatched: 0,
          meanSecondsPlayed: 0,
          completionRate: 0,
        }
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
              {saveState !== "idle" ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{saveState === "saving" ? "Saving…" : "Saved"}</span>
                </>
              ) : null}
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
              onClick={handlePublish}
              disabled={!canPublish || publishing}
              title={canPublish ? undefined : "Add a title to publish"}
            >
              {publishing ? "Publishing…" : "Publish"}
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
            posterUrl={displayPoster}
            onUploadPoster={uploadPoster}
            accessTier={accessTier}
            onAccessTier={setAccessTier}
            aiTags={aiTags}
            aiClips={aiClips}
            onDelete={handleDelete}
            deleting={deleting}
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
                <AnalyticsPanel
                  published={isPublished}
                  analytics={displayAnalytics}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}

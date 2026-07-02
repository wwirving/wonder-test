"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSessionId } from "@/lib/session";
import { formatRelativeTime } from "@/lib/format";
import { type Comment } from "@/lib/db/schema";
import { Avatar } from "@/components/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const ENDPOINT = "/api/comments";

/**
 * The community thread beneath a film. Comments are server-fetched and passed in
 * as `initial`; posting writes through /api/comments then calls `router.refresh()`
 * — the watch page is `force-dynamic`, so the new comment flows back down as a
 * fresh prop. Identity is the anonymous `wtv_session` id plus an optional display
 * name, which also seeds the gradient avatar (the director-thumb trick).
 */
export function WatchComments({
  videoId,
  initial,
}: {
  videoId: string;
  initial: Comment[];
}) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [submitting, setSubmitting] = React.useState(false);

  const canPost = body.trim().length > 0 && !submitting && !pending;

  async function post() {
    const text = body.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          sessionId: getSessionId(),
          authorName: name.trim() || undefined,
          body: text,
        }),
      });
      setBody("");
      // Re-fetch the server component so the new comment appears in the list.
      startTransition(() => router.refresh());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-[var(--margin-md)]">
      <h2 className="mb-[var(--margin-sm)] flex items-center gap-2 text-small text-muted">
        <MessageCircle className="size-4" strokeWidth={1.5} aria-hidden />
        {initial.length > 0
          ? `${initial.length.toLocaleString("en-US")} comment${initial.length === 1 ? "" : "s"}`
          : "Comments"}
      </h2>

      {/* Compose */}
      <div className="flex flex-col gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          maxLength={60}
          aria-label="Your name"
        />
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          maxLength={2000}
          aria-label="Add a comment"
          className="min-h-20"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!canPost}
            onClick={post}
            className="text-background"
          >
            {submitting || pending ? "Posting…" : "Post"}
          </Button>
        </div>
      </div>

      {/* Thread */}
      {initial.length === 0 ? (
        <p className="mt-[var(--margin-sm)] text-small text-muted">
          No comments yet — be the first.
        </p>
      ) : (
        <ul className="mt-[var(--margin-sm)] flex flex-col gap-[var(--margin-sm)]">
          {initial.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar name={c.authorName} className="mt-0.5 size-7" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-small text-foreground">
                    {c.authorName?.trim() || "Anonymous"}
                  </span>
                  <span className="text-xsmall text-muted">
                    {formatRelativeTime(c.createdAt)}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-0.5 text-small text-pretty whitespace-pre-wrap text-subtle",
                  )}
                >
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

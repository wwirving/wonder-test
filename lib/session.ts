const SESSION_KEY = "wtv_session";

/**
 * A stable per-browser id so anonymous engagement (retention, loves) can be
 * attributed to a viewer without accounts. Shared by the watch player and the
 * love button so both write under the same identity. Client-only (touches
 * localStorage); falls back to a fixed id if storage is unavailable.
 */
export function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

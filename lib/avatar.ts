// A heavily-blurred thumbnail reads as a soft, natural gradient — the trick the
// source app uses for creator avatars. A deterministic hash keeps a given seed
// (a creator name, a file name) mapped to the same image every render.

export const AVATAR_IMAGES = [5, 7, 9, 10, 16, 19, 20, 25, 27, 29, 36, 46].map(
  (n) => `/table-icons/source-table-${n}.jpg`,
);

export function blurImageFor(seed: string | null): string {
  let h = 0;
  for (const ch of seed ?? "?") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_IMAGES[h % AVATAR_IMAGES.length];
}

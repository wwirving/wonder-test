import { cn } from "@/lib/utils";
import { blurImageFor } from "@/lib/avatar";

/**
 * Circular creator avatar: a heavily-blurred table image standing in for a
 * profile photo (the trick the source app uses). Deterministic per `name`.
 * Shared by the video cards and the watch page so creators read consistently.
 */
export function Avatar({
  name,
  className,
}: {
  name: string | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-block shrink-0 overflow-hidden rounded-full outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={blurImageFor(name)}
        alt=""
        className="absolute inset-0 h-full w-full scale-125 object-cover blur-[4px]"
      />
    </span>
  );
}

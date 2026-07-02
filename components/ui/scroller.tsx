"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { useComposedRefs } from "@/lib/compose-refs";
import { cn } from "@/lib/utils";

/**
 * Scroll container modelled on the dice-ui `Scroller` primitive, trimmed to the
 * core we need: a hidden scrollbar plus a soft fade mask that appears at whichever
 * edge is scrollable. Dropped the primitive's `asChild` (radix Slot) and
 * navigation-button variants — not needed for a full-page feed. The fade is a
 * `mask-image` gradient toggled by `data-*-scroll` attributes as you scroll.
 */

const DATA_TOP_SCROLL = "data-top-scroll";
const DATA_BOTTOM_SCROLL = "data-bottom-scroll";
const DATA_LEFT_SCROLL = "data-left-scroll";
const DATA_RIGHT_SCROLL = "data-right-scroll";
const DATA_TOP_BOTTOM_SCROLL = "data-top-bottom-scroll";
const DATA_LEFT_RIGHT_SCROLL = "data-left-right-scroll";

const scrollerVariants = cva("", {
  variants: {
    orientation: {
      vertical: [
        "overflow-y-auto",
        "data-[top-scroll=true]:[mask-image:linear-gradient(0deg,#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]",
        "data-[bottom-scroll=true]:[mask-image:linear-gradient(180deg,#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]",
        "data-[top-bottom-scroll=true]:[mask-image:linear-gradient(#000,#000,transparent_0,#000_var(--scroll-shadow-size),#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]",
      ],
      horizontal: [
        "overflow-x-auto",
        "data-[left-scroll=true]:[mask-image:linear-gradient(270deg,#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]",
        "data-[right-scroll=true]:[mask-image:linear-gradient(90deg,#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]",
        "data-[left-right-scroll=true]:[mask-image:linear-gradient(to_right,#000,#000,transparent_0,#000_var(--scroll-shadow-size),#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]",
      ],
    },
    hideScrollbar: {
      true: "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      false: "",
    },
  },
  defaultVariants: {
    orientation: "vertical",
    hideScrollbar: false,
  },
});

interface ScrollerProps
  extends VariantProps<typeof scrollerVariants>,
    React.ComponentProps<"div"> {
  /** Fade mask size in px (the `--scroll-shadow-size`). */
  size?: number;
  /** Dead-zone before an edge counts as scrollable, in px. */
  offset?: number;
}

function Scroller(props: ScrollerProps) {
  const {
    orientation = "vertical",
    hideScrollbar,
    className,
    size = 40,
    offset = 0,
    style,
    ref,
    ...scrollerProps
  } = props;

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const composedRef = useComposedRefs(ref, containerRef);

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onScroll() {
      if (!container) return;

      if (orientation === "vertical") {
        const scrollTop = container.scrollTop;
        const clientHeight = container.clientHeight;
        const scrollHeight = container.scrollHeight;

        const hasTopScroll = scrollTop > offset;
        const hasBottomScroll =
          scrollTop + clientHeight + offset < scrollHeight;
        const isScrollable = scrollHeight > clientHeight;

        if (hasTopScroll && hasBottomScroll && isScrollable) {
          container.setAttribute(DATA_TOP_BOTTOM_SCROLL, "true");
          container.removeAttribute(DATA_TOP_SCROLL);
          container.removeAttribute(DATA_BOTTOM_SCROLL);
        } else {
          container.removeAttribute(DATA_TOP_BOTTOM_SCROLL);
          if (hasTopScroll) container.setAttribute(DATA_TOP_SCROLL, "true");
          else container.removeAttribute(DATA_TOP_SCROLL);
          if (hasBottomScroll && isScrollable)
            container.setAttribute(DATA_BOTTOM_SCROLL, "true");
          else container.removeAttribute(DATA_BOTTOM_SCROLL);
        }
        return;
      }

      const scrollLeft = container.scrollLeft;
      const clientWidth = container.clientWidth;
      const scrollWidth = container.scrollWidth;

      const hasLeftScroll = scrollLeft > offset;
      const hasRightScroll = scrollLeft + clientWidth + offset < scrollWidth;
      const isScrollable = scrollWidth > clientWidth;

      if (hasLeftScroll && hasRightScroll && isScrollable) {
        container.setAttribute(DATA_LEFT_RIGHT_SCROLL, "true");
        container.removeAttribute(DATA_LEFT_SCROLL);
        container.removeAttribute(DATA_RIGHT_SCROLL);
      } else {
        container.removeAttribute(DATA_LEFT_RIGHT_SCROLL);
        if (hasLeftScroll) container.setAttribute(DATA_LEFT_SCROLL, "true");
        else container.removeAttribute(DATA_LEFT_SCROLL);
        if (hasRightScroll && isScrollable)
          container.setAttribute(DATA_RIGHT_SCROLL, "true");
        else container.removeAttribute(DATA_RIGHT_SCROLL);
      }
    }

    onScroll();
    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [orientation, offset]);

  const composedStyle = React.useMemo<React.CSSProperties>(
    () => ({
      "--scroll-shadow-size": `${size}px`,
      ...style,
    }),
    [size, style],
  );

  return (
    <div
      data-slot="scroller"
      {...scrollerProps}
      ref={composedRef}
      style={composedStyle}
      className={cn(scrollerVariants({ orientation, hideScrollbar, className }))}
    />
  );
}

export { Scroller };

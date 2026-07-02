import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Frosted text input on the Wonder tokens — same fill/radius language as the
 * button and file-upload well. No border at rest (the `bg-input` fill carries
 * the shape); a hairline foreground outline appears on focus.
 */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-control bg-input px-3 text-small text-foreground transition placeholder:text-muted",
      "outline-none focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-muted",
      "disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

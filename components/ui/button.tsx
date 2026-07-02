import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Minimal button primitive in the shadcn `cva` shape, restyled onto the Wonder
 * design tokens (monochrome, single weight, control radius). Kept small on
 * purpose — the app only needs a high-contrast primary CTA plus frosted/ghost
 * secondaries, reused across upload → editor → publish.
 */
const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-[0.4em] rounded-control text-small leading-none whitespace-nowrap outline-none transition select-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-foreground text-background hover:opacity-85",
        secondary: "bg-input text-foreground hover:bg-input-strong",
        ghost: "text-muted hover:text-foreground",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xsmall",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Disable the tactile scale-on-press when the motion would be distracting. */
  static?: boolean;
}

// Tactile feedback: 0.96 is the sweet spot — anything below 0.95 feels
// exaggerated. Guarded by `not-disabled` so disabled buttons stay still.
const TAP_SCALE = "active:not-disabled:scale-[0.96]";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", static: isStatic, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), !isStatic && TAP_SCALE, className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { buttonVariants };

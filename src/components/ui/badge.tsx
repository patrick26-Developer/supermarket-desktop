import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        primary: "bg-primary/10 text-primary",
        accent: "bg-accent/20 text-accent-foreground",
        success: "bg-emerald-500/10 text-emerald-600",
        destructive: "bg-destructive/10 text-destructive",
        coral: "bg-spectrum-coral/15 text-spectrum-coral",
        amber: "bg-spectrum-amber/15 text-spectrum-amber",
        lime: "bg-spectrum-lime/15 text-spectrum-lime",
        teal: "bg-spectrum-teal/15 text-spectrum-teal",
        azure: "bg-spectrum-azure/15 text-spectrum-azure",
        violet: "bg-spectrum-violet/15 text-spectrum-violet",
        pink: "bg-spectrum-pink/15 text-spectrum-pink",
        slate: "bg-spectrum-slate/15 text-spectrum-slate",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone, className }))} {...props} />;
}

export { Badge };

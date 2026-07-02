import { Loader2 } from "lucide-react";

/**
 * Global route-transition loading UI. A single, subtle spinner centered on the
 * page background while a segment streams in.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center bg-background">
      <Loader2
        className="size-6 animate-spin text-muted-foreground"
        aria-label="Φόρτωση"
      />
    </div>
  );
}

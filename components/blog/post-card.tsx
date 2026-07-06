import Link from "next/link";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/lib/blog";

/** Long Greek date from an ISO `YYYY-MM-DD` string (timezone-stable). */
function formatGreekDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("el-GR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * A single frosted-glass card in the blog index grid. The whole card is a
 * link to the post; hover lifts it and warms the border, matching the site's
 * glassmorphism aesthetic over the global aurora.
 */
export default function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/50 bg-white/60 p-6 backdrop-blur-xl",
        "ring-1 ring-white/40 shadow-[0_10px_40px_-12px_rgba(30,41,120,0.18)]",
        "transition-all duration-300 hover:-translate-y-1 hover:bg-white/70 hover:shadow-[0_24px_70px_-24px_rgba(43,107,255,0.35)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        "sm:p-7",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 text-brand" />
          <time dateTime={post.date}>{formatGreekDate(post.date)}</time>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock aria-hidden="true" className="h-3.5 w-3.5 text-brand" />
          {post.readingMinutes} λεπτά
        </span>
      </div>

      <h2 className="mt-4 text-lg font-semibold leading-snug tracking-tight text-foreground transition-colors duration-300 group-hover:text-brand sm:text-xl">
        {post.title}
      </h2>

      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {post.description}
      </p>

      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
        Διάβασε το άρθρο
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}

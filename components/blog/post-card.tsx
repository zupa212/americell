import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/lib/blog";

/** Long US English date from an ISO `YYYY-MM-DD` string (timezone-stable). */
function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * A single card in the blog index grid, styled as strict black-and-white
 * editorial (think Apple Newsroom / a premium magazine) — deliberately
 * different from the site's colorful glassmorphism. The whole card is a link
 * to the post; it sits on an opaque near-white surface that covers the global
 * aurora, with a hairline border, a bold black title, gray meta/description,
 * and a typographic "Read →" affordance. Hover stays monochrome: a slight lift,
 * a darkened border, and an underline on the affordance — no color shift.
 */
export default function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group relative flex h-full flex-col",
        "border border-neutral-200 bg-white p-6 sm:p-8",
        "transition-[transform,border-color] duration-300 ease-out",
        "hover:-translate-y-1 hover:border-neutral-900",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium uppercase tracking-wider text-neutral-500">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readingMinutes} min read</span>
      </div>

      <h2 className="mt-4 text-xl font-bold leading-snug tracking-tight text-neutral-900 [overflow-wrap:anywhere] sm:text-2xl">
        {post.title}
      </h2>

      <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-neutral-500">
        {post.description}
      </p>

      <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-neutral-900">
        <span className="underline-offset-4 group-hover:underline">Read</span>
        <span
          aria-hidden="true"
          className="transition-transform duration-300 ease-out group-hover:translate-x-1"
        >
          →
        </span>
      </span>
    </Link>
  );
}

import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/lib/blog";

/**
 * Format an ISO `YYYY-MM-DD` date as a long Greek date. The `T00:00:00`
 * anchor keeps the day stable regardless of the build machine's timezone.
 */
function formatGreekDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("el-GR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Anchor renderer for Markdown links. Internal (`/…`, `#…`) links use the
 * Next.js client router; external links open in a new tab with safe `rel`.
 */
function MarkdownLink({ href, children }: ComponentPropsWithoutRef<"a">) {
  const url = href ?? "#";
  const isInternal = url.startsWith("/") || url.startsWith("#");
  const classes =
    "font-medium text-brand underline decoration-brand/30 underline-offset-2 transition-colors hover:decoration-brand hover:text-brand-2";

  if (isInternal) {
    return (
      <Link href={url} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={classes}>
      {children}
    </a>
  );
}

/** Inline vs. fenced code. Fenced blocks carry a `language-*` class. */
function MarkdownCode({
  className,
  children,
}: ComponentPropsWithoutRef<"code">) {
  const isBlock = /language-/.test(className ?? "");
  if (isBlock) {
    return (
      <code className={cn("font-mono text-[0.85em]", className)}>
        {children}
      </code>
    );
  }
  return (
    <code className="rounded-md border border-white/50 bg-white/70 px-1.5 py-0.5 font-mono text-[0.85em] text-brand">
      {children}
    </code>
  );
}

// Element → styled renderer map for react-markdown. Typography tuned for
// comfortable long-form reading inside the frosted-glass container.
const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="mt-12 scroll-mt-24 text-2xl font-bold tracking-tight text-foreground sm:text-[1.65rem]">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 scroll-mt-24 text-xl font-semibold tracking-tight text-foreground">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mt-5 leading-[1.75] text-muted-foreground">{children}</p>
  ),
  a: MarkdownLink,
  ul: ({ children }) => (
    <ul className="mt-5 list-disc space-y-2 pl-6 leading-[1.75] text-muted-foreground marker:text-brand">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-5 list-decimal space-y-2 pl-6 leading-[1.75] text-muted-foreground marker:text-brand marker:font-semibold">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-6 rounded-r-xl border-l-4 border-brand/60 bg-white/50 py-1 pl-5 pr-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: MarkdownCode,
  hr: () => <hr className="my-10 border-t border-white/50" />,
  table: ({ children }) => (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-white/50 ring-1 ring-white/40">
      <table className="w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/60 text-foreground">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-white/50 px-4 py-3 font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-white/30 px-4 py-3 align-top text-muted-foreground">
      {children}
    </td>
  ),
};

/**
 * Renders a full blog post: title, meta row (date · reading time) and the
 * Markdown body (GitHub-flavored via `remark-gfm`) inside a frosted-glass
 * article container that floats over the global aurora background.
 */
export default function Article({ post }: { post: BlogPost }) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/50 bg-white/60 p-6 backdrop-blur-xl",
        "ring-1 ring-white/40 shadow-[0_20px_70px_-30px_rgba(30,41,120,0.35)]",
        "sm:p-10",
      )}
    >
      <header className="border-b border-white/50 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl sm:leading-tight">
          {post.title}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="h-4 w-4 text-brand" />
            <time dateTime={post.date}>{formatGreekDate(post.date)}</time>
          </span>
          <span aria-hidden="true" className="text-line">
            ·
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden="true" className="h-4 w-4 text-brand" />
            {post.readingMinutes} λεπτά ανάγνωσης
          </span>
          <span aria-hidden="true" className="text-line">
            ·
          </span>
          <span>{post.author}</span>
        </div>
      </header>

      <div className="mt-2">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {post.body}
        </ReactMarkdown>
      </div>
    </article>
  );
}

import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/lib/blog";

/**
 * Format an ISO `YYYY-MM-DD` date as a long US English date. The `T00:00:00`
 * anchor keeps the day stable regardless of the build machine's timezone.
 */
function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Anchor renderer for Markdown links. Internal (`/…`, `#…`) links use the
 * Next.js client router; external links open in a new tab with safe `rel`.
 * Monochrome: near-black text with a black underline that darkens on hover.
 */
function MarkdownLink({ href, children }: ComponentPropsWithoutRef<"a">) {
  const url = href ?? "#";
  const isInternal = url.startsWith("/") || url.startsWith("#");
  const classes =
    "font-medium text-neutral-900 underline decoration-neutral-400 underline-offset-[3px] [overflow-wrap:anywhere] transition-colors hover:decoration-neutral-900";

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

/**
 * Inline vs. fenced code. Fenced blocks carry a `language-*` class and are
 * placed inside the styled `<pre>` block below, so they render plain here.
 * Inline code gets a gray monospace chip.
 */
function MarkdownCode({
  className,
  children,
}: ComponentPropsWithoutRef<"code">) {
  const isBlock = /language-/.test(className ?? "");
  if (isBlock) {
    return (
      <code className={cn("font-mono text-[0.85em] text-neutral-800", className)}>
        {children}
      </code>
    );
  }
  return (
    <code className="rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 font-mono text-[0.85em] text-neutral-700">
      {children}
    </code>
  );
}

// Shared body-copy sizing so paragraphs, lists and quotes read as one column.
// `break-words` guards against long unbreakable strings/URLs on narrow phones.
const bodyText =
  "text-[1.0625rem] leading-[1.8] text-neutral-800 break-words sm:text-[1.075rem]";

// Element → styled renderer map for react-markdown. Strictly black & white,
// editorial typography tuned for comfortable long-form reading.
const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="mt-14 scroll-mt-24 text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.75rem]">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-10 scroll-mt-24 text-xl font-bold tracking-tight text-neutral-900">
      {children}
    </h3>
  ),
  p: ({ children }) => <p className={cn("mt-6", bodyText)}>{children}</p>,
  a: MarkdownLink,
  ul: ({ children }) => (
    <ul
      className={cn(
        "mt-6 list-disc space-y-2.5 pl-6 marker:text-neutral-400",
        bodyText,
      )}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol
      className={cn(
        "mt-6 list-decimal space-y-2.5 pl-6 marker:font-medium marker:text-neutral-400",
        bodyText,
      )}
    >
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1.5">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-neutral-900">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote
      className={cn(
        "mt-8 border-l-2 border-neutral-900 pl-5 italic text-neutral-700 [&_p]:mt-0",
        bodyText,
      )}
    >
      {children}
    </blockquote>
  ),
  code: MarkdownCode,
  pre: ({ children }) => (
    <pre className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-relaxed">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-14 border-t border-neutral-200" />,
  img: ({ src, alt }) => (
    // Markdown images come from our own trusted post content. Constrain to the
    // reading column so they never cause horizontal overflow on phones.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === "string" ? src : undefined}
      alt={alt ?? ""}
      loading="lazy"
      className="mt-8 h-auto w-full max-w-full rounded-xl border border-neutral-200"
    />
  ),
  table: ({ children }) => (
    <div className="mt-8 overflow-x-auto rounded-xl border border-neutral-200">
      <table className="w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-neutral-50 text-neutral-900">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-neutral-200 px-4 py-3 font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-neutral-200 px-4 py-3 align-top text-neutral-700">
      {children}
    </td>
  ),
};

/**
 * Renders a full blog post: title, meta row (date · reading time · author) and
 * the Markdown body (GitHub-flavored via `remark-gfm`).
 *
 * Design is deliberately black & white and typography-first — an opaque
 * near-white reading surface that covers the site's global aurora, near-black
 * text, gray meta and hairline rules. No brand gradient, glass/backdrop-blur
 * or colorful accents: a premium-magazine reader, not the marketing site.
 */
export default function Article({ post }: { post: BlogPost }) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border border-neutral-200 bg-white text-neutral-900",
        "px-5 py-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:rounded-3xl sm:px-10 sm:py-14",
      )}
    >
      <div className="mx-auto max-w-2xl">
        <header className="border-b border-neutral-200 pb-8">
          <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-neutral-900 [overflow-wrap:anywhere] sm:text-[2.5rem] sm:leading-[1.1]">
            {post.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-neutral-500">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true" className="text-neutral-300">
              ·
            </span>
            <span>{post.readingMinutes} min read</span>
            <span aria-hidden="true" className="text-neutral-300">
              ·
            </span>
            <span>{post.author}</span>
          </div>
        </header>

        <div className="mt-2">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {post.body}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
